// Eine kurze Kontextprobe ohne DOM, Zeichnung oder dauerhaft belegte GPU-Ressourcen.
export function webglVerfuegbar() {
  try {
    const probe = new OffscreenCanvas(1, 1)
    const kontext = probe.getContext('webgl2') || probe.getContext('webgl')
    if (!kontext) return false
    kontext.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    // Auch fehlende Browserunterstützung behält die vollständige Ruhefassung.
    return false
  }
}

export function bildrateMessen(beiLangsamerBildrate) {
  let bildAuftrag = null
  let fensterStart = null
  let bilder = 0
  let langsameFenster = 0
  let beendet = false

  function beenden() {
    beendet = true
    if (bildAuftrag !== null) cancelAnimationFrame(bildAuftrag)
    bildAuftrag = null
  }

  function bildMessen(zeit) {
    bildAuftrag = null
    if (beendet) return
    if (fensterStart === null) {
      fensterStart = zeit
    } else {
      bilder += 1
      const dauer = zeit - fensterStart
      if (dauer >= 1000) {
        const bildrate = (bilder * 1000) / dauer
        // Rundungsreste der Zeitstempel dürfen genau 45 fps nicht herunterstufen.
        langsameFenster = bildrate < 45 - 0.000001 ? langsameFenster + 1 : 0
        fensterStart = zeit
        bilder = 0
        // Drei aufeinanderfolgende Sekundenfenster filtern einzelne Ruckler.
        if (langsameFenster >= 3) {
          beenden()
          beiLangsamerBildrate()
          return
        }
      }
    }
    bildAuftrag = requestAnimationFrame(bildMessen)
  }

  bildAuftrag = requestAnimationFrame(bildMessen)
  return beenden
}
