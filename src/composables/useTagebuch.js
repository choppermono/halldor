import { reactive, readonly } from 'vue'
import { dokumentLaden, dokumentSpeichern, Speicherstatus } from '../lib/speicher.js'
import { datumPruefen, zielBerechnen } from '../lib/ernaehrung.js'
import { mengePruefen, produktPruefen } from '../lib/lebensmittel.js'
import { speicherLesbar, speicherhinweis } from '../lib/speicherhinweis.js'

const zustand = reactive({ tage: {}, hinweis: '' })
const lesbar = readonly(zustand)
function tagebuchLaden() {
  const bestand = dokumentLaden()
  zustand.tage = bestand.dokument.tage
  zustand.hinweis = speicherhinweis(bestand.status)
}
function schreiben(dokument) {
  const ergebnis = dokumentSpeichern(dokument)
  zustand.hinweis = speicherhinweis(ergebnis.status)
  if (ergebnis.status !== Speicherstatus.gespeichert)
    return { status: ergebnis.status, meldung: zustand.hinweis }
  zustand.tage = ergebnis.dokument.tage
  return { status: 'ok' }
}
function eintragHinzufuegen(datum, produkt, mengeG, stichtag) {
  const pruefung = produktPruefen(produkt)
  if (pruefung.status !== 'ok') return pruefung
  const menge = mengePruefen(mengeG)
  if (menge.status !== 'ok') return menge
  if (
    datumPruefen(datum).status !== 'ok' ||
    datumPruefen(stichtag).status !== 'ok' ||
    datum > stichtag
  )
    return { status: 'datum_ungueltig', meldung: 'Wähle heute oder einen vergangenen Tag.' }
  const bestand = dokumentLaden()
  if (!speicherLesbar(bestand.status))
    return { status: bestand.status, meldung: speicherhinweis(bestand.status) }
  let tag = bestand.dokument.tage[datum]
  if (tag && (!Array.isArray(tag.eintraege) || !tag.ziel))
    return {
      status: 'tag_ungueltig',
      meldung: 'Dieser gespeicherte Tag ist unlesbar und bleibt unverändert.',
    }
  if (!tag) {
    // Auch rueckdatierte Erfassung verwendet das beim Erfassen gueltige Profil.
    // Ohne Profilhistorie duerfen wir kein damaliges Profil behaupten.
    const ziel = zielBerechnen(bestand.dokument.profil, stichtag)
    if (ziel.status !== 'ok') return ziel
    tag = {
      datum,
      ziel: { ...ziel.wert, herleitung: ziel.herleitung, erfasstAm: stichtag },
      eintraege: [],
    }
  }
  let id
  try {
    // randomUUID fehlt auf unverschlüsselten LAN-Adressen. Zufallsbytes sind
    // dort trotzdem verfügbar; 128 Bit dienen nur der Eintragsidentifikation.
    id = globalThis.crypto.randomUUID
      ? globalThis.crypto.randomUUID()
      : Array.from(globalThis.crypto.getRandomValues(new Uint8Array(16)), (wert) =>
          wert.toString(16).padStart(2, '0')
        ).join('')
  } catch {
    return {
      status: 'kennung_nicht_verfuegbar',
      meldung:
        'Der Browser kann keine Eintragskennung erzeugen. Die Erfassung wurde nicht gespeichert.',
    }
  }
  const eintrag = {
    ...pruefung.wert,
    id,
    zeit: new Date().toISOString(),
    mengeG,
  }
  return schreiben({
    ...bestand.dokument,
    tage: { ...bestand.dokument.tage, [datum]: { ...tag, eintraege: [...tag.eintraege, eintrag] } },
  })
}
function eintragLoeschen(datum, id) {
  if (datumPruefen(datum).status !== 'ok' || typeof id !== 'string')
    return { status: 'eintrag_ungueltig', meldung: 'Der Eintrag ist ungültig.' }
  const bestand = dokumentLaden()
  if (!speicherLesbar(bestand.status))
    return { status: bestand.status, meldung: speicherhinweis(bestand.status) }
  const tag = bestand.dokument.tage[datum]
  if (!tag || !Array.isArray(tag.eintraege) || !tag.eintraege.some((eintrag) => eintrag.id === id))
    return {
      status: 'eintrag_fehlt',
      meldung: 'Der Eintrag ist nicht mehr vorhanden. Lade den Verlauf neu.',
    }
  // Auch nach dem letzten Loeschen bleibt die Ziel-Momentaufnahme erhalten.
  return schreiben({
    ...bestand.dokument,
    tage: {
      ...bestand.dokument.tage,
      [datum]: { ...tag, eintraege: tag.eintraege.filter((eintrag) => eintrag.id !== id) },
    },
  })
}
tagebuchLaden()
export function useTagebuch() {
  return { zustand: lesbar, tagebuchLaden, eintragHinzufuegen, eintragLoeschen }
}
