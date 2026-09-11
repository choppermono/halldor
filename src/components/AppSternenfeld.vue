<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const flaeche = ref(null)
let THREE
let renderer
let scene
let kamera
let sterne
let animation
let beobachter
let groessenbeobachter
let bewegungReduziert = false

function farbe(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}
function groesseAnpassen() {
  const breite = flaeche.value.clientWidth
  const hoehe = flaeche.value.clientHeight
  kamera.aspect = breite / hoehe
  kamera.updateProjectionMatrix()
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.setSize(breite, hoehe)
}
function zeichnen() {
  sterne.rotation.y += 0.00012
  sterne.rotation.x += 0.00003
  renderer.render(scene, kamera)
}
function schleife() {
  zeichnen()
  animation = requestAnimationFrame(schleife)
}
function anhalten() {
  cancelAnimationFrame(animation)
  animation = undefined
}
function starten() {
  if (!animation && !bewegungReduziert) animation = requestAnimationFrame(schleife)
}

onMounted(async () => {
  bewegungReduziert = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  THREE = await import('three')
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  } catch {
    return
  }
  scene = new THREE.Scene()
  kamera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  kamera.position.z = 10
  const positionen = new Float32Array(180 * 3)
  for (let index = 0; index < positionen.length; index += 3) {
    positionen[index] = (Math.random() - 0.5) * 20
    positionen[index + 1] = (Math.random() - 0.5) * 14
    positionen[index + 2] = (Math.random() - 0.5) * 10
  }
  const geometrie = new THREE.BufferGeometry()
  geometrie.setAttribute('position', new THREE.BufferAttribute(positionen, 3))
  sterne = new THREE.Points(
    geometrie,
    new THREE.PointsMaterial({
      color: farbe('--farbe-sterne'),
      size: 0.035,
      transparent: true,
      opacity: 0.32,
    })
  )
  scene.add(sterne)
  flaeche.value.append(renderer.domElement)
  groesseAnpassen()
  groessenbeobachter = new ResizeObserver(groesseAnpassen)
  groessenbeobachter.observe(flaeche.value)
  if (bewegungReduziert) {
    zeichnen()
    return
  }
  beobachter = new IntersectionObserver(([eintrag]) => {
    if (eintrag.isIntersecting) starten()
    else anhalten()
  })
  beobachter.observe(flaeche.value)
})
onBeforeUnmount(() => {
  anhalten()
  beobachter?.disconnect()
  groessenbeobachter?.disconnect()
  renderer?.dispose()
})
</script>

<template><div ref="flaeche" class="sternenfeld" aria-hidden="true"></div></template>

<style scoped>
.sternenfeld {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  background:
    radial-gradient(
      circle at 50% 30%,
      color-mix(in srgb, var(--farbe-flaeche) 40%, transparent),
      transparent 52%
    ),
    var(--farbe-grund);
}
.sternenfeld :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
