<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { tokenFarbe, useDreiBuehne } from './buehne.js'

// Ein Ring aus Partikeln auf der Innenlinie des Kalorienrings. Die Partikel
// fliessen im Uhrzeigersinn; welcher Anteil leuchtet, entscheidet der Winkel,
// nicht das Teilchen. So bleibt die Grenze stehen, waehrend alles fliesst.
// Die Zahl im Kern-DOM bleibt die Aussage; der Orbit ist nur Licht.
const props = defineProps({
  anteil: { type: Number, default: 0 },
  ueber: { type: Boolean, default: false },
})
const flaeche = ref(null)
const ziel = { anteil: 0, neigungX: 0, neigungY: 0 }
watch(
  () => props.anteil,
  (wert) => (ziel.anteil = Math.min(1, Math.max(0, wert / 100))),
  { immediate: true }
)

// Der Ring neigt sich leicht zum Zeiger; das gibt ihm Tiefe.
function zeiger(ereignis) {
  ziel.neigungY = (ereignis.clientX / window.innerWidth - 0.5) * 0.5
  ziel.neigungX = (ereignis.clientY / window.innerHeight - 0.5) * -0.5
}
onMounted(() => window.addEventListener('pointermove', zeiger, { passive: true }))
onBeforeUnmount(() => window.removeEventListener('pointermove', zeiger))

const { bereit } = useDreiBuehne(flaeche, (THREE, szene) => {
  const kamera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10)
  const ANZAHL = 2600
  const winkel = new Float32Array(ANZAHL)
  const radius = new Float32Array(ANZAHL)
  const tiefe = new Float32Array(ANZAHL)
  const tempo = new Float32Array(ANZAHL)
  const groesse = new Float32Array(ANZAHL)
  for (let i = 0; i < ANZAHL; i++) {
    winkel[i] = Math.random() * Math.PI * 2
    // Dicht auf der Linie, nach aussen ausduennend.
    const streuung = Math.pow(Math.random(), 2.5) * (Math.random() < 0.5 ? -1 : 1)
    radius[i] = 0.8 + streuung * 0.07
    tiefe[i] = (Math.random() - 0.5) * 0.3
    tempo[i] = 0.05 + Math.random() * 0.12
    groesse[i] = 1 + Math.random() * 2.2
  }
  const form = new THREE.BufferGeometry()
  form.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ANZAHL * 3), 3))
  form.setAttribute('aWinkel', new THREE.BufferAttribute(winkel, 1))
  form.setAttribute('aRadius', new THREE.BufferAttribute(radius, 1))
  form.setAttribute('aTiefe', new THREE.BufferAttribute(tiefe, 1))
  form.setAttribute('aTempo', new THREE.BufferAttribute(tempo, 1))
  form.setAttribute('aGroesse', new THREE.BufferAttribute(groesse, 1))

  const uniforms = {
    uZeit: { value: 0 },
    uAnteil: { value: 0 },
    uPixel: { value: 1 },
    uAn: { value: tokenFarbe(THREE, '--sig-text') },
    uAus: { value: tokenFarbe(THREE, '--bone') },
  }
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      attribute float aWinkel;
      attribute float aRadius;
      attribute float aTiefe;
      attribute float aTempo;
      attribute float aGroesse;
      uniform float uZeit;
      uniform float uAnteil;
      uniform float uPixel;
      varying float vAn;
      varying float vLicht;
      void main() {
        float w = aWinkel + uZeit * aTempo;
        float a = fract(w / 6.2831853);
        // w = 0 oben, dann im Uhrzeigersinn: wie die Skala im Kern.
        vec3 p = vec3(sin(w) * aRadius, cos(w) * aRadius, aTiefe);
        vAn = step(a, uAnteil);
        float kopf = (1.0 - smoothstep(0.0, 0.03, abs(a - uAnteil))) * step(0.001, uAnteil);
        vLicht = mix(0.26, 0.9, vAn) + kopf * 0.7;
        gl_PointSize = aGroesse * uPixel * (1.0 + vAn * 0.5 + kopf * 1.4);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 uAn;
      uniform vec3 uAus;
      varying float vAn;
      varying float vLicht;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float weich = smoothstep(0.5, 0.0, d);
        vec3 farbe = mix(uAus, uAn, vAn);
        gl_FragColor = vec4(farbe * weich * vLicht, weich * vLicht);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const ring = new THREE.Points(form, material)
  // Die Positionen entstehen im Shader; die Begrenzung waere sonst falsch.
  ring.frustumCulled = false
  szene.add(ring)

  let quadrat = 1
  return {
    kamera,
    groesse(breite, hoehe, pixel) {
      // Die Flaeche ist quadratisch wie der Kern-Ring; sonst Seitenverhaeltnis halten.
      quadrat = breite / hoehe
      kamera.left = -quadrat
      kamera.right = quadrat
      kamera.updateProjectionMatrix()
      uniforms.uPixel.value = pixel
    },
    bild(sek, zeit) {
      uniforms.uZeit.value = zeit
      // Beim Oeffnen fuellt sich der Anteil einmal von null auf.
      uniforms.uAnteil.value += (ziel.anteil - uniforms.uAnteil.value) * Math.min(1, sek * 3)
      ring.rotation.x += (ziel.neigungX - ring.rotation.x) * Math.min(1, sek * 2)
      ring.rotation.y += (ziel.neigungY - ring.rotation.y) * Math.min(1, sek * 2)
    },
  }
})
</script>

<template>
  <div ref="flaeche" class="energie-orbit" :class="{ bereit }" aria-hidden="true"></div>
</template>

<style scoped>
.energie-orbit {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity var(--slow) var(--ease);
}
.energie-orbit.bereit {
  opacity: 1;
}
.energie-orbit :deep(canvas) {
  display: block;
}
</style>
