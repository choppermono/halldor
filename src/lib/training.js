export const TRAININGSREGELN = Object.freeze({
  schaetzungBisWiederholungen: 12,
  deloadNachFehlversuchen: 3,
  deloadFaktor: 0.9,
  schrittKg: Object.freeze({ oberkoerper: 2.5, unterkoerper: 5 }),
})

function fehler(status, meldung, herleitung = {}) {
  return { status, meldung, herleitung }
}

function positiveZahl(wert) {
  return Number.isFinite(wert) && wert > 0
}

function ganzePositiveZahl(wert) {
  return Number.isInteger(wert) && wert > 0
}

export function maximumSchaetzen(gewichtKg, wiederholungen) {
  const herleitung = {
    formel: 'Epley: Gewicht × (1 + Wiederholungen / 30)',
    vergleich: 'Brzycki: Gewicht × 36 / (37 − Wiederholungen)',
    gewichtKg,
    wiederholungen,
    epleyKg: null,
    brzyckiKg: null,
  }
  if (!positiveZahl(gewichtKg) || !ganzePositiveZahl(wiederholungen))
    return fehler(
      'satz_ungueltig',
      'Gewicht und Wiederholungen müssen positive Zahlen sein.',
      herleitung
    )
  if (wiederholungen > TRAININGSREGELN.schaetzungBisWiederholungen)
    return fehler(
      'nicht_geschaetzt',
      `Sätze über ${TRAININGSREGELN.schaetzungBisWiederholungen} Wiederholungen gehen nicht in die Schätzung ein.`,
      herleitung
    )
  const epleyKg = gewichtKg * (1 + wiederholungen / 30)
  const brzyckiKg = (gewichtKg * 36) / (37 - wiederholungen)
  return {
    status: 'ok',
    wert: epleyKg,
    herleitung: { ...herleitung, epleyKg, brzyckiKg },
  }
}

export function gesamtlastBerechnen(saetze) {
  if (!Array.isArray(saetze)) return 0
  return saetze.reduce(
    (summe, satz) =>
      positiveZahl(satz?.gewichtKg) && ganzePositiveZahl(satz?.wiederholungen)
        ? summe + satz.gewichtKg * satz.wiederholungen
        : summe,
    0
  )
}

export function einheitFortschritt(einheit, programmEinheit) {
  const vorgaben = Array.isArray(programmEinheit?.uebungen) ? programmEinheit.uebungen : []
  const saetze = Array.isArray(einheit?.saetze) ? einheit.saetze : []
  const gesamt = vorgaben.reduce((summe, vorgabe) => summe + vorgabe.saetze, 0)
  const erfasst = vorgaben.reduce(
    (summe, vorgabe) =>
      summe +
      Math.min(vorgabe.saetze, saetze.filter((satz) => satz.uebungId === vorgabe.uebungId).length),
    0
  )
  return {
    erfasst,
    gesamt,
    anteil: gesamt ? (erfasst / gesamt) * 100 : 0,
    gesamtlastKg: gesamtlastBerechnen(saetze),
  }
}

// F14 / E-24 ist absichtlich eine benannte Produktregel: Im Defizit ist eine
// gehaltene Last ein Erfolg. Sie steckt nicht als unauffälliges if in der
// Progressionsfunktion und kann getrennt geprüft und erklärt werden.
export function leistungImDefizitBewerten(ziel, vorherigesGewichtKg, aktuellesGewichtKg) {
  const aktiv = ziel === 'abnehmen'
  const gehalten =
    aktiv && positiveZahl(vorherigesGewichtKg) && aktuellesGewichtKg >= vorherigesGewichtKg
  return {
    aktiv,
    gehalten,
    steigerungErforderlich: !aktiv,
    begruendung: aktiv
      ? 'Beim Ziel Abnehmen gilt eine gehaltene Last als Erfolg; eine Steigerung wird nicht verlangt.'
      : 'Ausserhalb eines Abnehmziels gilt die gewöhnliche doppelte Progression.',
  }
}

