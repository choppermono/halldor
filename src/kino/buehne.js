import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useAnzeigeebene } from '../composables/useAnzeigeebene.js'

// Gemeinsamer Unterbau fuer jede Three.js-Szene der Anzeigeebene. Er haelt
// den Vertrag aus der README ein, damit ihn nicht jede Szene neu schreibt:
// laden erst bei webglAktiv, anhalten bei verstecktem Tab oder reduzierter
// Bewegung, alles freigeben beim Aushaengen oder Kontextverlust.
//
// aufbauen(THREE, szene, renderer) liefert { kamera, bild(sek, zeit),
// groesse?(breite, hoehe), freigeben?() }.
export function useDreiBuehne(flaeche, aufbauen, { pixelMax = 2 } = {}) {
  const { webglAktiv } = useAnzeigeebene()
  const bereit = ref(false)
  let montiert = false
  let laedt = false
  let renderer = null
  let szene = null
  let teil = null
  let beobachter = null
  let auftrag = null
  let letzte = null
  let beginn = null

  function anhalten() {
    if (auftrag !== null) cancelAnimationFrame(auftrag)
    auftrag = null
    letzte = null
  }

  function freigeben() {
    anhalten()
    beobachter?.disconnect()
    beobachter = null
    try {
      teil?.freigeben?.()
      szene?.traverse((objekt) => {
        objekt.geometry?.dispose()
        const materialien = Array.isArray(objekt.material) ? objekt.material : [objekt.material]
        materialien.forEach((material) => {
          material?.map?.dispose()
          material?.dispose?.()
        })
      })
    } catch {
      // Freigeben darf nie selbst scheitern.
    }
    if (renderer) {
      renderer.domElement.removeEventListener('webglcontextlost', verloren)
      renderer.dispose()
      if (!renderer.getContext().isContextLost()) renderer.forceContextLoss()
      renderer.domElement.remove()
    }
    renderer = szene = teil = null
    bereit.value = false
  }

  function verloren(ereignis) {
    ereignis.preventDefault()
    freigeben()
  }

  function groesse() {
    if (!renderer || !flaeche.value) return
    const { clientWidth: breite, clientHeight: hoehe } = flaeche.value
    if (!breite || !hoehe) return
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelMax))
    renderer.setSize(breite, hoehe, true)
    teil.groesse?.(breite, hoehe, renderer.getPixelRatio())
  }

  function bild(zeit) {
    auftrag = null
    if (!montiert || !webglAktiv.value || !renderer) return
    if (beginn === null) beginn = zeit
    // Pausen werden nicht nachgeholt; ein Sprung nach dem Tabwechsel waere
    // sichtbar.
    const sekunden = letzte === null ? 0 : Math.min((zeit - letzte) / 1000, 0.05)
    letzte = zeit
    try {
      teil.bild(sekunden, (zeit - beginn) / 1000)
      renderer.render(szene, teil.kamera)
      if (!bereit.value) bereit.value = true
    } catch {
      freigeben()
      return
    }
    auftrag = requestAnimationFrame(bild)
  }

  function starten() {
    if (montiert && webglAktiv.value && renderer && auftrag === null)
      auftrag = requestAnimationFrame(bild)
  }

  async function vorbereiten() {
    if (laedt) return
    laedt = true
    try {
      // Erst wenn der Browser Luft hat: das erste Bild und die Bedienung
      // gehen vor, 3D kommt einen Augenblick spaeter.
      await leerlauf()
      const THREE = await import('./drei.js')
      if (!montiert || !webglAktiv.value || !flaeche.value) return
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      })
      renderer.setClearColor(0x000000, 0)
      renderer.domElement.setAttribute('aria-hidden', 'true')
      renderer.domElement.addEventListener('webglcontextlost', verloren)
      szene = new THREE.Scene()
      teil = aufbauen(THREE, szene, renderer)
      flaeche.value.append(renderer.domElement)
      beobachter = new ResizeObserver(groesse)
      beobachter.observe(flaeche.value)
      groesse()
      starten()
    } catch {
      // Ein gescheiterter Import oder Kontext laesst den Kern unberuehrt.
      freigeben()
    } finally {
      laedt = false
    }
  }

  onMounted(() => {
    montiert = true
    watch(
      webglAktiv,
      (aktiv) => {
        if (!aktiv) anhalten()
        else if (renderer) starten()
        else vorbereiten()
      },
      { immediate: true, flush: 'sync' }
    )
  })
  onBeforeUnmount(() => {
    montiert = false
    freigeben()
  })

  return { bereit }
}

function leerlauf() {
  return new Promise((fertig) => {
    if ('requestIdleCallback' in window) requestIdleCallback(() => fertig(), { timeout: 900 })
    else setTimeout(fertig, 120)
  })
}

// Farben kommen aus den Tokens, damit die Szenen der Palette folgen.
export function tokenFarbe(THREE, name) {
  const wert = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return new THREE.Color(wert || '#ffffff')
}

// Weicher runder Lichtfleck als Textur fuer Halos und Nebel.
export function lichtTextur(THREE) {
  const leinwand = document.createElement('canvas')
  leinwand.width = leinwand.height = 128
  const stift = leinwand.getContext('2d')
  const verlauf = stift.createRadialGradient(64, 64, 0, 64, 64, 64)
  verlauf.addColorStop(0, 'rgba(255,255,255,1)')
  verlauf.addColorStop(0.35, 'rgba(255,255,255,0.35)')
  verlauf.addColorStop(1, 'rgba(255,255,255,0)')
  stift.fillStyle = verlauf
  stift.fillRect(0, 0, 128, 128)
  const textur = new THREE.CanvasTexture(leinwand)
  textur.colorSpace = THREE.SRGBColorSpace
  return textur
}

export const sanft = (t) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3)
export const federnd = (t) => {
  const x = Math.min(Math.max(t, 0), 1)
  const c = 1.70158
  return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2)
}
