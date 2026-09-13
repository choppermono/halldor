// CSS bleibt die einzige Quelle fuer Dauer und Kurven, auch fuer WAAPI und Timer.
export function bewegungsTokens() {
  const stil = getComputedStyle(document.documentElement)
  return {
    wert: (name) => stil.getPropertyValue(name).trim(),
    dauer: (name) => {
      const wert = stil.getPropertyValue(name).trim()
      return parseFloat(wert) * (wert.endsWith('ms') ? 1 : 1000)
    },
  }
}
