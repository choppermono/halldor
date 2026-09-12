import {
  REGELN,
  datumPruefen,
  alterBerechnen,
  grundumsatzBerechnen,
  gesamtumsatzBerechnen,
  zielPruefen,
  zielkalorienBerechnen,
  makrosBerechnen,
  profilPruefen,
  zielBerechnen,
} from '../src/lib/ernaehrung.js'
import { produktLaden, produkteSuchen } from '../src/lib/openfoodfacts.js'
import { bilanzBerechnen, produktPruefen } from '../src/lib/lebensmittel.js'
import { dokumentLaden, dokumentZuruecksetzen } from '../src/lib/speicher.js'
import { useProfil } from '../src/composables/useProfil.js'
import { useTagebuch } from '../src/composables/useTagebuch.js'

const ausgabe = document.querySelector('#ergebnis')
const zeilen = []
let eigeneDaten = false
function pruefen(name, bedingung) {
  zeilen.push(`${bedingung ? 'BESTANDEN' : 'FEHLER'}: ${name}`)
  ausgabe.textContent = zeilen.join('\n')
  if (!bedingung) throw new Error(name)
}
function ist(name, ergebnis, status) {
  pruefen(`${name} → ${status}`, ergebnis.status === status)
}
function nahe(a, b) {
  return Math.abs(a - b) < 1e-8
}
const stichtag = '2026-09-12'
const standard = {
  geschlecht: 'm',
  geburtsdatum: '1996-09-12',
  groesseCm: 180,
  aktivitaet: 1.55,
  ziel: 'halten',
  aenderungsrateProzent: 0.5,
  gewichtsverlauf: [{ datum: '2026-09-11', kg: 80 }],
  hinweisBestaetigt: true,
}
const produkt = {
  name: 'Testprodukt',
  marke: null,
  barcode: null,
  pro100g: { kcal: 200, proteinG: 10, fettG: 5, kohlenhydrateG: 20 },
}

