import programme from '../src/daten/programme.json'
import uebungen from '../src/daten/uebungen.json'
import {
  gesamtlastBerechnen,
  leistungImDefizitBewerten,
  maximumSchaetzen,
  progressionBerechnen,
  schrittFuer,
} from '../src/lib/training.js'
import {
  gesamtrangBerechnen,
  rangdaten,
  rangFuerSatz,
  ranglisteBerechnen,
  schwellenFuer,
  stufeBestimmen,
  uebungsPunkte,
} from '../src/lib/rang.js'

const ausgabe = document.querySelector('#ergebnis')
const zeilen = []
function pruefen(name, bedingung) {
  zeilen.push(`${bedingung ? 'BESTANDEN' : 'FEHLER'}: ${name}`)
  ausgabe.textContent = zeilen.join('\n')
  if (!bedingung) throw new Error(name)
}
function nahe(a, b) {
  return Math.abs(a - b) < 1e-8
}
function einheit(uebungId, wiederholungen, index, gewichtKg = 100) {
  return {
    datum: `2026-09-${String(index + 1).padStart(2, '0')}`,
    abgeschlossenAm: `2026-09-${String(index + 1).padStart(2, '0')}T12:00:00.000Z`,
    saetze: [0, 1, 2].map((satzIndex) => ({
      id: `${index}-${satzIndex}`,
      uebungId,
      gewichtKg,
      wiederholungen,
      zeit: `2026-09-${String(index + 1).padStart(2, '0')}T11:00:00.000Z`,
    })),
  }
}
function ausgelasseneEinheit(uebungId, index) {
  return {
    datum: `2026-09-${String(index + 1).padStart(2, '0')}`,
    abgeschlossenAm: `2026-09-${String(index + 1).padStart(2, '0')}T12:00:00.000Z`,
    vorgaben: [{ uebungId, saetze: 3, min: 5, max: 8 }],
    saetze: [],
  }
}

