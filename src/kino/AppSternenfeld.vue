<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { lichtTextur, tokenFarbe, useDreiBuehne } from './buehne.js'

// Ein Raum statt einer Tapete: Sterne in drei Tiefen, ein schwacher
// Kobaltnebel, Parallaxe zum Zeiger und ein kurzer Warp bei jedem
// Seitenwechsel. Keine Datenaussage; der Grund bleibt fast schwarz.
const flaeche = ref(null)
const zeiger = { x: 0, y: 0 }
let schub = 0

function zeigerBewegt(ereignis) {
  zeiger.x = ereignis.clientX / window.innerWidth - 0.5
  zeiger.y = ereignis.clientY / window.innerHeight - 0.5
}
const router = useRouter()
let routenHaken = null
onMounted(() => {
  window.addEventListener('pointermove', zeigerBewegt, { passive: true })
  routenHaken = router.afterEach((ziel, ursprung) => {
    if (ziel.path !== ursprung.path) schub = 1
  })
})
onBeforeUnmount(() => {
  window.removeEventListener('pointermove', zeigerBewegt)
  routenHaken?.()
})

function token(name) {
  const wert = Number(getComputedStyle(document.documentElement).getPropertyValue(name).trim())
  if (!Number.isFinite(wert)) throw new Error('Ungueltiger Kino-Token: ' + name)
  return wert
}

const { bereit } = useDreiBuehne(
  flaeche,
  (THREE, szene) => {
    const kamera = new THREE.PerspectiveCamera(
      token('--sterne-blickwinkel'),
      1,
      token('--sterne-nahgrenze'),
      token('--sterne-ferngrenze')
    )
    const abstand = token('--sterne-kamera-abstand')
    kamera.position.z = abstand
    const drehungX = token('--sterne-drehung-x')
    const drehungY = token('--sterne-drehung-y')

    const weiss = tokenFarbe(THREE, '--farbe-sterne')
    const akzent = tokenFarbe(THREE, '--sig-text')
    const anzahl = token('--sterne-anzahl')
    const ausdehnung = ['--sterne-breite', '--sterne-hoehe', '--sterne-tiefe'].map(token)
    const positionen = new Float32Array(anzahl * 3)
    const farben = new Float32Array(anzahl * 3)
    const farbe = new THREE.Color()
    for (let i = 0; i < anzahl; i++) {
      for (let achse = 0; achse < 3; achse++)
        positionen[i * 3 + achse] = (Math.random() - 0.5) * ausdehnung[achse] * 1.6
      // Etwa jeder vierte Stern ist kobaltblau, die Helligkeit streut.
      farbe.copy(Math.random() < 0.27 ? akzent : weiss).multiplyScalar(0.35 + Math.random() * 0.65)
      farben.set([farbe.r, farbe.g, farbe.b], i * 3)
    }
    const form = new THREE.BufferGeometry()
    form.setAttribute('position', new THREE.BufferAttribute(positionen, 3))
    form.setAttribute('color', new THREE.BufferAttribute(farben, 3))
    const sterne = new THREE.Points(
      form,
      new THREE.PointsMaterial({
        size: token('--sterne-groesse'),
        vertexColors: true,
        transparent: true,
        opacity: token('--sterne-deckkraft'),
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        map: lichtTextur(THREE),
      })
    )
    szene.add(sterne)

    // Zwei grosse, schwache Lichtwolken geben dem Schwarz Tiefe.
    const nebelTextur = lichtTextur(THREE)
    const nebel = [
      [-5, 3, -6, 14, 0.11],
      [6, -4, -8, 18, 0.07],
    ].map(([x, y, z, groesse, deckkraft]) => {
      const wolke = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: nebelTextur,
          color: akzent,
          transparent: true,
          opacity: deckkraft,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      )
      wolke.position.set(x, y, z)
      wolke.scale.setScalar(groesse)
      szene.add(wolke)
      return wolke
    })

    return {
      kamera,
      groesse(breite, hoehe) {
        kamera.aspect = breite / hoehe
        kamera.updateProjectionMatrix()
      },
      bild(sek, zeit) {
        // Warp: ein kurzer Schub nach vorn, der von selbst abklingt.
        const warp = schub * schub
        sterne.rotation.x += sek * drehungX * (1 + warp * 20)
        sterne.rotation.y += sek * drehungY * (1 + warp * 60)
        kamera.position.z = abstand - warp * 3.2
        schub *= Math.pow(0.04, sek)
        kamera.position.x += (zeiger.x * 1.2 - kamera.position.x) * Math.min(1, sek * 1.5)
        kamera.position.y += (-zeiger.y * 0.8 - kamera.position.y) * Math.min(1, sek * 1.5)
        kamera.lookAt(0, 0, 0)
        nebel[0].material.rotation = zeit * 0.01
        nebel[1].material.rotation = -zeit * 0.008
      },
    }
  },
  { pixelMax: 1.5 }
)
</script>

<template>
  <div ref="flaeche" class="sternenfeld" :class="{ bereit }" aria-hidden="true"></div>
</template>

<style scoped>
.sternenfeld {
  position: fixed;
  z-index: var(--z-hintergrund);
  inset: var(--sterne-rand);
  overflow: hidden;
  pointer-events: none;
  opacity: 0;
  transition: opacity var(--slow) var(--ease);
}
.sternenfeld.bereit {
  opacity: 1;
}
.sternenfeld :deep(canvas) {
  display: block;
}
</style>
