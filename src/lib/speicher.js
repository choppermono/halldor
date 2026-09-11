const speicherSchluessel = 'trackify'
const dokumentVersion = 1

export function leeresDokumentErzeugen() {
  return { version: dokumentVersion, profil: null, tage: {}, trainingseinheiten: [] }
}

function istObjekt(wert) {
  return wert !== null && typeof wert === 'object' && !Array.isArray(wert)
}

function dokumentStatus(dokument) {
  if (!istObjekt(dokument) || !Number.isInteger(dokument.version)) return 'fremder_inhalt'
  // Andere Versionen koennen eine andere Grundform haben.
  if (dokument.version !== dokumentVersion) return 'unbekannte_version'
  if (
    !(dokument.profil === null || istObjekt(dokument.profil)) ||
    !istObjekt(dokument.tage) ||
    !Array.isArray(dokument.trainingseinheiten)
  ) {
    return 'fremder_inhalt'
  }
  return 'geladen'
}

export function dokumentLaden() {
  let rohwert
  try {
    // Schon der Zugriff auf localStorage kann bei blockierten Website-Daten werfen.
    rohwert = globalThis.localStorage.getItem(speicherSchluessel)
  } catch {
    return { status: 'nicht_verfuegbar', dokument: leeresDokumentErzeugen() }
  }
  if (rohwert === null) return { status: 'leer', dokument: leeresDokumentErzeugen() }

  let dokument
  try {
    dokument = JSON.parse(rohwert)
  } catch {
    return { status: 'kaputtes_json', dokument: leeresDokumentErzeugen() }
  }

  const status = dokumentStatus(dokument)
  if (status === 'geladen') return { status, dokument }
  if (status === 'unbekannte_version') {
    return { status, dokument: leeresDokumentErzeugen(), version: dokument.version }
  }
  return { status, dokument: leeresDokumentErzeugen() }
}

export function dokumentSpeichern(dokument) {
  let rohwert
  try {
    if (dokumentStatus(dokument) !== 'geladen') return { status: 'ungueltiges_dokument' }
    rohwert = JSON.stringify(dokument)
    // Auch die tatsaechlich serialisierte Grundform muss spaeter wieder lesbar sein.
    if (dokumentStatus(JSON.parse(rohwert)) !== 'geladen') {
      return { status: 'ungueltiges_dokument' }
    }
  } catch {
    return { status: 'ungueltiges_dokument' }
  }

  // Den Bestand vor jedem Schreiben pruefen, auch ohne vorherigen Ladeaufruf.
  const bestand = dokumentLaden()
  if (bestand.status !== 'leer' && bestand.status !== 'geladen') {
    return { status: bestand.status }
  }

  try {
    globalThis.localStorage.setItem(speicherSchluessel, rohwert)
    return { status: 'gespeichert' }
  } catch (fehler) {
    return {
      status: fehler?.name === 'QuotaExceededError' ? 'speicher_voll' : 'nicht_verfuegbar',
    }
  }
}

export function dokumentZuruecksetzen(bestaetigt = false) {
  // Ein automatischer Aufruf nach einem Ladefehler darf nichts loeschen.
  if (bestaetigt !== true) return { status: 'bestaetigung_noetig' }
  try {
    globalThis.localStorage.removeItem(speicherSchluessel)
    return { status: 'zurueckgesetzt', dokument: leeresDokumentErzeugen() }
  } catch {
    return { status: 'nicht_verfuegbar' }
  }
}