try {
  if (dokumentLaden().status !== 'leer')
    throw new Error('Ursprung enthält Daten; ohne Änderung abgebrochen.')
  ist('Schalttag gültig', datumPruefen('2024-02-29'), 'ok')
  for (const datum of [
    '2025-02-29',
    '2026-04-31',
    '2026-13-01',
    '2026-00-01',
    '0000-01-01',
    '2026-9-12',
    '',
    null,
    undefined,
    NaN,
  ])
    ist(`Ungültiges Datum ${datum}`, datumPruefen(datum), 'datum_ungueltig')
  pruefen('Am Geburtstag 30', alterBerechnen('1996-09-12', stichtag).wert === 30)
  pruefen('Vor Geburtstag 29', alterBerechnen('1996-09-13', stichtag).wert === 29)
  pruefen('Schalttag vor März noch 17', alterBerechnen('2008-02-29', '2026-02-28').wert === 17)
  pruefen('Schalttag ab März 18', alterBerechnen('2008-02-29', '2026-03-01').wert === 18)
  ist('Geburt in Zukunft', alterBerechnen('2027-01-01', stichtag), 'geburt_in_zukunft')
  ist('Unter 18 abnehmen direkt im Kern gesperrt', zielPruefen('abnehmen', 17), 'ziel_altersgrenze')
  ist('Unter 18 halten erlaubt', zielPruefen('halten', 17), 'ok')
  ist('Unter 18 aufbauen erlaubt', zielPruefen('aufbauen', 17), 'ok')
  ist('Ab 18 abnehmen erlaubt', zielPruefen('abnehmen', 18), 'ok')
  ist('Unbekanntes Ziel', zielPruefen('rennen', 30), 'ziel_unbekannt')
  const mann = grundumsatzBerechnen({ ...standard, gewichtKg: 80, stichtag })
  const frau = grundumsatzBerechnen({ ...standard, geschlecht: 'w', gewichtKg: 80, stichtag })
  pruefen('Mifflin männlich 1780', mann.wert === 1780)
  pruefen('Mifflin weiblich 1614', frau.wert === 1614)
  pruefen('TDEE 2759', gesamtumsatzBerechnen(mann.wert, 1.55).wert === 2759)
  const ziel = zielBerechnen(standard, stichtag)
  ist('Gesamtes Ziel', ziel, 'ok')
  pruefen('Kalorien unverändert bei Halten', ziel.wert.kcal === 2759)
  pruefen('Protein 128 g', ziel.wert.proteinG === 128)
  pruefen('Fett 64 g', ziel.wert.fettG === 64)
  pruefen('Restkohlenhydrate 417.75 g', ziel.wert.kohlenhydrateG === 417.75)
  pruefen('Keine erfundene Deckelung', ziel.wert.untergrenzeAktiv === false)
  pruefen(
    'Herleitung vollständig',
    [
      'formel',
      'bmrKcal',
      'tdeeKcal',
      'rateProzent',
      'gewichtKg',
      'rechnung',
      'alter',
      'stichtag',
    ].every((key) => ziel.herleitung[key] !== null && ziel.herleitung[key] !== undefined)
  )
  const abnehmen = zielBerechnen({ ...standard, ziel: 'abnehmen' }, stichtag)
  pruefen('Rate zuerst: 0.4 kg/Woche', abnehmen.herleitung.kgJeWoche === 0.4)
  pruefen(
    'Daraus 440 kcal Defizit',
    abnehmen.herleitung.aenderungKcal === 440 && abnehmen.wert.kcal === 2319
  )
  pruefen(
    'Aufbau verwendet positiven Zuschlag',
    zielBerechnen({ ...standard, ziel: 'aufbauen' }, stichtag).wert.kcal === 3199
  )
  const niedrig = {
    ...standard,
    geschlecht: 'w',
    geburtsdatum: '1956-09-12',
    groesseCm: 140,
    aktivitaet: 1.2,
    ziel: 'abnehmen',
    aenderungsrateProzent: 1,
    gewichtsverlauf: [{ datum: stichtag, kg: 40 }],
  }
  const ungueltig = zielBerechnen(niedrig, stichtag)
  ist('Leichte Person, hohe Rate: kein Makroziel', ungueltig, 'makroziel_ungueltig')
  pruefen('Kein erfundenes Ziel im Fehlerfall', ungueltig.wert === undefined)
  pruefen(
    'Höchste Rate unter gewählter Rate',
    ungueltig.hoechsteRateProzent > 0.5 && ungueltig.hoechsteRateProzent < 1
  )
  ist(
    'Höchste zurückgegebene Rate ist einsetzbar',
    zielBerechnen({ ...niedrig, aenderungsrateProzent: ungueltig.hoechsteRateProzent }, stichtag),
    'ok'
  )
  ist(
    'Über der Grenze wieder ungültig',
    zielBerechnen(
      { ...niedrig, aenderungsrateProzent: ungueltig.hoechsteRateProzent + 0.000002 },
      stichtag
    ),
    'makroziel_ungueltig'
  )
  pruefen(
    'Niedrige gültige Kalorien werden nicht auf 1200/1500 geklemmt',
    zielBerechnen({ ...niedrig, aenderungsrateProzent: 0.5 }, stichtag).wert.kcal < 1200
  )
  ist('Makros unter Anker liefern Fehler', makrosBerechnen(500, 40), 'makroziel_ungueltig')
  pruefen(
    'Genau am Anker sind 0 g Kohlenhydrate mathematisch korrekt',
    makrosBerechnen(544, 40).wert.kohlenhydrateG === 0
  )
  const zuWenig = zielkalorienBerechnen({
    tdeeKcal: 500,
    gewichtKg: 80,
    ziel: 'abnehmen',
    alter: 30,
    rateProzent: 1,
  })
  pruefen(
    'Wenn selbst Halten unmöglich: keine erfundene Maximalrate',
    zuWenig.hoechsteRateProzent === null && !zuWenig.rateInSpanne
  )
  for (const wert of [NaN, Infinity, -Infinity, -1, 0, '', null, undefined, {}, '80']) {
    pruefen(
      `Ungültiges Gewicht ${String(wert)} benannt`,
      grundumsatzBerechnen({ ...standard, gewichtKg: wert, stichtag }).status !== 'ok'
    )
    pruefen(`Ungültige Energie ${String(wert)} benannt`, makrosBerechnen(wert, 80).status !== 'ok')
  }
  for (const funktion of [
    grundumsatzBerechnen,
    zielkalorienBerechnen,
    profilPruefen,
    zielBerechnen,
  ])
    for (const wert of [null, undefined, NaN, '', 42, []])
      pruefen(
        `${funktion.name} fängt ${String(wert)} ab`,
        typeof funktion(wert, stichtag).status === 'string'
      )
  ist('Ungültiger Aktivitätsfaktor', gesamtumsatzBerechnen(1700, 1.4), 'aktivitaet_ungueltig')
  ist(
    'Überlauf wird benannt',
    gesamtumsatzBerechnen(Number.MAX_VALUE, 1.9),
    'gesamtumsatz_unplausibel'
  )
  ist(
    'Hinweis muss bestätigt werden',
    zielBerechnen({ ...standard, hinweisBestaetigt: false }, stichtag),
    'hinweis_offen'
  )
  ist(
    'Altersregel auch durch Gesamtberechnung',
    zielBerechnen({ ...standard, geburtsdatum: '2009-09-12', ziel: 'abnehmen' }, stichtag),
    'ziel_altersgrenze'
  )
  pruefen(
    'Profil ohne neues Ratenfeld bleibt lesbar',
    zielBerechnen({ ...standard, aenderungsrateProzent: undefined }, stichtag).status === 'ok'
  )
  ist(
    'Ungeordneter Verlauf abgewiesen',
    zielBerechnen(
      {
        ...standard,
        gewichtsverlauf: [
          { datum: stichtag, kg: 80 },
          { datum: '2026-09-11', kg: 81 },
        ],
      },
      stichtag
    ),
    'gewichtsverlauf_ungueltig'
  )
  pruefen(
    'Datum wird ausdrücklich übergeben: späteres Gewicht nicht rückwirkend',
    zielBerechnen(
      {
        ...standard,
        gewichtsverlauf: [...standard.gewichtsverlauf, { datum: '2026-09-13', kg: 85 }],
      },
      stichtag
    ).wert.basis.gewichtKg === 80
  )
  let alleGueltig = true
  for (const kg of [20, 40, 60, 80, 150, 400])
    for (const geschlecht of ['m', 'w'])
      for (const rate of [0.5, 0.75, 1])
        for (const aktivitaet of REGELN.aktivitaeten) {
          const ergebnis = zielBerechnen(
            {
              ...standard,
              geschlecht,
              aktivitaet,
              ziel: 'abnehmen',
              aenderungsrateProzent: rate,
              gewichtsverlauf: [{ datum: stichtag, kg }],
            },
            stichtag
          )
          if (ergebnis.status === 'ok')
            alleGueltig &&=
              ergebnis.wert.kohlenhydrateG >= 0 &&
              Object.values(ergebnis.wert)
                .filter((wert) => typeof wert === 'number')
                .every(Number.isFinite)
          else alleGueltig &&= ergebnis.status === 'makroziel_ungueltig'
        }
  pruefen('180 Körper-/Aktivitäts-/Ratenkombinationen ohne negative Makros', alleGueltig)

  const antwort =
    (daten, http = 200) =>
    async () => ({ ok: http >= 200 && http < 300, status: http, json: async () => daten })
  let aufrufe = 0
  const nichtAufrufen = async () => {
    aufrufe++
    return {}
  }
  for (const barcode of ['', '123', '123456789012345', '<script>', '1234567a', null, 3017620422003])
    ist(
      'Barcode vor Netzwerk validiert',
      await produktLaden(barcode, nichtAufrufen),
      'barcode_ungueltig'
    )
  pruefen('Kein Netzwerk bei ungültigem Barcode', aufrufe === 0)
  ist(
    'status 0 ist Ergebnis',
    await produktLaden('3017620422003', antwort({ status: 0 })),
    'unbekannt'
  )
  ist(
    'status 0 auch bei HTTP 404',
    await produktLaden('3017620422003', antwort({ status: 0 }, 404)),
    'unbekannt'
  )
  ist('503 benannt', await produktLaden('3017620422003', antwort({}, 503)), 'dienst_unverfuegbar')
  ist('429 benannt', await produktLaden('3017620422003', antwort({}, 429)), 'abfragelimit')
  ist('500 benannt', await produktLaden('3017620422003', antwort({}, 500)), 'http_fehler')
  ist(
    'HTML statt JSON',
    await produktLaden('3017620422003', async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('HTML')
      },
    })),
    'kein_json'
  )
  ist(
    'Netzausfall benannt',
    await produktLaden('3017620422003', async () => {
      throw new TypeError('offline')
    }),
    'netzfehler'
  )
  ist(
    'Leere Antwort benannt',
    await produktLaden('3017620422003', antwort(null)),
    'antwort_ungueltig'
  )
  const ohne = await produktLaden(
    '3017620422003',
    antwort({ status: 1, product: { product_name: '<img src=x onerror=alert(1)>' } })
  )
  pruefen('Fremder Name bleibt Text', ohne.produkt.name === '<img src=x onerror=alert(1)>')
  pruefen(
    'Fehlende Pflichtwerte sind null',
    Object.values(ohne.produkt.pro100g).every((wert) => wert === null)
  )
  ist('Produkt ohne Nährwerte erfassbar', produktPruefen(ohne.produkt), 'ok')
  const portion = await produktLaden('3017620422003', async (url) => {
    pruefen('fields ist immer gesetzt', new URL(url).searchParams.has('fields'))
    return {
      ok: true,
      status: 200,
      json: async () => ({
        status: 1,
        product: {
          serving_quantity: 15,
          nutriments: {
            'energy-kcal_100g': 0,
            proteins_100g: '6.3',
            fat_100g: -2,
            carbohydrates_100g: 150,
          },
        },
      }),
    }
  })
  pruefen('Plausible Portion übernommen', portion.produkt.portionG === 15)
  pruefen('Echte Null bleibt Null', portion.produkt.pro100g.kcal === 0)
  pruefen('Numerischer API-String lesbar', portion.produkt.pro100g.proteinG === 6.3)
  pruefen(
    'Unplausible Werte bleiben unbekannt',
    portion.produkt.pro100g.fettG === null && portion.produkt.pro100g.kohlenhydrateG === null
  )
  for (const wert of [-1, 0, 100000, 'abc'])
    pruefen(
      'Unplausible Portion nicht vorbelegt',
      (
        await produktLaden(
          '3017620422003',
          antwort({ status: 1, product: { serving_quantity: wert } })
        )
      ).produkt.portionG === null
    )
  const volumen = await produktLaden(
    '3017620422003',
    antwort({
      status: 1,
      product: {
        serving_quantity: 250,
        serving_quantity_unit: 'ml',
        nutrition_data_per: '100ml',
        nutriments: { 'energy-kcal_100g': 50 },
      },
    })
  )
  pruefen(
    'ml nicht still als Gramm behandelt',
    volumen.produkt.portionG === null && volumen.produkt.pro100g.kcal === null
  )
  const suche = await produkteSuchen('xyz', antwort({ products: [] }))
  pruefen(
    'Leere Trefferliste ist Ergebnis',
    suche.status === 'ergebnis' && suche.produkte.length === 0
  )
  const gemischt = bilanzBerechnen([
    { ...produkt, mengeG: 50 },
    { ...ohne.produkt, mengeG: 100 },
  ])
  pruefen(
    'Unbekannte Energie macht Bilanz unvollständig',
    gemischt.kcal.bekannt === 100 && gemischt.kcal.unbekannt === 1 && !gemischt.kcal.vollstaendig
  )
  pruefen(
    'Gramm werden proportional gerechnet',
    bilanzBerechnen([{ ...produkt, mengeG: 25 }]).proteinG.bekannt === 2.5
  )

  const profil = useProfil()
  const tagebuch = useTagebuch()
  eigeneDaten = true
  ist('Profil speicherbar', profil.profilSpeichern(standard, stichtag), 'ok')
  pruefen('Profil erzeugt noch keinen Tag', Object.keys(dokumentLaden().dokument.tage).length === 0)
  ist(
    'Erster Eintrag erzeugt Tag',
    tagebuch.eintragHinzufuegen(stichtag, produkt, 50, stichtag),
    'ok'
  )
  const eingefroren = JSON.stringify(dokumentLaden().dokument.tage[stichtag].ziel)
  const momentaufnahme = JSON.stringify(dokumentLaden().dokument.tage[stichtag].eintraege[0])
  produkt.pro100g.kcal = 900
  pruefen(
    'Produktänderung verändert gespeicherten Eintrag nicht',
    JSON.stringify(dokumentLaden().dokument.tage[stichtag].eintraege[0]) === momentaufnahme
  )
  ist('Profil ändern', profil.profilSpeichern({ ...standard, ziel: 'abnehmen' }, stichtag), 'ok')
  pruefen(
    'Altes Tagesziel bleibt bytegleich',
    JSON.stringify(dokumentLaden().dokument.tage[stichtag].ziel) === eingefroren
  )
  ist('Zweiter Eintrag', tagebuch.eintragHinzufuegen(stichtag, ohne.produkt, 15, stichtag), 'ok')
  pruefen(
    'Zweiter Eintrag friert Ziel nicht neu ein',
    JSON.stringify(dokumentLaden().dokument.tage[stichtag].ziel) === eingefroren
  )
  for (const eintrag of [...dokumentLaden().dokument.tage[stichtag].eintraege])
    ist('Eintrag löschen', tagebuch.eintragLoeschen(stichtag, eintrag.id), 'ok')
  pruefen(
    'Nach letztem Löschen Ziel erhalten',
    JSON.stringify(dokumentLaden().dokument.tage[stichtag].ziel) === eingefroren
  )
  pruefen(
    'Bilanz nach Löschen wieder leer',
    bilanzBerechnen(dokumentLaden().dokument.tage[stichtag].eintraege).kcal.bekannt === 0
  )
  ist(
    'Neuer Tag folgt geändertem Profil',
    tagebuch.eintragHinzufuegen('2026-09-13', produkt, 25, '2026-09-13'),
    'ok'
  )
  pruefen(
    'Neues Ziel entspricht neuer Berechnung',
    nahe(dokumentLaden().dokument.tage['2026-09-13'].ziel.kcal, abnehmen.wert.kcal)
  )
  ist(
    'Menge NaN abgewiesen',
    tagebuch.eintragHinzufuegen(stichtag, produkt, NaN, stichtag),
    'menge_ungueltig'
  )
  ist(
    'Datum in Zukunft abgewiesen',
    tagebuch.eintragHinzufuegen('2027-01-01', produkt, 50, stichtag),
    'datum_ungueltig'
  )
  pruefen('Speicherversion bleibt 1', dokumentLaden().dokument.version === 1)
  ist('Eigene Testdaten aufräumen', dokumentZuruecksetzen(true), 'zurueckgesetzt')
  eigeneDaten = false
  zeilen.push(`ABSCHLUSS: ${zeilen.length} Prüfpunkte bestanden; Ursprung wieder leer.`)
} catch (fehler) {
  zeilen.push(`ABBRUCH: ${fehler.message}`)
} finally {
  if (eigeneDaten) dokumentZuruecksetzen(true)
  ausgabe.textContent = zeilen.join('\n')
}
