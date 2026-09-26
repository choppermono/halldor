import rangdaten from '../daten/rangstufen.json'
import { maximumSchaetzen } from './training.js'

// Der Rang misst die Last auf der Stange, nicht ein Vielfaches des
// Koerpergewichts. Die Schwellen sind fest und fuer alle gleich, getrennt nur
// nach Geschlecht (E-133): Gold bei der Beinpresse soll bei jeder Person
// dasselbe bedeuten, sonst ist kein Vergleich untereinander moeglich.

function positiveZahl(wert) {
  return Number.isFinite(wert) && wert > 0
}

// Ein Eintrag ist entweder eine einzelne Tabelle fuer alle oder ein Objekt
// mit je einer Tabelle fuer m und w. Ohne Geschlecht gibt es bei getrennten
// Tabellen keine Skala: raten hiesse, jemanden an der falschen Tabelle zu
// messen.
export function schwellenFuer(uebungId, daten = rangdaten, geschlecht = null) {
  const eintrag = daten?.uebungen?.[uebungId]
  const schwellen = Array.isArray(eintrag) ? eintrag : eintrag?.[geschlecht]
  return Array.isArray(schwellen) && schwellen.length === daten.stufen.length ? schwellen : null
}

export function stufeBestimmen(lastKg, schwellen, stufen = rangdaten.stufen) {
  if (!Number.isFinite(lastKg) || lastKg < 0 || !Array.isArray(schwellen)) return null
  let index = -1
  for (let i = 0; i < schwellen.length; i += 1) if (lastKg >= schwellen[i]) index = i
  return index < 0 ? null : { index, name: stufen[index], schwelle: schwellen[index] }
}

export function rangFuerSatz(satz, daten = rangdaten, geschlecht = null) {
  if (!positiveZahl(satz?.gewichtKg))
    return { status: 'satz_ungueltig', meldung: 'Der Satz enthält keine gültige Last.' }
  const lastKg = satz.gewichtKg
  const schwellen = schwellenFuer(satz.uebungId, daten, geschlecht)
  const stufe = stufeBestimmen(lastKg, schwellen, daten.stufen)
  const naechsteIndex = stufe ? stufe.index + 1 : 0
  const naechsteSchwelle = schwellen?.[naechsteIndex] ?? null
  // Das geschaetzte Maximum steht nur noch zur Einordnung in der Herleitung.
  // Gerankt wird nach der tatsaechlich bewegten Last, weil die jeder versteht.
  const schaetzung = maximumSchaetzen(satz.gewichtKg, satz.wiederholungen)
  return {
    status: 'ok',
    wert: {
      lastKg,
      stufe,
      naechsteStufe: naechsteSchwelle === null ? null : daten.stufen[naechsteIndex],
      abstandKg: naechsteSchwelle === null ? null : Math.max(0, naechsteSchwelle - lastKg),
      grund: schwellen ? null : 'stufen_fehlen',
    },
    herleitung: {
      gewichtKg: satz.gewichtKg,
      wiederholungen: satz.wiederholungen,
      epleyKg: schaetzung.status === 'ok' ? schaetzung.herleitung.epleyKg : null,
      brzyckiKg: schaetzung.status === 'ok' ? schaetzung.herleitung.brzyckiKg : null,
      schwellen,
    },
  }
}

