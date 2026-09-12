import { Speicherstatus } from './speicher.js'
export function speicherLesbar(status) {
  return status === Speicherstatus.leer || status === Speicherstatus.geladen
}
export function speicherhinweis(status) {
  if (speicherLesbar(status) || status === Speicherstatus.gespeichert) return ''
  if (status === Speicherstatus.speicherVoll)
    return 'Der Gerätespeicher ist voll. Die Änderung wurde nicht gespeichert.'
  if (status === Speicherstatus.veralteterStand)
    return 'Ein anderer Tab hat Daten geändert. Lade die Seite neu und prüfe die Angaben vor dem erneuten Speichern.'
  if (status === Speicherstatus.nichtVerfuegbar)
    return 'Der Gerätespeicher ist nicht verfügbar. Die Änderung wurde nicht gespeichert.'
  return 'Gespeicherte Daten sind unlesbar oder haben eine unbekannte Version. Sie bleiben unverändert; neue Änderungen können nicht gespeichert werden.'
}