function saetzeDerUebung(einheit, uebungId) {
  return Array.isArray(einheit?.saetze)
    ? einheit.saetze.filter(
        (satz) =>
          satz?.uebungId === uebungId &&
          positiveZahl(satz.gewichtKg) &&
          ganzePositiveZahl(satz.wiederholungen)
      )
    : []
}

function leistungBewerten(einheit, vorgabe) {
  const saetze = saetzeDerUebung(einheit, vorgabe.uebungId)
  const vollstaendig = saetze.length >= vorgabe.saetze
  const relevanteSaetze = saetze.slice(0, vorgabe.saetze)
  const untergrenzeErreicht =
    vollstaendig && relevanteSaetze.every((satz) => satz.wiederholungen >= vorgabe.min)
  const obergrenzeErreicht =
    vollstaendig && relevanteSaetze.every((satz) => satz.wiederholungen >= vorgabe.max)
  return {
    saetze: relevanteSaetze,
    vollstaendig,
    verfehlt: !untergrenzeErreicht,
    obergrenzeErreicht,
    gewichtKg: relevanteSaetze.length
      ? Math.min(...relevanteSaetze.map((satz) => satz.gewichtKg))
      : null,
    niedrigsteWiederholungen: relevanteSaetze.length
      ? Math.min(...relevanteSaetze.map((satz) => satz.wiederholungen))
      : null,
  }
}

function zeitwert(einheit) {
  const wert = Date.parse(einheit?.abgeschlossenAm ?? `${einheit?.datum ?? ''}T00:00:00`)
  return Number.isFinite(wert) ? wert : 0
}

