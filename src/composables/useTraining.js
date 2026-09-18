import { computed, reactive, readonly } from 'vue'
import programme from '../daten/programme.json'
import uebungen from '../daten/uebungen.json'
import { dokumentLaden, dokumentSpeichern, Speicherstatus } from '../lib/speicher.js'
import { speicherLesbar, speicherhinweis } from '../lib/speicherhinweis.js'

const STANDARD_PROGRAMM = 'ganzkoerper-3'
const zustand = reactive({ einheiten: [], programmId: STANDARD_PROGRAMM, hinweis: '' })
const lesbar = readonly(zustand)
const programmeNachId = new Map(programme.map((programm) => [programm.id, programm]))
const uebungenNachId = new Map(uebungen.map((uebung) => [uebung.id, uebung]))

function idErzeugen() {
  try {
    if (globalThis.crypto.randomUUID) return globalThis.crypto.randomUUID()
    return Array.from(globalThis.crypto.getRandomValues(new Uint8Array(16)), (wert) =>
      wert.toString(16).padStart(2, '0')
    ).join('')
  } catch {
    return null
  }
}

function lokalesDatum() {
  const heute = new Date()
  const verschoben = new Date(heute.getTime() - heute.getTimezoneOffset() * 60000)
  return verschoben.toISOString().slice(0, 10)
}

function profilMomentaufnahme(profil, datum) {
  const gewicht = Array.isArray(profil?.gewichtsverlauf)
    ? profil.gewichtsverlauf.filter((eintrag) => eintrag?.datum <= datum).at(-1)?.kg
    : null
  if (!Number.isFinite(gewicht) || gewicht <= 0)
    return {
      status: 'gewicht_fehlt',
      meldung: 'Im Profil fehlt ein Körpergewicht für den heutigen Tag.',
    }
  return {
    status: 'ok',
    wert: {
      koerpergewichtKg: gewicht,
      geschlecht: ['m', 'w'].includes(profil?.geschlecht) ? profil.geschlecht : '',
      ziel: profil?.ziel ?? '',
    },
  }
}

function trainingLaden() {
  const bestand = dokumentLaden()
  zustand.einheiten = bestand.dokument.trainingseinheiten
  const gespeichert = bestand.dokument.einstellungen?.trainingsprogrammId
  zustand.programmId = programmeNachId.has(gespeichert) ? gespeichert : STANDARD_PROGRAMM
  zustand.hinweis = speicherhinweis(bestand.status)
}

function schreiben(dokument) {
  const ergebnis = dokumentSpeichern(dokument)
  zustand.hinweis = speicherhinweis(ergebnis.status)
  if (ergebnis.status !== Speicherstatus.gespeichert)
    return { status: ergebnis.status, meldung: zustand.hinweis }
  zustand.einheiten = ergebnis.dokument.trainingseinheiten
  zustand.programmId = programmeNachId.has(ergebnis.dokument.einstellungen?.trainingsprogrammId)
    ? ergebnis.dokument.einstellungen.trainingsprogrammId
    : STANDARD_PROGRAMM
  return { status: 'ok', dokument: ergebnis.dokument }
}

function programmWaehlen(programmId) {
  if (!programmeNachId.has(programmId))
    return { status: 'programm_ungueltig', meldung: 'Wähle eine vorhandene Programmvariante.' }
  const bestand = dokumentLaden()
  if (!speicherLesbar(bestand.status))
    return { status: bestand.status, meldung: speicherhinweis(bestand.status) }
  return schreiben({
    ...bestand.dokument,
    einstellungen: { ...bestand.dokument.einstellungen, trainingsprogrammId: programmId },
  })
}

export function naechsteProgrammEinheit(programm, einheiten) {
  if (!programm?.einheiten?.length) return null
  const abgeschlossen = (Array.isArray(einheiten) ? einheiten : []).filter(
    (einheit) => einheit?.programmvariante?.id === programm.id && einheit?.abgeschlossenAm
  ).length
  return programm.einheiten[abgeschlossen % programm.einheiten.length]
}

