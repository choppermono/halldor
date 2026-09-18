import programme from '../src/daten/programme.json'
import uebungen from '../src/daten/uebungen.json'
import {
  gesamtlastBerechnen,
  leistungImDefizitBewerten,
  maximumSchaetzen,
  progressionBerechnen,
} from '../src/lib/training.js'
import { kraftstandards, rangFuerSatz, schwellenFuer, stufeBestimmen } from '../src/lib/rang.js'

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

  const uebung = uebungen.find((kandidat) => kandidat.id === 'bankdruecken')
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
  const unterkoerper = uebungen.find((kandidat) => kandidat.id === 'kniebeuge')
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

  pruefen('Katalog enthält 25 bis 40 Übungen', uebungen.length >= 25 && uebungen.length <= 40)
  const ids = new Set(uebungen.map((eintrag) => eintrag.id))
  pruefen('Übungskennungen sind eindeutig', ids.size === uebungen.length)
  pruefen(
    'Alle Programmverweise zeigen auf den Katalog',
    programme.every((programm) =>
      programm.einheiten.every((tag) => tag.uebungen.every((eintrag) => ids.has(eintrag.uebungId)))
    )
  )
  pruefen(
    'Jede Verhältniszahl hat Messpunkt und Quelle',
    Object.values(kraftstandards.uebungen)
      .filter((eintrag) => eintrag.typ === 'abgeleitet')
      .every(
        (eintrag) =>
          eintrag.messpunkt?.m && eintrag.messpunkt?.w && /^https:\/\//.test(eintrag.quelle)
      )
  )
  pruefen(
    'Jede Katalogübung hat Skala oder erklärte Lücke',
    uebungen.every(
      (eintrag) =>
        kraftstandards.uebungen[eintrag.id] || kraftstandards.ohneStufe.includes(eintrag.id)
    )
  )

  let grenzpruefungen = 0
  for (const [uebungId] of Object.entries(kraftstandards.uebungen)) {
    for (const geschlecht of ['m', 'w']) {
      const schwellen = schwellenFuer(uebungId, geschlecht)
      pruefen(`${uebungId} hat Tabelle ${geschlecht}`, schwellen?.length === 5)
      schwellen.forEach((schwelle, index) => {
        pruefen(
          `${uebungId} ${geschlecht} Schwelle ${index + 1} gilt an der Grenze`,
          stufeBestimmen(schwelle, schwellen)?.index === index
        )
        const darunter = stufeBestimmen(schwelle - 1e-9, schwellen)
        pruefen(
          `${uebungId} ${geschlecht} Schwelle ${index + 1} gilt nicht darunter`,
          index === 0 ? darunter === null : darunter?.index === index - 1
        )
        grenzpruefungen += 2
      })
    }
  }
  pruefen('Beide Geschlechtertabellen vollständig durchlaufen', grenzpruefungen > 0)

  const ohneGeschlecht = rangFuerSatz({
    uebungId: 'bankdruecken',
    gewichtKg: 60,
    wiederholungen: 5,
    momentaufnahme: { koerpergewichtKg: 80, geschlecht: '' },
  })
  pruefen(
    'Ohne Geschlecht bleibt das Vielfache erhalten',
    ohneGeschlecht.status === 'ok' && Number.isFinite(ohneGeschlecht.wert.vielfaches)
  )
  pruefen(
    'Ohne Geschlecht gibt es keinen Rang',
    ohneGeschlecht.wert.stufe === null && ohneGeschlecht.wert.grund === 'geschlecht_fehlt'
  )

  zeilen.push(`ABSCHLUSS: ${zeilen.length} Prüfpunkte bestanden.`)
} catch (fehler) {
  zeilen.push(`ABBRUCH: ${fehler.message}`)
} finally {
  ausgabe.textContent = zeilen.join('\n')
}
