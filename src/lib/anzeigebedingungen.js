// Eine kurze Kontextprobe ohne Zeichnung und ohne dauerhaft belegte GPU-Ressourcen.
// OffscreenCanvas gibt es nicht ueberall (Safari erst ab 16.4); fehlt es, wuerde
// die Probe sonst "kein WebGL" melden, obwohl WebGL funktioniert.
export function webglVerfuegbar() {
  try {
    const probe =
      typeof OffscreenCanvas === 'function'
        ? new OffscreenCanvas(1, 1)
        : document.createElement('canvas')
    const kontext = probe.getContext('webgl2') || probe.getContext('webgl')
    if (!kontext) return false
    kontext.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    // Auch fehlende Browserunterstützung behält die vollständige Ruhefassung.
    return false
  }
}

// Abstaende darueber sind keine Langsamkeit, sondern eine Pause: ein verdecktes
// Fenster, ein anderer Tab, ein zugeklappter Laptop. Der Browser zeichnet dann
// gar nicht und liefert beim naechsten Bild einen Sprung von Sekunden. Unterhalb
// von vier Bildern je Sekunde laesst sich beides nicht mehr unterscheiden; im
// Zweifel behalten wir die Wahl des Nutzers, statt ihm die Effekte wegzunehmen.
const maximalerBildabstand = 250

export function bildrateMessen(beiLangsamerBildrate) {
  let bildAuftrag = null
  let fensterStart = null
  let vorherigesBild = null
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
    const abstand = vorherigesBild === null ? 0 : zeit - vorherigesBild
    vorherigesBild = zeit
    if (abstand > maximalerBildabstand) {
      // Ueber diese Pause wissen wir nichts. Das laufende Fenster ist wertlos,
      // und die bisherige Serie ebenso: frisch anfangen statt falsch schliessen.
      fensterStart = zeit
      bilder = 0
      langsameFenster = 0
    } else if (fensterStart === null) {
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
