<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useAnzeigeebene } from '../composables/useAnzeigeebene.js'

const { webglAktiv } = useAnzeigeebene()
const flaeche = ref(null)
let montiert = false
let laedt = false
let renderer = null
let szene = null
let kamera = null
let sterne = null
let geometrie = null
let material = null
let groessenbeobachter = null
let bildauftrag = null
let letzteBildzeit = null
let pixelverhaeltnis
let drehungX
let drehungY
let maximalerBildabstand

function anhalten() {
  if (bildauftrag !== null) cancelAnimationFrame(bildauftrag)
  bildauftrag = null
  // Pausen werden beim Fortsetzen nicht als Bewegungszeit nachgeholt.
  letzteBildzeit = null
}

function freigeben() {
  anhalten()
  groessenbeobachter?.disconnect()
  groessenbeobachter = null
  geometrie?.dispose()
  material?.dispose()
  // Die Szene verwendet keine Texturen, Schatten oder Nachbearbeitung.
  if (renderer) {
    renderer.domElement.removeEventListener('webglcontextlost', kontextVerloren)
    renderer.dispose()
    if (!renderer.getContext().isContextLost()) renderer.forceContextLoss()
    renderer.domElement.remove()
  }
  geometrie = material = renderer = szene = kamera = sterne = null
}

function kontextVerloren(ereignis) {
  ereignis.preventDefault()
  freigeben()
}

function zeichnen() {
  try {
    renderer.render(szene, kamera)
  } catch {
    freigeben()
  }
}

function groesseAnpassen() {
  if (!montiert || !renderer || !flaeche.value) return
  const { clientWidth: breite, clientHeight: hoehe } = flaeche.value
  if (!breite || !hoehe) return
  try {
    kamera.aspect = breite / hoehe
    kamera.updateProjectionMatrix()
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelverhaeltnis))
    // true: der Renderer setzt die CSS-Groesse des Canvas selbst. Mit false
    // bleibt sie ungesetzt und kollidiert mit der Regel unten.
    renderer.setSize(breite, hoehe, true)
    // Auch bei angehaltener Schleife braucht die neue Flaeche ein frisches Bild.
    zeichnen()
  } catch {
    freigeben()
  }
}

function bildZeichnen(zeit) {
  bildauftrag = null
  if (!montiert || !webglAktiv.value || !renderer) return
  const sekunden =
    letzteBildzeit === null ? 0 : Math.min((zeit - letzteBildzeit) / 1000, maximalerBildabstand)
  letzteBildzeit = zeit
  sterne.rotation.x += sekunden * drehungX
  sterne.rotation.y += sekunden * drehungY
  zeichnen()
  if (renderer) bildauftrag = requestAnimationFrame(bildZeichnen)
}

function starten() {
  if (montiert && webglAktiv.value && renderer && bildauftrag === null) {
    bildauftrag = requestAnimationFrame(bildZeichnen)
  }
}

async function vorbereiten() {
  if (laedt) return
  laedt = true
  try {
    const {
      WebGLRenderer,
      Scene,
      PerspectiveCamera,
      BufferGeometry,
      BufferAttribute,
      Points,
      PointsMaterial,
    } = await import('three')
    if (!montiert || !webglAktiv.value || !flaeche.value) return

    const tokens = getComputedStyle(document.documentElement)
    const token = (name) => tokens.getPropertyValue(name).trim()
    const zahl = (name) => {
      const wert = token(name)
      if (!wert || !Number.isFinite(Number(wert)))
        throw new Error('Ungueltiger Kino-Token: ' + name)
      return Number(wert)
    }
    pixelverhaeltnis = zahl('--sterne-pixelverhaeltnis')
    drehungX = zahl('--sterne-drehung-x')
    drehungY = zahl('--sterne-drehung-y')
    maximalerBildabstand = zahl('--sterne-bildabstand-max')
    szene = new Scene()
    kamera = new PerspectiveCamera(
      zahl('--sterne-blickwinkel'),
      1,
      zahl('--sterne-nahgrenze'),
      zahl('--sterne-ferngrenze')
    )
    kamera.position.z = zahl('--sterne-kamera-abstand')
    const ausdehnung = ['--sterne-breite', '--sterne-hoehe', '--sterne-tiefe'].map(zahl)
    const positionen = new Float32Array(zahl('--sterne-anzahl') * 3)
    for (let index = 0; index < positionen.length; index++) {
      positionen[index] = (Math.random() - 0.5) * ausdehnung[index % 3]
    }
    geometrie = new BufferGeometry()
    geometrie.setAttribute('position', new BufferAttribute(positionen, 3))
    material = new PointsMaterial({
      color: token('--farbe-sterne'),
      size: zahl('--sterne-groesse'),
      transparent: true,
      opacity: zahl('--sterne-deckkraft'),
      depthWrite: false,
      toneMapped: false,
    })
    sterne = new Points(geometrie, material)
    szene.add(sterne)
    renderer = new WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' })
    renderer.domElement.setAttribute('aria-hidden', 'true')
    renderer.domElement.addEventListener('webglcontextlost', kontextVerloren)
    flaeche.value.append(renderer.domElement)
    groessenbeobachter = new ResizeObserver(groesseAnpassen)
    groessenbeobachter.observe(flaeche.value)
    groesseAnpassen()
    starten()
  } catch {
    // Auch ein gescheiterter Import oder Kontext laesst den Kern unberuehrt.
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
</script>

<template>
  <div
    ref="flaeche"
    class="sternenfeld"
    :class="{ 'sternenfeld-ruhend': !webglAktiv }"
    aria-hidden="true"
  ></div>
</template>

<style scoped>
.sternenfeld {
  position: fixed;
  z-index: var(--z-hintergrund);
  inset: var(--sterne-rand);
  overflow: hidden;
  pointer-events: none;
}
.sternenfeld-ruhend {
  visibility: hidden;
}
.sternenfeld :deep(canvas) {
  display: block;
}
</style>
