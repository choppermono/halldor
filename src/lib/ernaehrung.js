// Fachliche Zahlen ausschliesslich hier. Einordnung: Quellen-Fachlogik.md im Modul-Vault.
export const REGELN = Object.freeze({
  // Belegt: Mifflin et al. 1990, doi:10.1093/ajcn/51.2.241.
  mifflin: Object.freeze({ kg: 10, cm: 6.25, alter: -5, m: 5, w: -161 }),
  // Faustregel, belastbare Primaerquelle offen.
  aktivitaeten: Object.freeze([1.2, 1.375, 1.55, 1.725, 1.9]),
  // Belegt fuer Krafttraining bei Erwachsenen: Morton et al. 2018, PMID 28698222.
  proteinJeKg: 1.6,
  proteinMaximumJeKg: 2.2,
  // Faustregel, Quelle offen; keine medizinische Mindestzufuhr.
  fettJeKg: 0.8,
  // Belegt fuer Gewichtsverlust: Helms et al. 2014, PMID 24864135.
  // Dieselbe Spanne fuer Aufbau ist eine UNBELEGTE Produktannahme.
  rateMin: 0.5,
  rateMax: 1,
  // Faustregel, Primaerquelle offen; statische Naeherung, keine Gewichtsprognose.
  kcalJeKg: 7700,
  // Allgemeine Atwater-Faktoren: EU 1169/2011, Anhang XIV; keine Praezisionsmessung.
  energie: Object.freeze({ protein: 4, fett: 9, kohlenhydrate: 4 }),
  // Produktregel aus Auftrag/Quellen-Fachlogik, keine klinische Altersgrenze.
  abnehmenAb: 18,
  // UNBELEGT: technische Eingabegrenzen, keine Aussagen ueber gesunde Koerpermasse.
  grenzen: Object.freeze({
    alterMin: 10,
    alterMax: 120,
    kgMin: 20,
    kgMax: 400,
    cmMin: 100,
    cmMax: 250,
  }),
  // Darstellung laut Auftrag. Es existiert KEINE feste kcal-Untergrenze.
  kcalRundung: 50,
  tageJeWoche: 7,
  prozent: 100,
})

const ziele = ['abnehmen', 'halten', 'aufbauen']
const basisLeer = { formel: '', bmrKcal: null, tdeeKcal: null, rateProzent: null, gewichtKg: null }
function ok(wert, herleitung = {}) {
  return { status: 'ok', wert, herleitung: { ...basisLeer, ...herleitung } }
}
function fehler(status, meldung, herleitung = {}, extra = {}) {
  return { status, meldung, herleitung: { ...basisLeer, ...herleitung }, ...extra }
}
function imBereich(wert, min, max) {
  return Number.isFinite(wert) && wert >= min && wert <= max
}

