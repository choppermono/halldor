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
