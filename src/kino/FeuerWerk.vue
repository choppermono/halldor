<script setup>
import { ref } from 'vue'
import { lichtTextur, tokenFarbe, useDreiBuehne } from './buehne.js'

// Fuenf Lichtexplosionen nacheinander hinter der Abschlusskarte. Jede
// Explosion ist eine Kugel aus Funken mit Schwerkraft und Luftwiderstand;
// nach gut drei Sekunden ist alles verglueht und die Szene ruht.
const flaeche = ref(null)

const { bereit } = useDreiBuehne(
  flaeche,
  (THREE, szene) => {
    const kamera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
    kamera.position.z = 10
    const farben = [
      tokenFarbe(THREE, '--sig-text'),
      tokenFarbe(THREE, '--bone'),
      tokenFarbe(THREE, '--rang-gold'),
    ]
    const SALVEN = [
      { zeit: 0.15, x: -2.2, y: 2.4 },
      { zeit: 0.55, x: 2.4, y: 3 },
      { zeit: 0.95, x: 0, y: 1.6 },
      { zeit: 1.45, x: -1.4, y: 3.4 },
      { zeit: 1.9, x: 1.8, y: 1.2 },
    ]
    const JE = 240
    const anzahl = SALVEN.length * JE
    const lage = new Float32Array(anzahl * 3)
    const farbe = new Float32Array(anzahl * 3)
    const funken = []
    SALVEN.forEach((salve, s) => {
      const f = farben[s % farben.length]
      for (let i = 0; i < JE; i++) {
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        const tempo = 2.2 + Math.random() * 2.6
        funken.push({
          salve,
          vx: Math.sin(phi) * Math.cos(theta) * tempo,
          vy: Math.cos(phi) * tempo,
          vz: Math.sin(phi) * Math.sin(theta) * tempo,
        })
        const k = (s * JE + i) * 3
        const mischung = Math.random() < 0.25 ? farben[1] : f
        farbe.set([mischung.r, mischung.g, mischung.b], k)
        lage.set([0, -99, 0], k)
      }
    })
    const form = new THREE.BufferGeometry()
    form.setAttribute('position', new THREE.BufferAttribute(lage, 3))
    form.setAttribute('color', new THREE.BufferAttribute(farbe, 3))
    const material = new THREE.PointsMaterial({
      size: 0.16,
      map: lichtTextur(THREE),
      vertexColors: true,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const punkte = new THREE.Points(form, material)
    punkte.frustumCulled = false
    szene.add(punkte)

    return {
      kamera,
      groesse(breite, hoehe) {
        kamera.aspect = breite / hoehe
        kamera.updateProjectionMatrix()
      },
      bild(sek, zeit) {
        funken.forEach((f, i) => {
          const t = zeit - f.salve.zeit
          const k = i * 3
          if (t < 0 || t > 2.2) {
            lage[k + 1] = -99
            return
          }
          // Geschlossene Loesung statt Integration: bleibt bei jeder Bildrate gleich.
          const zug = (1 - Math.exp(-2.2 * t)) / 2.2
          lage[k] = f.salve.x + f.vx * zug
          lage[k + 1] = f.salve.y + f.vy * zug - 1.1 * t * t
          lage[k + 2] = f.vz * zug
        })
        form.attributes.position.needsUpdate = true
        material.opacity = Math.max(0, 1 - Math.max(0, zeit - 2.4) / 1.4)
      },
    }
  },
  { pixelMax: 1.5 }
)
</script>

<template>
  <div ref="flaeche" class="feuer-werk" :class="{ bereit }" aria-hidden="true"></div>
</template>

<style scoped>
.feuer-werk {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.feuer-werk :deep(canvas) {
  display: block;
}
</style>