try {
  const zehn = maximumSchaetzen(100, 10)
  pruefen('Epley 100 kg × 10 = 133.333… kg', nahe(zehn.herleitung.epleyKg, 400 / 3))
  pruefen('Brzycki 100 kg × 10 = 133.333… kg', nahe(zehn.herleitung.brzyckiKg, 400 / 3))
  const fuenf = maximumSchaetzen(80, 5)
  pruefen('Epley 80 kg × 5 = 93.333… kg', nahe(fuenf.herleitung.epleyKg, 280 / 3))
  pruefen('Brzycki 80 kg × 5 = 90 kg', nahe(fuenf.herleitung.brzyckiKg, 90))
  pruefen('12 Wiederholungen werden geschätzt', maximumSchaetzen(50, 12).status === 'ok')
  pruefen(
    '13 Wiederholungen werden nicht geschätzt',
    maximumSchaetzen(50, 13).status === 'nicht_geschaetzt'
  )
  pruefen(
    'Gesamtlast ist Gewicht × Wiederholungen',
    gesamtlastBerechnen([
      { gewichtKg: 50, wiederholungen: 8 },
      { gewichtKg: 60, wiederholungen: 5 },
    ]) === 700
  )

  // Feste Prüfübungen: die Progressionslogik wird unabhängig vom
  // jeweiligen Katalog geprüft, der sich mit dem Programm ändert.
  const uebung = { id: 'bankdruecken', bereich: 'oberkoerper' }
  const vorgabe = { uebungId: 'bankdruecken', saetze: 3, min: 5, max: 8 }
  const aufwaerts = progressionBerechnen({
    uebung,
    vorgabe,
    einheiten: [einheit('bankdruecken', 8, 0)],
    ziel: 'halten',
  })
  pruefen(
    'Oberkörper steigt nach oberem Rand um 2.5 kg',
    aufwaerts.status === 'steigern' &&
      aufwaerts.gewichtKg === 102.5 &&
      aufwaerts.wiederholungen === 5
  )
  const unterkoerper = { id: 'kniebeuge', bereich: 'unterkoerper' }
  const unterVorgabe = { ...vorgabe, uebungId: 'kniebeuge' }
  pruefen(
    'Unterkörper steigt nach oberem Rand um 5 kg',
    progressionBerechnen({
      uebung: unterkoerper,
      vorgabe: unterVorgabe,
      einheiten: [einheit('kniebeuge', 8, 0)],
      ziel: 'halten',
    }).gewichtKg === 105
  )
  pruefen(
    'Zwei verfehlte Einheiten lösen keinen Deload aus',
    progressionBerechnen({
      uebung,
      vorgabe,
      einheiten: [einheit('bankdruecken', 4, 0), einheit('bankdruecken', 4, 1)],
      ziel: 'halten',
    }).status === 'wiederholen'
  )
  const deload = progressionBerechnen({
    uebung,
    vorgabe,
    einheiten: [
      einheit('bankdruecken', 4, 0),
      einheit('bankdruecken', 4, 1),
      einheit('bankdruecken', 4, 2),
    ],
    ziel: 'halten',
  })
  pruefen('Genau drei verfehlte Einheiten lösen Deload aus', deload.status === 'deload')
  pruefen('Deload reduziert genau 10 Prozent', deload.gewichtKg === 90)
  const ausgelassen = progressionBerechnen({
    uebung,
    vorgabe,
    einheiten: [
      einheit('bankdruecken', 8, 0),
      ausgelasseneEinheit('bankdruecken', 1),
      ausgelasseneEinheit('bankdruecken', 2),
      ausgelasseneEinheit('bankdruecken', 3),
    ],
    ziel: 'halten',
  })
  // Bis 18.09.2026 umgekehrt: «Dreimal vollständig ausgelassen zählt als drei
  // Fehlversuche». Eine ausgelassene Übung ist kein Fehlversuch — wer eine Last
  // nicht angefasst hat, ist an ihr nicht gescheitert. Siehe E-123.
  pruefen(
    'Ausgelassene Übung ist kein Fehlversuch und löst keinen Deload aus',
    ausgelassen.status === 'steigern' && ausgelassen.gewichtKg === 102.5
  )
  const defizit = progressionBerechnen({
    uebung,
    vorgabe,
    einheiten: [einheit('bankdruecken', 8, 0)],
    ziel: 'abnehmen',
  })
  // Bis 18.09.2026 umgekehrt: im Defizit wurde eine verdiente Steigerung
  // verweigert. F14 verlangt keine Steigerung, verbietet sie aber nicht.
  // Siehe E-124.
  pruefen(
    'Im Defizit bleibt eine verdiente Steigerung erlaubt',
    defizit.status === 'steigern' && defizit.gewichtKg === 102.5
  )
  const defizitGehalten = progressionBerechnen({
    uebung,
    vorgabe,
    einheiten: [
      einheit('bankdruecken', 4, 0),
      einheit('bankdruecken', 4, 1),
      einheit('bankdruecken', 4, 2),
    ],
    ziel: 'abnehmen',
  })
  pruefen(
    'Im Defizit schützt eine gehaltene Last vor dem Deload (F14)',
    defizitGehalten.status === 'halten_im_defizit' && defizitGehalten.gewichtKg === 100
  )
  const defizitReduziert = progressionBerechnen({
    uebung,
    vorgabe,
    einheiten: [
      einheit('bankdruecken', 4, 0, 100),
      einheit('bankdruecken', 4, 1, 95),
      einheit('bankdruecken', 4, 2, 90),
    ],
    ziel: 'abnehmen',
  })
  pruefen(
    'Im Defizit greift der Deload, wenn die Last nicht gehalten wurde',
    defizitReduziert.status === 'deload'
  )
  const deloadKrumm = progressionBerechnen({
    uebung,
    vorgabe,
    einheiten: [
      einheit('bankdruecken', 4, 0, 72.5),
      einheit('bankdruecken', 4, 1, 72.5),
      einheit('bankdruecken', 4, 2, 72.5),
    ],
    ziel: 'halten',
  })
  // 72.5 × 0.9 = 65.25. Bis 18.09.2026 wurde auf 65.3 kg gerundet, eine Last,
  // die sich mit üblichen Scheiben nicht auflegen lässt. Siehe E-125.
  pruefen(
    'Deload rundet auf die Schrittweite ab (Oberkörper 2.5 kg)',
    deloadKrumm.status === 'deload' && deloadKrumm.gewichtKg === 65
  )
  const deloadUnten = progressionBerechnen({
    uebung: unterkoerper,
    vorgabe: unterVorgabe,
    einheiten: [
      einheit('kniebeuge', 4, 0, 107.5),
      einheit('kniebeuge', 4, 1, 107.5),
      einheit('kniebeuge', 4, 2, 107.5),
    ],
    ziel: 'halten',
  })
  // 107.5 × 0.9 = 96.75 -> abgerundet auf 5 kg = 95
  pruefen(
    'Deload rundet auf die Schrittweite ab (Unterkörper 5 kg)',
    deloadUnten.status === 'deload' && deloadUnten.gewichtKg === 95
  )
  pruefen(
    'F14 ist als benannte Funktion prüfbar',
    leistungImDefizitBewerten('abnehmen', 100, 100).gehalten &&
      !leistungImDefizitBewerten('abnehmen', 100, 100).steigerungErforderlich
  )

  // Bis 18.09.2026: «Katalog enthält 25 bis 40 Übungen» (E-25). Der Katalog
  // enthält jetzt genau die Übungen des einen Programms (R-11).
  const programmIds = new Set(
    programme.flatMap((programm) =>
      programm.einheiten.flatMap((tag) => tag.uebungen.map((eintrag) => eintrag.uebungId))
    )
  )
  pruefen(
    'Katalog enthält genau die Übungen des Programms',
    uebungen.length === programmIds.size && uebungen.every((eintrag) => programmIds.has(eintrag.id))
  )
  const ids = new Set(uebungen.map((eintrag) => eintrag.id))
  pruefen('Übungskennungen sind eindeutig', ids.size === uebungen.length)
  pruefen(
    'Alle Programmverweise zeigen auf den Katalog',
    programme.every((programm) =>
      programm.einheiten.every((tag) => tag.uebungen.every((eintrag) => ids.has(eintrag.uebungId)))
    )
  )
  // ---- Schrittweite je Übung (E-129) ----
  pruefen(
    'Jede Katalogübung hat eine eigene Schrittweite',
    uebungen.every((eintrag) => eintrag.schrittKg > 0)
  )
  pruefen(
    'Schrittweite der Übung geht vor der Region',
    schrittFuer({ bereich: 'oberkoerper', schrittKg: 1 }) === 1
  )
  pruefen(
    'Ohne eigene Schrittweite gilt die Region',
    schrittFuer({ bereich: 'oberkoerper' }) === 2.5 &&
      schrittFuer({ bereich: 'unterkoerper' }) === 5
  )
  const feinerSchritt = progressionBerechnen({
    uebung: { id: 'seitheben', bereich: 'oberkoerper', schrittKg: 1 },
    vorgabe: { uebungId: 'seitheben', saetze: 3, min: 6, max: 10 },
    einheiten: [einheit('seitheben', 10, 0, 8)],
    ziel: 'halten',
  })
  pruefen(
    'Steigerung nutzt die Schrittweite der Übung (8 -> 9 kg)',
    feinerSchritt.status === 'steigern' && feinerSchritt.gewichtKg === 9
  )

  // ---- Rang nach absoluter Last (E-128) ----
  // Bis 18.09.2026 rankte die App nach dem Vielfachen des Körpergewichts, mit
  // getrennten Tabellen je Geschlecht (E-122). Diese rund 220 Grenzprüfungen
  // sind mit dem Konzept entfallen.
  // Seit E-143 sechs Stufen: Olymp liegt über Diamant. Bewusst umgestellt.
  pruefen(
    'Sechs Stufen, Olymp als höchste',
    rangdaten.stufen.length === 6 && rangdaten.stufen.at(-1) === 'Olymp'
  )
  pruefen(
    'Nicht festgelegte Schwellen liefern keine Skala',
    uebungen.every((eintrag) =>
      rangdaten.uebungen[eintrag.id] === null ? schwellenFuer(eintrag.id) === null : true
    )
  )
  pruefen(
    'Jede Katalogübung hat einen Eintrag in den Rangdaten',
    uebungen.every((eintrag) => eintrag.id in rangdaten.uebungen)
  )
  pruefen(
    'Gesetzte Schwellen sind positiv und aufsteigend',
    Object.values(rangdaten.uebungen)
      .filter(Array.isArray)
      .every(
        (werte) =>
          werte.length === rangdaten.stufen.length &&
          werte.every((wert, i) => wert > 0 && (i === 0 || wert > werte[i - 1]))
      )
  )

  const probe = {
    stufen: ['Bronze', 'Silber', 'Gold', 'Platin', 'Diamant'],
    uebungen: { latziehen: [20, 40, 60, 80, 100] },
  }
  pruefen(
    'Unter der ersten Schwelle keine Stufe',
    stufeBestimmen(19.9, probe.uebungen.latziehen, probe.stufen) === null
  )
  pruefen(
    'Genau an der Schwelle zählt die Stufe',
    stufeBestimmen(40, probe.uebungen.latziehen, probe.stufen)?.name === 'Silber'
  )
  pruefen(
    'Knapp darunter die Stufe davor',
    stufeBestimmen(39.9, probe.uebungen.latziehen, probe.stufen)?.name === 'Bronze'
  )
  pruefen(
    'Oberste Stufe',
    stufeBestimmen(140, probe.uebungen.latziehen, probe.stufen)?.name === 'Diamant'
  )

  const mitte = rangFuerSatz({ uebungId: 'latziehen', gewichtKg: 50, wiederholungen: 8 }, probe)
  pruefen(
    'Abstand zur nächsten Stufe in kg (50 kg -> Gold bei 60)',
    mitte.wert.stufe.name === 'Silber' &&
      mitte.wert.naechsteStufe === 'Gold' &&
      mitte.wert.abstandKg === 10
  )
  const oben = rangFuerSatz({ uebungId: 'latziehen', gewichtKg: 120, wiederholungen: 8 }, probe)
  pruefen(
    'Über der obersten Stufe keine nächste',
    oben.wert.naechsteStufe === null && oben.wert.abstandKg === null
  )
  pruefen(
    'Kein Körpergewicht und kein Geschlecht nötig',
    rangFuerSatz({ uebungId: 'latziehen', gewichtKg: 50, wiederholungen: 8 }, probe).status === 'ok'
  )
  const ohneStufen = rangFuerSatz({ uebungId: 'latziehen', gewichtKg: 50, wiederholungen: 8 })
  pruefen(
    'Ohne festgelegte Schwellen: Last bleibt, Stufe leer, Grund benannt',
    ohneStufen.status === 'ok' &&
      ohneStufen.wert.lastKg === 50 &&
      ohneStufen.wert.stufe === null &&
      ohneStufen.wert.grund === 'stufen_fehlen'
  )
  pruefen(
    'Epley steht zur Einordnung in der Herleitung',
    nahe(
      rangFuerSatz({ uebungId: 'latziehen', gewichtKg: 60, wiederholungen: 8 }, probe).herleitung
        .epleyKg,
      76
    )
  )

  const katalogProbe = [
    { id: 'latziehen', name: 'Latzug', wiederholungen: { min: 6, max: 10 } },
    { id: 'seitheben', name: 'Seitenheben', wiederholungen: { min: 6, max: 10 } },
  ]
  const satz = (uebungId, gewichtKg, wiederholungen) => ({ uebungId, gewichtKg, wiederholungen })
  const liste = ranglisteBerechnen(
    [
      { saetze: [satz('seitheben', 10, 8), satz('latziehen', 90, 3), satz('latziehen', 60, 8)] },
      { saetze: [satz('latziehen', 60, 10), satz('bankdruecken', 100, 8)] },
    ],
    katalogProbe,
    probe
  )
  const latzug = liste.find((eintrag) => eintrag.uebungId === 'latziehen')
  pruefen('Satz unter der Untergrenze zählt nicht (90 kg × 3)', latzug.wert.lastKg === 60)
  pruefen(
    'Bei gleicher Last zählt der Satz mit mehr Wiederholungen',
    latzug.satz.wiederholungen === 10
  )
  pruefen(
    'Übungen ausserhalb des Katalogs werden ignoriert',
    !liste.some((eintrag) => eintrag.uebungId === 'bankdruecken')
  )
  pruefen(
    'Reihenfolge folgt dem Programm, nicht dem Alphabet',
    liste.map((eintrag) => eintrag.uebungId).join() === 'latziehen,seitheben'
  )
  pruefen('Es gibt keinen Gesamtrang', !('gesamtrang' in liste) && Array.isArray(liste))

  // ---- Feste Schwellen je Geschlecht (E-133) ----
  // Die Pruefpunkte oben pruefen nur einfache Tabellen (Arrays). Die echten
  // Daten sind seit 26.09.2026 nach m und w getrennt; ohne diese Punkte
  // wuerden die beiden Pruefungen zu gesetzten Schwellen leer bestehen.
  const aufsteigend = (werte) =>
    Array.isArray(werte) &&
    werte.length === rangdaten.stufen.length &&
    werte.every((wert, i) => wert > 0 && (i === 0 || wert > werte[i - 1]))
  pruefen(
    'Jede Katalogübung hat Schwellen für m und w, positiv und aufsteigend',
    uebungen.every(
      (eintrag) =>
        aufsteigend(rangdaten.uebungen[eintrag.id]?.m) &&
        aufsteigend(rangdaten.uebungen[eintrag.id]?.w)
    )
  )
  pruefen(
    'Schwellen hängen am Geschlecht',
    schwellenFuer('beinpresse', rangdaten, 'm')?.[0] === rangdaten.uebungen.beinpresse.m[0] &&
      schwellenFuer('beinpresse', rangdaten, 'w')?.[0] === rangdaten.uebungen.beinpresse.w[0]
  )
  pruefen(
    'Ohne Geschlecht keine Skala bei getrennten Tabellen',
    schwellenFuer('beinpresse', rangdaten, '') === null
  )
  const w40 = rangFuerSatz(
    { uebungId: 'latziehen', gewichtKg: 40, wiederholungen: 8 },
    rangdaten,
    'w'
  )
  const m40 = rangFuerSatz(
    { uebungId: 'latziehen', gewichtKg: 40, wiederholungen: 8 },
    rangdaten,
    'm'
  )
  pruefen(
    'Dieselbe Last ergibt je Tabelle eine eigene Stufe (Latzug 40 kg)',
    w40.wert.stufe?.name === 'Silber' &&
      m40.wert.stufe === null &&
      m40.wert.naechsteStufe === 'Bronze'
  )
  pruefen(
    'Rangliste reicht das Geschlecht durch',
    ranglisteBerechnen([{ saetze: [satz('latziehen', 40, 8)] }], katalogProbe, rangdaten, 'w')[0]
      ?.wert.stufe?.name === 'Silber'
  )

  // ---- Gesamtrang (E-140) ----
  const skala = [10, 20, 30, 40, 50]
  pruefen('Punkte: ohne Last 0', uebungsPunkte(undefined, skala) === 0)
  pruefen('Punkte: halbe Bronze-Schwelle 0.5', nahe(uebungsPunkte(5, skala), 0.5))
  pruefen('Punkte: genau Bronze 1', uebungsPunkte(10, skala) === 1)
  pruefen('Punkte: Mitte Silber bis Gold 2.5', nahe(uebungsPunkte(25, skala), 2.5))
  pruefen('Punkte: genau Diamant 5', uebungsPunkte(50, skala) === 5)
  pruefen('Punkte: eine Stufenbreite über Diamant 6, gedeckelt', uebungsPunkte(200, skala) === 6)

  const zweiUebungen = [
    { id: 'latziehen', name: 'Latzug', wiederholungen: { min: 6, max: 10 } },
    { id: 'seitheben', name: 'Seitenheben', wiederholungen: { min: 6, max: 10 } },
  ]
  const tabelle = {
    stufen: ['Bronze', 'Silber', 'Gold', 'Platin', 'Diamant'],
    uebungen: { latziehen: skala, seitheben: skala },
  }
  const leer = gesamtrangBerechnen([], zweiUebungen, tabelle)
  pruefen('Gesamtrang ohne Sätze: keine Stufe, 0 Punkte', leer.stufe === null && leer.punkte === 0)
  const eineStark = gesamtrangBerechnen(
    [{ saetze: [satz('latziehen', 50, 8)] }],
    zweiUebungen,
    tabelle
  )
  pruefen(
    'Untrainierte Übungen zählen 0: eine Diamant-Übung von zwei ergibt 2.5 = Silber',
    nahe(eineStark.punkte, 2.5) && eineStark.stufe?.name === 'Silber'
  )
  const beideSilber = gesamtrangBerechnen(
    [{ saetze: [satz('latziehen', 20, 8), satz('seitheben', 20, 8)] }],
    zweiUebungen,
    tabelle
  )
  pruefen(
    'Genau an der Stufengrenze: Silber III',
    beideSilber.stufe?.name === 'Silber' && beideSilber.division === 'III'
  )
  const beideSpitze = gesamtrangBerechnen(
    [{ saetze: [satz('latziehen', 90, 8), satz('seitheben', 90, 8)] }],
    zweiUebungen,
    tabelle
  )
  pruefen(
    'Ganz oben: Diamant I',
    beideSpitze.stufe?.name === 'Diamant' && beideSpitze.division === 'I'
  )
  // ---- Olymp (E-143) ----
  const olympSkala = rangdaten.uebungen.latziehen.m
  pruefen('Olymp-Schwelle über Diamant', olympSkala[5] > olympSkala[4])
  pruefen('Punkte: genau Olymp 6', uebungsPunkte(olympSkala[5], olympSkala) === 6)
  pruefen('Punkte: weit über Olymp 7, gedeckelt', uebungsPunkte(1000, olympSkala) === 7)
  pruefen(
    'Stufe Olymp an der Schwelle, Diamant knapp darunter',
    rangFuerSatz({ uebungId: 'latziehen', gewichtKg: 140, wiederholungen: 8 }, rangdaten, 'm').wert
      .stufe?.name === 'Olymp' &&
      rangFuerSatz({ uebungId: 'latziehen', gewichtKg: 137.5, wiederholungen: 8 }, rangdaten, 'm')
        .wert.stufe?.name === 'Diamant'
  )
  const alleOlymp = gesamtrangBerechnen(
    [{ saetze: uebungen.map((u) => satz(u.id, 1000, u.wiederholungen.min)) }],
    uebungen,
    rangdaten,
    'm'
  )
  pruefen(
    'Alle Übungen weit über Olymp: Gesamtrang Olymp I',
    alleOlymp.stufe?.name === 'Olymp' && alleOlymp.division === 'I'
  )
  pruefen(
    'Ohne Geschlecht bei getrennten Tabellen kein Gesamtrang',
    gesamtrangBerechnen([], uebungen, rangdaten, '').status === 'skala_fehlt'
  )

  zeilen.push(`ABSCHLUSS: ${zeilen.length} Prüfpunkte bestanden.`)
} catch (fehler) {
  zeilen.push(`ABBRUCH: ${fehler.message}`)
} finally {
  ausgabe.textContent = zeilen.join('\n')
}
