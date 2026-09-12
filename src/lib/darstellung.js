import { kcalRunden } from './ernaehrung.js'
export function zahl(wert, stellen = 0) {
  return Number.isFinite(wert)
    ? wert.toLocaleString('de-CH', { maximumFractionDigits: stellen })
    : 'unbekannt'
}
export function kalorien(wert) {
  return zahl(kcalRunden(wert))
}
export function lokalesDatum(datum = new Date()) {
  return `${datum.getFullYear()}-${String(datum.getMonth() + 1).padStart(2, '0')}-${String(datum.getDate()).padStart(2, '0')}`
}
export function tagVerschieben(datum, schritt) {
  const zeit = new Date(`${datum}T12:00:00`)
  zeit.setDate(zeit.getDate() + schritt)
  return lokalesDatum(zeit)
}
