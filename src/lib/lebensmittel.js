// UNBELEGT: technische Erfassungsgrenzen, keine Portions- oder Verzehrempfehlung.
export const PRODUKT_GRENZEN = Object.freeze({
  mengeMin: 0.1,
  mengeMax: 10000,
  portionMax: 2000,
  kcalMax: 1000,
  grammMax: 100,
  nameMax: 200,
})
export const NAEHRWERTE = Object.freeze([
  { key: 'kcal', label: 'Energie', einheit: 'kcal', max: PRODUKT_GRENZEN.kcalMax },
  { key: 'proteinG', label: 'Protein', einheit: 'g', max: PRODUKT_GRENZEN.grammMax },
  { key: 'fettG', label: 'Fett', einheit: 'g', max: PRODUKT_GRENZEN.grammMax },
  { key: 'kohlenhydrateG', label: 'Kohlenhydrate', einheit: 'g', max: PRODUKT_GRENZEN.grammMax },
  { key: 'zuckerG', label: 'Zucker', einheit: 'g', max: PRODUKT_GRENZEN.grammMax, optional: true },
  {
    key: 'gesaettigtG',
    label: 'Gesättigte Fettsäuren',
    einheit: 'g',
    max: PRODUKT_GRENZEN.grammMax,
    optional: true,
  },
  { key: 'salzG', label: 'Salz', einheit: 'g', max: PRODUKT_GRENZEN.grammMax, optional: true },
])
export function zahlOderUnbekannt(wert, max) {
  if (wert === null || wert === undefined || wert === '' || typeof wert === 'boolean') return null
  const zahl = typeof wert === 'string' && wert.trim() !== '' ? Number(wert) : wert
  return Number.isFinite(zahl) && zahl >= 0 && zahl <= max ? zahl : null
}
export function produktPruefen(produkt) {
  if (
    !produkt ||
    typeof produkt !== 'object' ||
    typeof produkt.name !== 'string' ||
    !produkt.name.trim() ||
    produkt.name.length > PRODUKT_GRENZEN.nameMax
  )
    return { status: 'produkt_ungueltig', meldung: 'Ein Produktname ist erforderlich.' }
  if (
    produkt.barcode !== null &&
    !(typeof produkt.barcode === 'string' && /^\d{8,14}$/.test(produkt.barcode))
  )
    return {
      status: 'barcode_ungueltig',
      meldung: 'Der Barcode muss aus 8 bis 14 Ziffern bestehen.',
    }
  if (!(
    produkt.marke === null ||
    (typeof produkt.marke === 'string' && produkt.marke.length <= PRODUKT_GRENZEN.nameMax)
  ))
    return { status: 'marke_ungueltig', meldung: 'Die Marke ist ungültig.' }
  if (!produkt.pro100g || typeof produkt.pro100g !== 'object')
    return { status: 'naehrwerte_ungueltig', meldung: 'Nährwertfelder fehlen.' }
  const pro100g = {}
  for (const feld of NAEHRWERTE) {
    const wert = produkt.pro100g[feld.key]
    if (feld.optional && wert === undefined) continue
    if (wert !== null && (typeof wert !== 'number' || zahlOderUnbekannt(wert, feld.max) === null))
      return {
        status: 'naehrwert_ungueltig',
        meldung: `${feld.label}: eine Zahl zwischen 0 und ${feld.max} oder unbekannt angeben.`,
      }
    pro100g[feld.key] = wert
  }
  return {
    status: 'ok',
    wert: {
      name: produkt.name.trim(),
      marke: produkt.marke?.trim() || null,
      barcode: produkt.barcode,
      pro100g,
    },
  }
}
export function mengePruefen(mengeG) {
  return Number.isFinite(mengeG) &&
    mengeG >= PRODUKT_GRENZEN.mengeMin &&
    mengeG <= PRODUKT_GRENZEN.mengeMax
    ? { status: 'ok', wert: mengeG }
    : {
        status: 'menge_ungueltig',
        meldung: `Die Menge muss zwischen ${PRODUKT_GRENZEN.mengeMin} und ${PRODUKT_GRENZEN.mengeMax} g liegen.`,
      }
}
export function bilanzBerechnen(eintraege) {
  const bilanz = {}
  for (const feld of NAEHRWERTE) {
    let bekannt = 0
    let unbekannt = 0
    for (const eintrag of Array.isArray(eintraege) ? eintraege : []) {
      const wert = eintrag?.pro100g?.[feld.key]
      if (!Number.isFinite(wert) || wert < 0 || mengePruefen(eintrag?.mengeG).status !== 'ok')
        unbekannt++
      else bekannt += (wert * eintrag.mengeG) / 100
    }
    bilanz[feld.key] = { bekannt, unbekannt, vollstaendig: unbekannt === 0 }
  }
  return bilanz
}
