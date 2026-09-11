<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({ stufe: { type: String, required: true } })
const flaeche = ref(null)
const bauplaene = {
  bronze: {
    teile: 0,
    ringe: 0,
    geschwindigkeit: 0.0012,
    farbe: '--farbe-relikt-dunkel',
    geometrie: 'tetra',
  },
  silber: {
    teile: 0,
    ringe: 1,
    geschwindigkeit: 0.0018,
    farbe: '--farbe-text-leise',
    geometrie: 'okta',
  },
  gold: {
    teile: 0,
    ringe: 1,
    geschwindigkeit: 0.0024,
    farbe: '--farbe-relikt-warm',
    geometrie: 'iko',
  },
  platin: {
    teile: 0,
    ringe: 2,
    geschwindigkeit: 0.003,
    farbe: '--farbe-relikt-hell',
    geometrie: 'dodeka',
  },
  diamant: {
    teile: 5,
    ringe: 2,
    geschwindigkeit: 0.0038,
    farbe: '--farbe-relikt-hell',
    geometrie: 'iko',
  },
  champion: {
    teile: 7,
    ringe: 3,
    geschwindigkeit: 0.0048,
    farbe: '--farbe-relikt-warm',
    geometrie: 'dodeka',
  },
  olympus: {
    teile: 11,
    ringe: 4,
    geschwindigkeit: 0.006,
    farbe: '--farbe-relikt-hell',
    geometrie: 'iko',
  },
}
let THREE
let renderer
let scene
let kamera
let relikt
let animation
let beobachter
let groessenbeobachter
let bewegungReduziert = false
function farbe(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}
function geometrieFuer(name) {
  if (name === 'tetra') return new THREE.TetrahedronGeometry(1.05, 0)
  if (name === 'okta') return new THREE.OctahedronGeometry(1.1, 0)
  if (name === 'dodeka') return new THREE.DodecahedronGeometry(1.05, 0)
  return new THREE.IcosahedronGeometry(1.08, 1)
}
function reliktBauen() {
  scene.remove(relikt)
  relikt?.traverse((objekt) => {
    objekt.geometry?.dispose()
    objekt.material?.dispose()
  })
  const plan = bauplaene[props.stufe]
  relikt = new THREE.Group()
  relikt.userData.geschwindigkeit = plan.geschwindigkeit
  const kern = new THREE.Mesh(
    geometrieFuer(plan.geometrie),
    new THREE.MeshStandardMaterial({
      color: farbe(plan.farbe),
      emissive: farbe('--farbe-akzent'),
      emissiveIntensity: props.stufe === 'bronze' ? 0 : 0.08,
      metalness: 0.76,
      roughness: props.stufe === 'bronze' ? 0.9 : 0.34,
    })
  )
  relikt.add(kern)
  relikt.add(
    new THREE.LineSegments(
      new THREE.WireframeGeometry(geometrieFuer(plan.geometrie)),
      new THREE.LineBasicMaterial({
        color: farbe('--farbe-relikt-hell'),
        transparent: true,
        opacity: 0.55,
      })
    )
  )
  for (let index = 0; index < plan.ringe; index += 1) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.48 + index * 0.17, 0.012, 8, 72),
      new THREE.MeshBasicMaterial({
        color: farbe(index === 0 ? plan.farbe : '--farbe-relikt-hell'),
        transparent: true,
        opacity: 0.72,
      })
    )
    ring.rotation.x = index * 0.8 + 0.45
    ring.rotation.y = index * 0.55
    ring.userData.richtung = index % 2 === 0 ? 1 : -1
    relikt.add(ring)
  }
  for (let index = 0; index < plan.teile; index += 1) {
    const winkel = (index / plan.teile) * Math.PI * 2
    const fragment = new THREE.Mesh(
      new THREE.TetrahedronGeometry(0.14 + (index % 3) * 0.035, 0),
      new THREE.MeshStandardMaterial({ color: farbe(plan.farbe), metalness: 0.65, roughness: 0.38 })
    )
    fragment.position.set(
      Math.cos(winkel) * 1.75,
      Math.sin(winkel * 1.7) * 1.25,
      (index % 2) * 0.35 - 0.18
    )
    relikt.add(fragment)
  }
  scene.add(relikt)
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
  const geschwindigkeit = relikt.userData.geschwindigkeit
  relikt.rotation.y += geschwindigkeit
  relikt.rotation.x += geschwindigkeit * 0.28
  relikt.children.forEach((teil) => {
    if (teil.userData.richtung) teil.rotation.z += geschwindigkeit * teil.userData.richtung * 2.4
  })
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
  kamera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
  kamera.position.set(0, 0, 6)
  scene.add(new THREE.HemisphereLight(farbe('--farbe-relikt-hell'), farbe('--farbe-grund'), 1.65))
  const licht = new THREE.DirectionalLight(farbe('--farbe-relikt-hell'), 2.2)
  licht.position.set(3, 4, 5)
  scene.add(licht)
  reliktBauen()
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
watch(
  () => props.stufe,
  () => {
    if (!scene) return
    reliktBauen()
    zeichnen()
  }
)
onBeforeUnmount(() => {
  anhalten()
  beobachter?.disconnect()
  groessenbeobachter?.disconnect()
  renderer?.dispose()
})
</script>

<template><div ref="flaeche" class="rang-relikt" aria-hidden="true"></div></template>

<style scoped>
.rang-relikt {
  width: var(--spike-relikt-breite);
  aspect-ratio: 1;
}
.rang-relikt :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
