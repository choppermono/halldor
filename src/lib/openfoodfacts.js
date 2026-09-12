import { NAEHRWERTE, PRODUKT_GRENZEN, zahlOderUnbekannt } from './lebensmittel.js'

const felder =
  'code,product_name,product_name_de,brands,nutriments,serving_quantity,serving_quantity_unit,nutrition_data_per'
// API-Dokumentation: https://openfoodfacts.github.io/openfoodfacts-server/api/
const api = 'https://world.openfoodfacts.org'
// Technische Wartezeit (unbelegt), keine fachliche Konstante.
const zeitlimitMs = 12000
const zuordnung = {
  kcal: 'energy-kcal_100g',
  proteinG: 'proteins_100g',
  fettG: 'fat_100g',
  kohlenhydrateG: 'carbohydrates_100g',
  zuckerG: 'sugars_100g',
  gesaettigtG: 'saturated-fat_100g',
  salzG: 'salt_100g',
}

function produktUmwandeln(roh, barcode = null) {
  if (!roh || typeof roh !== 'object' || Array.isArray(roh)) return null
  const text = (wert) =>
    typeof wert === 'string' ? wert.trim().slice(0, PRODUKT_GRENZEN.nameMax) : ''
  const naehrwerte = roh.nutriments && typeof roh.nutriments === 'object' ? roh.nutriments : {}
  // OFF nutzt *_100g auch fuer 100 ml. Ohne Dichte laesst sich ml nicht in g umrechnen.
  const volumenbasis = roh.nutrition_data_per === '100ml'
  const pro100g = Object.fromEntries(
    NAEHRWERTE.map((feld) => [
      feld.key,
      volumenbasis ? null : zahlOderUnbekannt(naehrwerte[zuordnung[feld.key]], feld.max),
    ])
  )
  const portion = zahlOderUnbekannt(roh.serving_quantity, PRODUKT_GRENZEN.portionMax)
  const portionG =
    portion >= PRODUKT_GRENZEN.mengeMin &&
    (!roh.serving_quantity_unit || roh.serving_quantity_unit === 'g') &&
    !volumenbasis
      ? portion
      : null
  return {
    barcode:
      barcode ?? (typeof roh.code === 'string' && /^\d{8,14}$/.test(roh.code) ? roh.code : null),
    name: text(roh.product_name_de) || text(roh.product_name) || 'Produkt ohne Namen',
    marke: text(roh.brands) || null,
    pro100g,
    portionG,
    volumenbasis,
  }
}

async function abfragen(pfad, abrufen) {
  let timer
  try {
    const controller = new AbortController()
    const zeitlimit = new Promise((resolve) => {
      timer = setTimeout(() => {
        controller.abort()
        resolve({
          status: 'zeitlimit',
          meldung: 'Die Abfrage dauert zu lange. Erneut versuchen oder von Hand erfassen.',
        })
      }, zeitlimitMs)
    })
    const anfrage = (async () => {
      let antwort
      try {
        antwort = await abrufen(`${api}${pfad}`, { signal: controller.signal })
      } catch {
        return {
          status: 'netzfehler',
          meldung:
            'Open Food Facts ist nicht erreichbar. Der Verlauf bleibt bedienbar; von Hand erfassen ist weiterhin möglich.',
        }
      }
      if (antwort.status === 503)
        return {
          status: 'dienst_unverfuegbar',
          meldung: 'Open Food Facts ist vorübergehend nicht verfügbar (503). Erneut versuchen.',
        }
      if (antwort.status === 429)
        return {
          status: 'abfragelimit',
          meldung: 'Zu viele Abfragen. Bitte eine Minute warten und erneut versuchen.',
        }
      if (!antwort.ok && antwort.status !== 404)
        return {
          status: 'http_fehler',
          meldung: `Open Food Facts antwortet mit HTTP ${antwort.status}. Erneut versuchen.`,
        }
      let daten
      try {
        daten = await antwort.json()
      } catch {
        return {
          status: 'kein_json',
          meldung: 'Die Antwort von Open Food Facts ist kein gültiges JSON. Erneut versuchen.',
        }
      }
      if (!daten || typeof daten !== 'object' || Array.isArray(daten))
        return {
          status: 'antwort_ungueltig',
          meldung: 'Die Antwort enthält keine lesbaren Produktdaten.',
        }
      return { status: 'ok', daten }
    })()
    return await Promise.race([anfrage, zeitlimit])
  } catch {
    return { status: 'netzfehler', meldung: 'Die Produktabfrage ist nicht verfügbar.' }
  } finally {
    clearTimeout(timer)
  }
}

export async function produktLaden(barcode, abrufen = globalThis.fetch) {
  if (typeof barcode !== 'string' || !/^\d{8,14}$/.test(barcode))
    return {
      status: 'barcode_ungueltig',
      meldung: 'Der Barcode muss aus 8 bis 14 Ziffern bestehen.',
    }
  const antwort = await abfragen(`/api/v2/product/${barcode}.json?fields=${felder}`, abrufen)
  if (antwort.status !== 'ok') return antwort
  if (antwort.daten.status === 0)
    return {
      status: 'unbekannt',
      produkt: null,
      meldung: 'Produkt unbekannt — von Hand eintragen.',
    }
  const produkt = produktUmwandeln(antwort.daten.product, barcode)
  if (antwort.daten.status !== 1 || !produkt)
    return { status: 'antwort_ungueltig', meldung: 'Die Antwort enthält kein lesbares Produkt.' }
  return { status: 'gefunden', produkt }
}

// Schnittstelle ohne Suchoberflaeche; keine Abfrage bei jedem Tastendruck.
export async function produkteSuchen(begriff, abrufen = globalThis.fetch) {
  if (typeof begriff !== 'string' || !begriff.trim() || begriff.length > PRODUKT_GRENZEN.nameMax)
    return { status: 'suchbegriff_ungueltig', meldung: 'Ein Suchbegriff ist erforderlich.' }
  const parameter = new URLSearchParams({
    search_terms: begriff.trim(),
    search_simple: '1',
    action: 'process',
    json: '1',
    fields: felder,
    page_size: '10',
  })
  const antwort = await abfragen(`/cgi/search.pl?${parameter}`, abrufen)
  if (antwort.status !== 'ok') return antwort
  if (!Array.isArray(antwort.daten.products))
    return { status: 'antwort_ungueltig', meldung: 'Die Antwort enthält keine Trefferliste.' }
  return {
    status: 'ergebnis',
    produkte: antwort.daten.products.map((produkt) => produktUmwandeln(produkt)).filter(Boolean),
  }
}
