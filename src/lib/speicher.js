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
  veralteterStand: 'veralteter_stand',
  speicherVoll: 'speicher_voll',
  zurueckgesetzt: 'zurueckgesetzt',
  bestaetigungNoetig: 'bestaetigung_noetig',
  // beides
  nichtVerfuegbar: 'nicht_verfuegbar',
})

export function leeresDokumentErzeugen() {
  // revision zaehlt jeden Schreibvorgang. Damit erkennt ein zweiter offener Tab,
  // dass er auf einem ueberholten Stand sitzt, statt ihn stillschweigend
  // zurueckzuschreiben.
  return {
    version: dokumentVersion,
    revision: 0,
    einstellungen: {},
    profil: null,
    tage: {},
    trainingseinheiten: [],
  }
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
    !Number.isInteger(dokument.revision) ||
    dokument.revision < 0 ||
    !(dokument.profil === null || istObjekt(dokument.profil)) ||
    !istObjekt(dokument.einstellungen) ||
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

// Bei Erfolg kommt das geschriebene Dokument zurueck -- mit der neuen Revision.
// Der Aufrufer arbeitet ab dann mit diesem weiter, sonst weist ihn der naechste
// Schreibversuch als veralteten Stand ab.
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

  // Hat inzwischen jemand anders geschrieben -- ein zweiter Tab, ein zweites
  // Fenster -- dann steht dort eine hoehere Revision. Dieses Dokument wuerde
  // die fremde Aenderung ueberschreiben, ohne dass es jemand merkt.
  if (
    bestand.status === Speicherstatus.geladen &&
    bestand.dokument.revision !== dokument.revision
  ) {
    return { status: Speicherstatus.veralteterStand, revision: bestand.dokument.revision }
  }

  const zuSchreiben = { ...dokument, revision: dokument.revision + 1 }
  rohwert = JSON.stringify(zuSchreiben)

  try {
    globalThis.localStorage.setItem(speicherSchluessel, rohwert)
    return { status: Speicherstatus.gespeichert, dokument: zuSchreiben }
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