function einheitStarten() {
  const bestand = dokumentLaden()
  if (!speicherLesbar(bestand.status))
    return { status: bestand.status, meldung: speicherhinweis(bestand.status) }
  const offen = bestand.dokument.trainingseinheiten.find((einheit) => !einheit?.abgeschlossenAm)
  if (offen)
    return {
      status: 'einheit_offen',
      meldung: 'Schliesse zuerst die bereits gestartete Einheit ab.',
      einheit: offen,
    }
  const programmId = programmeNachId.has(bestand.dokument.einstellungen?.trainingsprogrammId)
    ? bestand.dokument.einstellungen.trainingsprogrammId
    : STANDARD_PROGRAMM
  const programm = programmeNachId.get(programmId)
  const programmEinheit = naechsteProgrammEinheit(programm, bestand.dokument.trainingseinheiten)
  const datum = lokalesDatum()
  const momentaufnahme = profilMomentaufnahme(bestand.dokument.profil, datum)
  if (momentaufnahme.status !== 'ok') return momentaufnahme
  const id = idErzeugen()
  if (!id)
    return {
      status: 'kennung_nicht_verfuegbar',
      meldung: 'Der Browser kann keine Einheitskennung erzeugen. Nichts wurde gespeichert.',
    }
  const einheit = {
    id,
    datum,
    gestartetAm: new Date().toISOString(),
    abgeschlossenAm: null,
    programmvariante: {
      id: programm.id,
      name: programm.name,
      trainingstage: programm.trainingstage,
    },
    programmEinheit: { id: programmEinheit.id, name: programmEinheit.name },
    // Die Vorgaben sind Teil der Einheits-Momentaufnahme. Nur so bleibt eine
    // komplett ausgelassene, aber eingeplante Übung später als Fehlversuch
    // erkennbar, auch wenn für sie kein Satzobjekt existiert.
    vorgaben: programmEinheit.uebungen.map((vorgabe) => ({ ...vorgabe })),
    momentaufnahme: momentaufnahme.wert,
    saetze: [],
  }
  const ergebnis = schreiben({
    ...bestand.dokument,
    einstellungen: { ...bestand.dokument.einstellungen, trainingsprogrammId: programmId },
    trainingseinheiten: [...bestand.dokument.trainingseinheiten, einheit],
  })
  return ergebnis.status === 'ok' ? { ...ergebnis, einheit } : ergebnis
}

function satzHinzufuegen(einheitId, uebungId, gewichtKg, wiederholungen) {
  if (!Number.isFinite(gewichtKg) || gewichtKg <= 0 || gewichtKg > 1000)
    return {
      status: 'gewicht_ungueltig',
      feld: 'gewicht',
      meldung: 'Erfasse ein Gewicht über 0 und höchstens 1000 kg.',
    }
  if (!Number.isInteger(wiederholungen) || wiederholungen < 1 || wiederholungen > 100)
    return {
      status: 'wiederholungen_ungueltig',
      feld: 'wiederholungen',
      meldung: 'Erfasse 1 bis 100 ganze Wiederholungen.',
    }
  const bestand = dokumentLaden()
  if (!speicherLesbar(bestand.status))
    return { status: bestand.status, meldung: speicherhinweis(bestand.status) }
  const index = bestand.dokument.trainingseinheiten.findIndex(
    (einheit) => einheit?.id === einheitId
  )
  const einheit = bestand.dokument.trainingseinheiten[index]
  if (!einheit || einheit.abgeschlossenAm)
    return { status: 'einheit_fehlt', meldung: 'Die offene Trainingseinheit wurde nicht gefunden.' }
  const programm = programmeNachId.get(einheit.programmvariante?.id)
  const programmEinheit = programm?.einheiten.find(
    (kandidat) => kandidat.id === einheit.programmEinheit?.id
  )
  const vorgabe = programmEinheit?.uebungen.find((kandidat) => kandidat.uebungId === uebungId)
  const uebung = uebungenNachId.get(uebungId)
  if (!vorgabe || !uebung)
    return { status: 'uebung_ungueltig', meldung: 'Diese Übung gehört nicht zur offenen Einheit.' }
  const momentaufnahme = profilMomentaufnahme(bestand.dokument.profil, lokalesDatum())
  if (momentaufnahme.status !== 'ok') return momentaufnahme
  const id = idErzeugen()
  if (!id)
    return {
      status: 'kennung_nicht_verfuegbar',
      meldung: 'Der Browser kann keine Satzkennung erzeugen. Nichts wurde gespeichert.',
    }
  const satz = {
    id,
    uebungId,
    gewichtKg,
    wiederholungen,
    zeit: new Date().toISOString(),
    momentaufnahme: {
      ...momentaufnahme.wert,
      uebungName: uebung.name,
      bereich: uebung.bereich,
      programmId: programm.id,
      programmEinheitId: programmEinheit.id,
      saetze: vorgabe.saetze,
      wiederholungenMin: vorgabe.min,
      wiederholungenMax: vorgabe.max,
    },
  }
  const aktualisiert = {
    ...einheit,
    saetze: [...einheit.saetze, satz],
  }
  const trainingseinheiten = [...bestand.dokument.trainingseinheiten]
  trainingseinheiten[index] = aktualisiert
  const ergebnis = schreiben({ ...bestand.dokument, trainingseinheiten })
  return ergebnis.status === 'ok' ? { ...ergebnis, satz } : ergebnis
}