// Zaehlt nur Saetze, die die Untergrenze des Wiederholungsfensters erreicht
// haben. Sonst liesse sich der Rang mit einem einzelnen schweren Versuch
// erschleichen, der mit dem Training nichts zu tun hat.
export function ranglisteBerechnen(einheiten, uebungen, daten = rangdaten, geschlecht = null) {
  const katalog = new Map((Array.isArray(uebungen) ? uebungen : []).map((u) => [u.id, u]))
  const beste = new Map()
  for (const einheit of Array.isArray(einheiten) ? einheiten : []) {
    for (const satz of Array.isArray(einheit?.saetze) ? einheit.saetze : []) {
      const uebung = katalog.get(satz?.uebungId)
      if (!uebung) continue
      if (!(satz.wiederholungen >= uebung.wiederholungen.min)) continue
      const ergebnis = rangFuerSatz(satz, daten, geschlecht)
      if (ergebnis.status !== 'ok') continue
      const bisher = beste.get(satz.uebungId)
      const besser =
        !bisher ||
        ergebnis.wert.lastKg > bisher.wert.lastKg ||
        (ergebnis.wert.lastKg === bisher.wert.lastKg &&
          satz.wiederholungen > bisher.satz.wiederholungen)
      if (besser)
        beste.set(satz.uebungId, {
          ...ergebnis,
          uebungId: satz.uebungId,
          uebungName: uebung.name,
          mindestWiederholungen: uebung.wiederholungen.min,
          satz,
        })
    }
  }
  // Reihenfolge des Programms statt Alphabet: so steht die Liste in derselben
  // Abfolge wie das Training.
  const reihenfolge = [...katalog.keys()]
  return [...beste.values()].sort(
    (a, b) => reihenfolge.indexOf(a.uebungId) - reihenfolge.indexOf(b.uebungId)
  )
}

// Punkte einer Uebung, fliessend von 0 bis Stufenzahl + 1 (heute 7): unter
// Bronze 0 bis 1, jede Stufe ein ganzer Punkt, die hoechste Stufe (Olymp)
// bis zu einem Punkt mehr, je nachdem, wie weit die Last darueber liegt
// (eine Stufenbreite darueber ergibt das Maximum).
export function uebungsPunkte(lastKg, schwellen) {
  if (!positiveZahl(lastKg) || !Array.isArray(schwellen)) return 0
  if (lastKg < schwellen[0]) return lastKg / schwellen[0]
  const oben = schwellen.length - 1
  for (let i = 0; i < oben; i++)
    if (lastKg < schwellen[i + 1])
      return i + 1 + (lastKg - schwellen[i]) / (schwellen[i + 1] - schwellen[i])
  const breite = schwellen[oben] - schwellen[oben - 1]
  return oben + 1 + Math.min(1, (lastKg - schwellen[oben]) / breite)
}

const DIVISIONEN = ['III', 'II', 'I']

// Gesamtrang (E-140): Durchschnitt der Uebungspunkte ueber ALLE Uebungen des
// Plans. Nicht trainierte Uebungen zaehlen 0; sonst reichte eine einzige
// starke Uebung fuer einen hohen Gesamtrang. Jede Stufe hat drei Divisionen
// wie in Spielen, III ist die unterste.
export function gesamtrangBerechnen(einheiten, uebungen, daten = rangdaten, geschlecht = null) {
  const katalog = Array.isArray(uebungen) ? uebungen : []
  if (!katalog.length) return { status: 'keine_uebungen' }
  if (!katalog.every((uebung) => schwellenFuer(uebung.id, daten, geschlecht)))
    return { status: 'skala_fehlt', meldung: 'Für den Gesamtrang fehlt die Rangskala.' }
  const beste = new Map(
    ranglisteBerechnen(einheiten, katalog, daten, geschlecht).map((rang) => [
      rang.uebungId,
      rang.wert.lastKg,
    ])
  )
  const einzeln = katalog.map((uebung) =>
    uebungsPunkte(beste.get(uebung.id), schwellenFuer(uebung.id, daten, geschlecht))
  )
  const punkte = einzeln.reduce((summe, wert) => summe + wert, 0) / katalog.length
  const stufenIndex = Math.min(daten.stufen.length, Math.floor(punkte)) - 1
  const inStufe = stufenIndex >= daten.stufen.length - 1 ? punkte - daten.stufen.length : punkte % 1
  return {
    status: 'ok',
    punkte,
    stufe: stufenIndex >= 0 ? { index: stufenIndex, name: daten.stufen[stufenIndex] } : null,
    division: stufenIndex >= 0 ? DIVISIONEN[Math.min(2, Math.floor(inStufe * 3))] : null,
    anteilInStufe: stufenIndex >= 0 ? Math.min(1, inStufe) : punkte,
    gewertet: beste.size,
    gesamt: katalog.length,
  }
}

export { rangdaten }
