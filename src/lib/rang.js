import rangdaten from '../daten/rangstufen.json'
import { maximumSchaetzen } from './training.js'

// Der Rang misst die Last auf der Stange, nicht ein Vielfaches des
// Koerpergewichts (E-128). Er ist eine Spielmechanik fuer den eigenen
// Fortschritt und kein Vergleich mit anderen Menschen. Deshalb gibt es keine
// Normierung nach Koerpergewicht oder Geschlecht, und Maschinenlasten sind
// kein Problem: wer immer im selben Studio trainiert, vergleicht sich mit
// sich selbst.

function positiveZahl(wert) {
  return Number.isFinite(wert) && wert > 0
}

export function schwellenFuer(uebungId, daten = rangdaten) {
  const schwellen = daten?.uebungen?.[uebungId]
  return Array.isArray(schwellen) && schwellen.length === daten.stufen.length ? schwellen : null
}

export function stufeBestimmen(lastKg, schwellen, stufen = rangdaten.stufen) {
  if (!Number.isFinite(lastKg) || lastKg < 0 || !Array.isArray(schwellen)) return null
  let index = -1
  for (let i = 0; i < schwellen.length; i += 1) if (lastKg >= schwellen[i]) index = i
  return index < 0 ? null : { index, name: stufen[index], schwelle: schwellen[index] }
}

export function rangFuerSatz(satz, daten = rangdaten) {
  if (!positiveZahl(satz?.gewichtKg))
    return { status: 'satz_ungueltig', meldung: 'Der Satz enthält keine gültige Last.' }
  const lastKg = satz.gewichtKg
  const schwellen = schwellenFuer(satz.uebungId, daten)
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
export function ranglisteBerechnen(einheiten, uebungen, daten = rangdaten) {
  const katalog = new Map((Array.isArray(uebungen) ? uebungen : []).map((u) => [u.id, u]))
  const beste = new Map()
  for (const einheit of Array.isArray(einheiten) ? einheiten : []) {
    for (const satz of Array.isArray(einheit?.saetze) ? einheit.saetze : []) {
      const uebung = katalog.get(satz?.uebungId)
      if (!uebung) continue
      if (!(satz.wiederholungen >= uebung.wiederholungen.min)) continue
      const ergebnis = rangFuerSatz(satz, daten)
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

export { rangdaten }