function satzLoeschen(einheitId, satzId) {
  const bestand = dokumentLaden()
  if (!speicherLesbar(bestand.status))
    return { status: bestand.status, meldung: speicherhinweis(bestand.status) }
  const index = bestand.dokument.trainingseinheiten.findIndex(
    (einheit) => einheit?.id === einheitId && !einheit?.abgeschlossenAm
  )
  const einheit = bestand.dokument.trainingseinheiten[index]
  if (!einheit || !einheit.saetze.some((satz) => satz.id === satzId))
    return { status: 'satz_fehlt', meldung: 'Der Satz wurde nicht gefunden.' }
  const trainingseinheiten = [...bestand.dokument.trainingseinheiten]
  trainingseinheiten[index] = {
    ...einheit,
    saetze: einheit.saetze.filter((satz) => satz.id !== satzId),
  }
  return schreiben({ ...bestand.dokument, trainingseinheiten })
}

function einheitAbschliessen(einheitId) {
  const bestand = dokumentLaden()
  if (!speicherLesbar(bestand.status))
    return { status: bestand.status, meldung: speicherhinweis(bestand.status) }
  const index = bestand.dokument.trainingseinheiten.findIndex(
    (einheit) => einheit?.id === einheitId && !einheit?.abgeschlossenAm
  )
  const einheit = bestand.dokument.trainingseinheiten[index]
  if (!einheit)
    return { status: 'einheit_fehlt', meldung: 'Die offene Trainingseinheit wurde nicht gefunden.' }
  if (!Array.isArray(einheit.saetze) || !einheit.saetze.length)
    return { status: 'einheit_leer', meldung: 'Erfasse mindestens einen Satz vor dem Abschluss.' }
  const trainingseinheiten = [...bestand.dokument.trainingseinheiten]
  trainingseinheiten[index] = { ...einheit, abgeschlossenAm: new Date().toISOString() }
  return schreiben({ ...bestand.dokument, trainingseinheiten })
}

trainingLaden()

export function useTraining() {
  const aktuellesProgramm = computed(() => programmeNachId.get(zustand.programmId))
  const offeneEinheit = computed(
    () => zustand.einheiten.find((einheit) => !einheit?.abgeschlossenAm) ?? null
  )
  return {
    zustand: lesbar,
    programme,
    uebungen,
    aktuellesProgramm,
    offeneEinheit,
    trainingLaden,
    programmWaehlen,
    einheitStarten,
    satzHinzufuegen,
    satzLoeschen,
    einheitAbschliessen,
  }
}