export function progressionBerechnen({ uebung, vorgabe, einheiten, ziel }) {
  if (
    !uebung ||
    !vorgabe ||
    uebung.id !== vorgabe.uebungId ||
    !Number.isInteger(vorgabe.saetze) ||
    !Number.isInteger(vorgabe.min) ||
    !Number.isInteger(vorgabe.max) ||
    vorgabe.saetze < 1 ||
    vorgabe.min < 1 ||
    vorgabe.max < vorgabe.min
  )
    return fehler('vorgabe_ungueltig', 'Die Satzvorgabe ist ungültig.')

  const verlauf = (Array.isArray(einheiten) ? einheiten : [])
    .filter((einheit) => einheit?.abgeschlossenAm)
    .map((einheit) => ({ einheit, leistung: leistungBewerten(einheit, vorgabe) }))
    // Nur Einheiten, in denen die Uebung tatsaechlich gemacht wurde. Wer eine
    // Last nicht angefasst hat, ist an ihr nicht gescheitert; eine ausgelassene
    // Uebung darf deshalb weder zaehlen noch einen Deload ausloesen.
    .filter(({ leistung }) => leistung.saetze.length > 0)
    .sort((a, b) => zeitwert(a.einheit) - zeitwert(b.einheit))
  const letzte = verlauf.at(-1)?.leistung
  if (!letzte)
    return {
      status: 'start',
      gewichtKg: null,
      wiederholungen: vorgabe.min,
      meldung: `Erste Erfassung: ${vorgabe.saetze} Sätze mit ${vorgabe.min}–${vorgabe.max} Wiederholungen.`,
      herleitung: { grund: 'kein_verlauf', fehlversucheInFolge: 0 },
    }

  const letzteDrei = verlauf.slice(-TRAININGSREGELN.deloadNachFehlversuchen)
  const fehlversucheInFolge = [...verlauf].reverse().findIndex(({ leistung }) => !leistung.verfehlt)
  const serie = fehlversucheInFolge === -1 ? verlauf.length : fehlversucheInFolge
  const letzteMitLast = [...verlauf]
    .reverse()
    .find(({ leistung }) => positiveZahl(leistung.gewichtKg))?.leistung
  const dreiMalVerfehlt =
    letzteDrei.length === TRAININGSREGELN.deloadNachFehlversuchen &&
    letzteDrei.every(({ leistung }) => leistung.verfehlt) &&
    letzteMitLast

  // F14 schuetzt die Unterseite. Im Defizit sinken die Wiederholungen oft,
  // obwohl die Last gehalten wird; genau dort wuerde sonst der Deload greifen.
  // Eine gehaltene Last ist dann ein Erfolg, kein dritter Fehlversuch.
  if (dreiMalVerfehlt) {
    const defizit = leistungImDefizitBewerten(
      ziel,
      letzteDrei[0].leistung.gewichtKg,
      letzteMitLast.gewichtKg
    )
    if (defizit.aktiv && defizit.gehalten)
      return {
        status: 'halten_im_defizit',
        gewichtKg: letzteMitLast.gewichtKg,
        wiederholungen: vorgabe.min,
        meldung: defizit.begruendung,
        herleitung: { grund: 'f14_halten', fehlversucheInFolge: serie, defizit },
      }
  }

  if (dreiMalVerfehlt) {
    // Auf die Schrittweite der Uebung abrunden, nicht auf 0.1 kg: die
    // Schritte sind 2.5 und 5 kg, weil es kleinere Scheiben meist nicht gibt.
    // Ein Deload auf eine nicht ladbare Last widerspraeche dieser Begruendung.
    const schrittKg = TRAININGSREGELN.schrittKg[uebung.bereich]
    if (!positiveZahl(schrittKg))
      return fehler('bereich_ungueltig', 'Für diese Übung ist keine Schrittgrösse hinterlegt.')
    const gewichtKg =
      Math.floor((letzteMitLast.gewichtKg * TRAININGSREGELN.deloadFaktor) / schrittKg) * schrittKg
    return {
      status: 'deload',
      gewichtKg,
      wiederholungen: vorgabe.min,
      meldung: `Nach genau drei verfehlten Einheiten wird die zuletzt erfasste Last um 10 Prozent reduziert.`,
      herleitung: {
        grund: 'drei_verfehlte_einheiten',
        ausgangsgewichtKg: letzteMitLast.gewichtKg,
        faktor: TRAININGSREGELN.deloadFaktor,
        fehlversucheInFolge: serie,
      },
    }
  }

  // Eine verdiente Steigerung gilt auch im Defizit. F14 verlangt keine
  // Steigerung, verbietet sie aber nicht.
  if (letzte.obergrenzeErreicht) {
    const schrittKg = TRAININGSREGELN.schrittKg[uebung.bereich]
    if (!positiveZahl(schrittKg))
      return fehler('bereich_ungueltig', 'Für diese Übung ist keine Schrittgrösse hinterlegt.')
    return {
      status: 'steigern',
      gewichtKg: letzte.gewichtKg + schrittKg,
      wiederholungen: vorgabe.min,
      meldung: `Alle Sätze erreichten den oberen Rand. Die nächste erfasste Last liegt ${schrittKg} kg höher.`,
      herleitung: {
        grund: 'obergrenze_in_allen_saetzen',
        ausgangsgewichtKg: letzte.gewichtKg,
        schrittKg,
        fehlversucheInFolge: 0,
      },
    }
  }

  const naechsteWiederholungen = letzte.verfehlt
    ? vorgabe.min
    : Math.min(vorgabe.max, letzte.niedrigsteWiederholungen + 1)
  return {
    status: letzte.verfehlt ? 'wiederholen' : 'wiederholungen_steigern',
    gewichtKg: letzteMitLast?.gewichtKg ?? null,
    wiederholungen: naechsteWiederholungen,
    meldung: letzte.verfehlt
      ? 'Die Last bleibt gleich; die Untergrenze des Wiederholungsfensters ist erneut das Datenziel.'
      : 'Die Last bleibt gleich; zuerst steigen die Wiederholungen innerhalb des Fensters.',
    herleitung: {
      grund: letzte.verfehlt ? 'untergrenze_verfehlt' : 'doppelte_progression',
      fehlversucheInFolge: serie,
    },
  }
}
