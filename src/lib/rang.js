import standards from '../daten/kraftstandards.json'
import { maximumSchaetzen } from './training.js'

function positiveZahl(wert) {
  return Number.isFinite(wert) && wert > 0
}

export function schwellenFuer(uebungId, geschlecht, daten = standards) {
  if (!['m', 'w'].includes(geschlecht)) return null
  const eintrag = daten?.uebungen?.[uebungId]
  if (!eintrag) return null
  if (eintrag.typ === 'anker') return eintrag.schwellen?.[geschlecht] ?? null
  if (eintrag.typ !== 'abgeleitet') return null
  const anker = daten.uebungen?.[eintrag.anker]
  const basis = anker?.schwellen?.[geschlecht]
  const faktor = eintrag.verhaeltnis?.[geschlecht]
  return Array.isArray(basis) && positiveZahl(faktor)
    ? basis.map((schwelle) => schwelle * faktor)
    : null
}

export function stufeBestimmen(vielfaches, schwellen, stufen = standards.stufen) {
  if (!Number.isFinite(vielfaches) || vielfaches < 0 || !Array.isArray(schwellen)) return null
  let index = -1
  for (let i = 0; i < schwellen.length; i += 1) if (vielfaches >= schwellen[i]) index = i
  return index < 0 ? null : { index, name: stufen[index], schwelle: schwellen[index] }
}

export function rangFuerSatz(satz, daten = standards) {
  const schaetzung = maximumSchaetzen(satz?.gewichtKg, satz?.wiederholungen)
  if (schaetzung.status !== 'ok') return schaetzung
  const koerpergewichtKg = satz?.momentaufnahme?.koerpergewichtKg
  if (!positiveZahl(koerpergewichtKg))
    return {
      status: 'koerpergewicht_fehlt',
      meldung: 'Zum erfassten Satz fehlt die Momentaufnahme des Körpergewichts.',
      herleitung: schaetzung.herleitung,
    }
  const geschlecht = satz?.momentaufnahme?.geschlecht ?? ''
  const vielfaches = schaetzung.wert / koerpergewichtKg
  const schwellen = schwellenFuer(satz.uebungId, geschlecht, daten)
  const stufe = stufeBestimmen(vielfaches, schwellen, daten.stufen)
  const naechsteIndex = stufe ? stufe.index + 1 : 0
  const naechsteSchwelle = schwellen?.[naechsteIndex] ?? null
  const standard = daten.uebungen?.[satz.uebungId] ?? null
  let grund = null
  if (!['m', 'w'].includes(geschlecht)) grund = 'geschlecht_fehlt'
  else if (!schwellen) grund = 'standard_fehlt'
  return {
    status: 'ok',
    wert: {
      geschaetztesMaximumKg: schaetzung.wert,
      vielfaches,
      stufe,
      naechsteStufe: naechsteSchwelle === null ? null : daten.stufen[naechsteIndex],
      abstandKg:
        naechsteSchwelle === null
          ? null
          : Math.max(0, naechsteSchwelle * koerpergewichtKg - schaetzung.wert),
      grund,
    },
    herleitung: {
      ...schaetzung.herleitung,
      koerpergewichtKg,
      geschlecht,
      vielfaches,
      schwellen,
      standardTyp: standard?.typ ?? null,
      standardQuelle: standard?.quelle ?? null,
      anker: standard?.anker ?? null,
      verhaeltnis: standard?.verhaeltnis?.[geschlecht] ?? null,
    },
  }
}

export function ranglisteBerechnen(einheiten, uebungen, daten = standards) {
  const namen = new Map(
    (Array.isArray(uebungen) ? uebungen : []).map((uebung) => [uebung.id, uebung.name])
  )
  const beste = new Map()
  for (const einheit of Array.isArray(einheiten) ? einheiten : []) {
    for (const satz of Array.isArray(einheit?.saetze) ? einheit.saetze : []) {
      const ergebnis = rangFuerSatz(satz, daten)
      if (ergebnis.status !== 'ok') continue
      const bisher = beste.get(satz.uebungId)
      if (!bisher || ergebnis.wert.vielfaches > bisher.wert.vielfaches)
        beste.set(satz.uebungId, {
          ...ergebnis,
          uebungId: satz.uebungId,
          uebungName: satz.momentaufnahme?.uebungName ?? namen.get(satz.uebungId) ?? satz.uebungId,
          satz,
        })
    }
  }
  return [...beste.values()].sort((a, b) => a.uebungName.localeCompare(b.uebungName, 'de'))
}

export { standards as kraftstandards }
