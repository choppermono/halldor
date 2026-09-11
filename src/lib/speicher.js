const speicherSchluessel = 'trackify'
const dokumentVersion = 1

// Alle Status an einer Stelle. Sonst vergleichen die naechsten Pakete diese
// Zeichenketten von Hand, und ein Tippfehler wirft keinen Fehler: er faellt
// still in den Else-Zweig und sieht aus wie "alles in Ordnung".
export const Speicherstatus = Object.freeze({
  // Laden
  leer: 'leer',
  geladen: 'geladen',
  unbekannteVersion: 'unbekannte_version',
  kaputtesJson: 'kaputtes_json',
  fremderInhalt: 'fremder_inhalt',
  // Schreiben und Zuruecksetzen
  gespeichert: 'gespeichert',
  ungueltigesDokument: 'ungueltiges_dokument',
  speicherVoll: 'speicher_voll',
  zurueckgesetzt: 'zurueckgesetzt',
  bestaetigungNoetig: 'bestaetigung_noetig',
  // beides
  nichtVerfuegbar: 'nicht_verfuegbar',
})

export function leeresDokumentErzeugen() {
  return { version: dokumentVersion, profil: null, tage: {}, trainingseinheiten: [] }
}

function istObjekt(wert) {
  return wert !== null && typeof wert === 'object' && !Array.isArray(wert)
}

function dokumentStatus(dokument) {
  if (!istObjekt(dokument) || !Number.isInteger(dokument.version)) {
    return Speicherstatus.fremderInhalt
  }
  // Andere Versionen koennen eine andere Grundform haben.
  if (dokument.version !== dokumentVersion) return Speicherstatus.unbekannteVersion
  if (
    !(dokument.profil === null || istObjekt(dokument.profil)) ||
    !istObjekt(dokument.tage) ||
    !Array.isArray(dokument.trainingseinheiten)
  ) {
    return Speicherstatus.fremderInhalt
  }
  return Speicherstatus.geladen
}

export function dokumentLaden() {
  let rohwert
  try {
    // Schon der Zugriff auf localStorage kann bei blockierten Website-Daten werfen.
    rohwert = globalThis.localStorage.getItem(speicherSchluessel)
  } catch {
    return { status: Speicherstatus.nichtVerfuegbar, dokument: leeresDokumentErzeugen() }
  }
  if (rohwert === null) {
    return { status: Speicherstatus.leer, dokument: leeresDokumentErzeugen() }
  }

  let dokument
  try {
    dokument = JSON.parse(rohwert)
  } catch {
    return { status: Speicherstatus.kaputtesJson, dokument: leeresDokumentErzeugen() }
  }

  const status = dokumentStatus(dokument)
  if (status === Speicherstatus.geladen) return { status, dokument }
  if (status === Speicherstatus.unbekannteVersion) {
    return { status, dokument: leeresDokumentErzeugen(), version: dokument.version }
  }
  return { status, dokument: leeresDokumentErzeugen() }
}

export function dokumentSpeichern(dokument) {
  let rohwert
  try {
    if (dokumentStatus(dokument) !== Speicherstatus.geladen) {
      return { status: Speicherstatus.ungueltigesDokument }
    }
    rohwert = JSON.stringify(dokument)
    // Auch die tatsaechlich serialisierte Grundform muss spaeter wieder lesbar sein.
    if (dokumentStatus(JSON.parse(rohwert)) !== Speicherstatus.geladen) {
      return { status: Speicherstatus.ungueltigesDokument }
    }
  } catch {
    return { status: Speicherstatus.ungueltigesDokument }
  }

  // Den Bestand vor jedem Schreiben pruefen, auch ohne vorherigen Ladeaufruf.
  const bestand = dokumentLaden()
  if (bestand.status !== Speicherstatus.leer && bestand.status !== Speicherstatus.geladen) {
    return { status: bestand.status }
  }

  try {
    globalThis.localStorage.setItem(speicherSchluessel, rohwert)
    return { status: Speicherstatus.gespeichert }
  } catch (fehler) {
    return {
      status:
        fehler?.name === 'QuotaExceededError'
          ? Speicherstatus.speicherVoll
          : Speicherstatus.nichtVerfuegbar,
    }
  }
}

export function dokumentZuruecksetzen(bestaetigt = false) {
  // Ein automatischer Aufruf nach einem Ladefehler darf nichts loeschen.
  if (bestaetigt !== true) return { status: Speicherstatus.bestaetigungNoetig }
  try {
    globalThis.localStorage.removeItem(speicherSchluessel)
    return { status: Speicherstatus.zurueckgesetzt, dokument: leeresDokumentErzeugen() }
  } catch {
    return { status: Speicherstatus.nichtVerfuegbar }
  }
}