export function datumPruefen(datum) {
  if (typeof datum !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(datum))
    return fehler('datum_ungueltig', 'Ein gültiges Datum ist erforderlich.')
  const [jahr, monat, tag] = datum.split('-').map(Number)
  const schaltjahr = jahr % 4 === 0 && (jahr % 100 !== 0 || jahr % 400 === 0)
  const tage = [31, schaltjahr ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  if (jahr < 1 || monat < 1 || monat > 12 || tag < 1 || tag > tage[monat - 1])
    return fehler('datum_ungueltig', 'Das Datum existiert nicht.')
  return ok({ jahr, monat, tag }, { formel: 'Gregorianischer Kalender' })
}

export function alterBerechnen(geburtsdatum, stichtag) {
  const geburt = datumPruefen(geburtsdatum)
  const heute = datumPruefen(stichtag)
  if (geburt.status !== 'ok') return geburt
  if (heute.status !== 'ok') return heute
  if (geburtsdatum > stichtag)
    return fehler('geburt_in_zukunft', 'Das Geburtsdatum liegt nach dem Stichtag.')
  const alter =
    heute.wert.jahr - geburt.wert.jahr - (stichtag.slice(5) < geburtsdatum.slice(5) ? 1 : 0)
  if (!imBereich(alter, REGELN.grenzen.alterMin, REGELN.grenzen.alterMax))
    return fehler(
      'alter_unplausibel',
      `Das unterstützte Eingabealter liegt zwischen ${REGELN.grenzen.alterMin} und ${REGELN.grenzen.alterMax} Jahren.`
    )
  return ok(alter, { formel: 'Vollendete Lebensjahre am Stichtag', geburtsdatum, stichtag, alter })
}

export function zielPruefen(ziel, alter) {
  if (
    !Number.isInteger(alter) ||
    !imBereich(alter, REGELN.grenzen.alterMin, REGELN.grenzen.alterMax)
  )
    return fehler('alter_unplausibel', 'Das Alter ist ungültig.')
  if (!ziele.includes(ziel))
    return fehler('ziel_unbekannt', 'Wähle halten, abnehmen oder aufbauen.')
  if (alter < REGELN.abnehmenAb && ziel === 'abnehmen')
    return fehler(
      'ziel_altersgrenze',
      'Unter 18 Jahren ist kein Abnehmziel verfügbar. Halten und Aufbauen bleiben wählbar.'
    )
  return ok(ziel, { formel: 'Unter 18 kein Abnehmziel', alter, ziel })
}

export function grundumsatzBerechnen(angaben) {
  if (!angaben || typeof angaben !== 'object')
    return fehler('angaben_fehlen', 'Körperdaten fehlen.')
  const { geschlecht, gewichtKg, groesseCm, geburtsdatum, stichtag } = angaben
  if (!['m', 'w'].includes(geschlecht))
    return fehler('geschlecht_ungueltig', 'Wähle die Formelvariante männlich oder weiblich.')
  if (!imBereich(gewichtKg, REGELN.grenzen.kgMin, REGELN.grenzen.kgMax))
    return fehler('gewicht_unplausibel', 'Das Gewicht liegt ausserhalb der Eingabegrenzen.')
  if (!imBereich(groesseCm, REGELN.grenzen.cmMin, REGELN.grenzen.cmMax))
    return fehler('groesse_unplausibel', 'Die Körpergrösse liegt ausserhalb der Eingabegrenzen.')
  const alter = alterBerechnen(geburtsdatum, stichtag)
  if (alter.status !== 'ok') return alter
  const m = REGELN.mifflin
  const bmrKcal = m.kg * gewichtKg + m.cm * groesseCm + m.alter * alter.wert + m[geschlecht]
  const herleitung = {
    ...alter.herleitung,
    formel: 'Mifflin-St Jeor',
    rechnung: `${m.kg} × ${gewichtKg} + ${m.cm} × ${groesseCm} − ${-m.alter} × ${alter.wert} ${m[geschlecht] < 0 ? '−' : '+'} ${Math.abs(m[geschlecht])}`,
    bmrKcal,
    gewichtKg,
    groesseCm,
    geschlecht,
  }
  if (bmrKcal <= 0)
    return fehler(
      'grundumsatz_unplausibel',
      'Aus diesen Angaben ergibt sich kein plausibler Grundumsatz.',
      herleitung
    )
  return ok(bmrKcal, herleitung)
}

export function gesamtumsatzBerechnen(bmrKcal, aktivitaet) {
  if (!Number.isFinite(bmrKcal) || bmrKcal <= 0)
    return fehler('grundumsatz_unplausibel', 'Ein positiver Grundumsatz ist erforderlich.')
  if (!REGELN.aktivitaeten.includes(aktivitaet))
    return fehler('aktivitaet_ungueltig', 'Wähle eine Aktivitätsstufe.')
  const tdeeKcal = bmrKcal * aktivitaet
  if (!Number.isFinite(tdeeKcal))
    return fehler('gesamtumsatz_unplausibel', 'Der Gesamtumsatz ist nicht darstellbar.')
  return ok(tdeeKcal, { formel: 'Grundumsatz × Aktivitätsfaktor', bmrKcal, tdeeKcal, aktivitaet })
}

export function makrosBerechnen(kcal, gewichtKg) {
  if (
    !Number.isFinite(kcal) ||
    kcal <= 0 ||
    !imBereich(gewichtKg, REGELN.grenzen.kgMin, REGELN.grenzen.kgMax)
  )
    return fehler(
      'makro_eingabe_ungueltig',
      'Positive Kalorien und ein plausibles Gewicht sind erforderlich.'
    )
  const proteinG = REGELN.proteinJeKg * gewichtKg
  const fettG = REGELN.fettJeKg * gewichtKg
  const ankerKcal = proteinG * REGELN.energie.protein + fettG * REGELN.energie.fett
  const herleitung = {
    formel: 'Protein und Fett je kg; verbleibende Energie / 4 als Kohlenhydrate',
    gewichtKg,
    ankerKcal,
    kcal,
  }
  if (kcal < ankerKcal)
    return fehler(
      'makroziel_ungueltig',
      'Protein und Fett überschreiten allein den Kalorienrahmen. Es gibt kein gültiges Makroziel.',
      herleitung
    )
  return ok(
    { proteinG, fettG, kohlenhydrateG: (kcal - ankerKcal) / REGELN.energie.kohlenhydrate },
    herleitung
  )
}

export function zielkalorienBerechnen(angaben) {
  if (!angaben || typeof angaben !== 'object')
    return fehler('angaben_fehlen', 'Zielangaben fehlen.')
  const { tdeeKcal, gewichtKg, ziel, alter, rateProzent } = angaben
  const erlaubt = zielPruefen(ziel, alter)
  if (erlaubt.status !== 'ok') return erlaubt
  if (
    !Number.isFinite(tdeeKcal) ||
    tdeeKcal <= 0 ||
    !imBereich(gewichtKg, REGELN.grenzen.kgMin, REGELN.grenzen.kgMax)
  )
    return fehler('ziel_eingabe_ungueltig', 'Gesamtumsatz oder Gewicht ist ungültig.')
  if (ziel !== 'halten' && !imBereich(rateProzent, REGELN.rateMin, REGELN.rateMax))
    return fehler(
      'rate_ungueltig',
      `Die Rate muss zwischen ${REGELN.rateMin} und ${REGELN.rateMax} Prozent pro Woche liegen.`
    )
  const rate = ziel === 'halten' ? 0 : rateProzent
  const kgJeWoche = (gewichtKg * rate) / REGELN.prozent
  const aenderungKcal = (kgJeWoche * REGELN.kcalJeKg) / REGELN.tageJeWoche
  const kcal = tdeeKcal + (ziel === 'abnehmen' ? -aenderungKcal : aenderungKcal)
  const ankerKcal =
    gewichtKg *
    (REGELN.proteinJeKg * REGELN.energie.protein + REGELN.fettJeKg * REGELN.energie.fett)
  const rechnerischeRate =
    ((tdeeKcal - ankerKcal) * REGELN.tageJeWoche * REGELN.prozent) / (gewichtKg * REGELN.kcalJeKg)
  // Abwaerts auf sechs Dezimalstellen: Rueckgabe bleibt beim erneuten Einsetzen gueltig.
  const hoechsteRateProzent =
    rechnerischeRate >= 0
      ? Math.floor(Math.min(REGELN.rateMax, rechnerischeRate) * 1e6) / 1e6
      : null
  const herleitung = {
    formel: 'Gesamtumsatz ± (Gewicht × Rate / 100 × kcal je kg / 7)',
    tdeeKcal,
    gewichtKg,
    rateProzent: rate,
    ziel,
    kgJeWoche,
    aenderungKcal,
    ankerKcal,
    kcal,
  }
  if (!Number.isFinite(kcal))
    return fehler('ziel_unplausibel', 'Die Zielkalorien sind nicht darstellbar.', herleitung)
  if (kcal < ankerKcal || kcal <= 0)
    return fehler(
      'makroziel_ungueltig',
      ziel === 'abnehmen'
        ? 'Das gewählte Tempo ist zu hoch. Protein und Fett überschreiten den Kalorienrahmen; es gibt kein gültiges Makroziel.'
        : 'Protein und Fett überschreiten den Kalorienrahmen; es gibt kein gültiges Makroziel.',
      herleitung,
      {
        hoechsteRateProzent,
        rateInSpanne: hoechsteRateProzent !== null && hoechsteRateProzent >= REGELN.rateMin,
      }
    )
  return ok(kcal, herleitung)
}

export function profilPruefen(profil, stichtag) {
  if (!profil || typeof profil !== 'object')
    return fehler('profil_fehlt', 'Erfasse zuerst deine Körperdaten.')
  if (datumPruefen(stichtag).status !== 'ok') return datumPruefen(stichtag)
  if (!Array.isArray(profil.gewichtsverlauf) || !profil.gewichtsverlauf.length)
    return fehler('gewicht_fehlt', 'Ein Gewichtseintrag ist erforderlich.')
  let vorher = ''
  for (const eintrag of profil.gewichtsverlauf) {
    if (
      !eintrag ||
      datumPruefen(eintrag.datum).status !== 'ok' ||
      eintrag.datum <= vorher ||
      !imBereich(eintrag.kg, REGELN.grenzen.kgMin, REGELN.grenzen.kgMax)
    )
      return fehler(
        'gewichtsverlauf_ungueltig',
        'Der Gewichtsverlauf muss gültige, eindeutig datierte und aufsteigende Einträge enthalten.'
      )
    vorher = eintrag.datum
  }
  const gewicht = profil.gewichtsverlauf.filter((eintrag) => eintrag.datum <= stichtag).at(-1)
  if (!gewicht)
    return fehler('gewicht_am_stichtag_fehlt', 'Für diesen Stichtag liegt noch kein Gewicht vor.')
  const bmr = grundumsatzBerechnen({ ...profil, gewichtKg: gewicht.kg, stichtag })
  if (bmr.status !== 'ok') return bmr
  const erlaubt = zielPruefen(profil.ziel, bmr.herleitung.alter)
  if (erlaubt.status !== 'ok') return erlaubt
  if (!REGELN.aktivitaeten.includes(profil.aktivitaet))
    return fehler('aktivitaet_ungueltig', 'Wähle eine Aktivitätsstufe.')
  const rate = profil.aenderungsrateProzent ?? REGELN.rateMin
  if (!imBereich(rate, REGELN.rateMin, REGELN.rateMax))
    return fehler('rate_ungueltig', 'Die Änderungsrate liegt ausserhalb der Eingabegrenzen.')
  if (profil.hinweisBestaetigt !== true)
    return fehler('hinweis_offen', 'Bestätige den Hinweis zur Schätzung.')
  return ok(profil, bmr.herleitung)
}

export function zielBerechnen(profil, stichtag) {
  const eingabe = profilPruefen(profil, stichtag)
  if (eingabe.status !== 'ok') return eingabe
  const b = eingabe.herleitung
  const tdee = gesamtumsatzBerechnen(b.bmrKcal, profil.aktivitaet)
  if (tdee.status !== 'ok') return tdee
  const ziel = zielkalorienBerechnen({
    tdeeKcal: tdee.wert,
    gewichtKg: b.gewichtKg,
    ziel: profil.ziel,
    alter: b.alter,
    rateProzent: profil.aenderungsrateProzent ?? REGELN.rateMin,
  })
  const herleitung = {
    ...b,
    ...tdee.herleitung,
    ...ziel.herleitung,
    formel: b.formel,
    bmrKcal: b.bmrKcal,
    rechnung: b.rechnung,
    aktivitaet: profil.aktivitaet,
  }
  if (ziel.status !== 'ok') return { ...ziel, herleitung }
  const makros = makrosBerechnen(ziel.wert, b.gewichtKg)
  if (makros.status !== 'ok') return { ...makros, herleitung }
  return ok(
    {
      kcal: ziel.wert,
      ...makros.wert,
      untergrenzeAktiv: false,
      basis: { bmrKcal: b.bmrKcal, tdeeKcal: tdee.wert, gewichtKg: b.gewichtKg },
    },
    { ...herleitung, ankerKcal: makros.herleitung.ankerKcal }
  )
}
