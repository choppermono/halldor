// Stufenindex zur Rangfarbe aus den Tokens. -1 heisst: noch keine Stufe.
const SCHLUESSEL = ['bronze', 'silber', 'gold', 'platin', 'diamant']

export function rangFarbe(index) {
  return `var(--rang-${SCHLUESSEL[index] ?? 'ohne'})`
}

export function rangFarbName(index) {
  return SCHLUESSEL[index] ?? 'ohne'
}
