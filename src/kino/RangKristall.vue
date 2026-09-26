<script setup>
import { ref } from 'vue'
import { federnd, lichtTextur, sanft, tokenFarbe, useDreiBuehne } from './buehne.js'

// Der Kristall ist das Rangzeichen in drei Dimensionen. Ein Oktaeder sieht von
// vorn genau wie die flache Raute aus; deshalb beginnt die Szene frontal, als
// waere es das 2D-Zeichen, und dreht sich erst dann in den Raum. Jede Stufe
// ist eine Schale, Diamant bekommt einen leuchtenden Kern.
const props = defineProps({
  stufe: { type: Number, default: -1 },
  // Rang-Aufstieg: langsamer Aufbau, Schockwelle, stärkeres Leuchten.
  aufstieg: { type: Boolean, default: false },
})

const flaeche = ref(null)
const RADIEN = [1.7, 1.36, 1.02, 0.68, 0.34]

// Ziehen dreht den Kristall, danach laeuft er mit Traegheit aus.
const ziehen = { aktiv: false, x: 0, y: 0, tempoX: 0, tempoY: 0 }
function druecken(ereignis) {
  ziehen.aktiv = true
  ziehen.x = ereignis.clientX
  ziehen.y = ereignis.clientY
  ereignis.currentTarget.setPointerCapture?.(ereignis.pointerId)
}
function bewegen(ereignis) {
  if (!ziehen.aktiv) return
  ziehen.tempoY = (ereignis.clientX - ziehen.x) * 0.012
  ziehen.tempoX = (ereignis.clientY - ziehen.y) * 0.012
  ziehen.x = ereignis.clientX
  ziehen.y = ereignis.clientY
}
function loslassen() {
  ziehen.aktiv = false
}

const { bereit } = useDreiBuehne(flaeche, (THREE, szene) => {
  const akzent = tokenFarbe(THREE, '--sig-text')
  const weiss = tokenFarbe(THREE, '--bone')
  const kamera = new THREE.PerspectiveCamera(30, 1, 0.1, 50)
  kamera.position.set(0, 0, 8)

  const gruppe = new THREE.Group()
  szene.add(gruppe)

  const fresnel = {
    vertexShader: `
      varying vec3 vNormale;
      varying vec3 vBlick;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vNormale = normalize(normalMatrix * normal);
        vBlick = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uFarbe;
      uniform float uStaerke;
      varying vec3 vNormale;
      varying vec3 vBlick;
      void main() {
        float kante = pow(1.0 - abs(dot(vNormale, vBlick)), 2.2);
        float licht = (0.12 + kante) * uStaerke;
        gl_FragColor = vec4(uFarbe * licht, licht);
      }`,
  }

  const schalen = RADIEN.map((radius, index) => {
    const erreicht = index <= props.stufe
    const aktuell = index === props.stufe
    const form = new THREE.OctahedronGeometry(radius, 0)
    const koerper = new THREE.Mesh(
      form,
      new THREE.ShaderMaterial({
        ...fresnel,
        uniforms: {
          uFarbe: { value: aktuell ? akzent : weiss },
          uStaerke: { value: erreicht ? (aktuell ? 1.1 : 0.32) : 0.05 },
        },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      })
    )
    const kanten = new THREE.LineSegments(
      new THREE.EdgesGeometry(form),
      new THREE.LineBasicMaterial({
        color: aktuell ? akzent : weiss,
        transparent: true,
        opacity: erreicht ? (aktuell ? 1 : 0.5) : 0.1,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    )
    const halter = new THREE.Group()
    halter.add(koerper, kanten)
    halter.scale.setScalar(0.0001)
    gruppe.add(halter)
    return { halter, richtung: index % 2 ? -1 : 1, tempo: 0.18 + index * 0.07 }
  })

  // Diamant: ein fester, leuchtender Kern.
  let kern = null
  if (props.stufe >= 4) {
    kern = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.2, 0),
      new THREE.MeshBasicMaterial({ color: akzent })
    )
    gruppe.add(kern)
  }

  // Lichthof hinter dem Kristall, staerker je hoeher die Stufe.
  const hof = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: lichtTextur(THREE),
      color: akzent,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  )
  // Kleiner als der sichtbare Ausschnitt (4.3 Einheiten hoch), sonst schneidet
  // der Leinwandrand den Hof hart ab. Den weiten Schein macht die CSS-Buehne.
  hof.scale.setScalar(3.8)
  hof.position.z = -1
  szene.add(hof)
  const hofZiel = props.stufe < 0 ? 0.05 : 0.12 + props.stufe * 0.07 + (props.aufstieg ? 0.15 : 0)

  // Staub, der langsam um den Kristall kreist.
  const staubAnzahl = 220
  const staubPunkte = new Float32Array(staubAnzahl * 3)
  for (let i = 0; i < staubAnzahl; i++) {
    const r = 2.1 + Math.random() * 1.2
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    staubPunkte[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    staubPunkte[i * 3 + 1] = r * Math.cos(phi) * 0.6
    staubPunkte[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
  }
  const staubForm = new THREE.BufferGeometry()
  staubForm.setAttribute('position', new THREE.BufferAttribute(staubPunkte, 3))
  const staub = new THREE.Points(
    staubForm,
    new THREE.PointsMaterial({
      color: akzent,
      size: 0.035,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  )
  szene.add(staub)

  // Schockwelle beim Aufstieg.
  let welle = null
  if (props.aufstieg) {
    welle = new THREE.Mesh(
      new THREE.RingGeometry(0.98, 1, 96),
      new THREE.MeshBasicMaterial({
        color: akzent,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    )
    szene.add(welle)
  }

  const takt = props.aufstieg ? 0.2 : 0.11
  const aufbauEnde = RADIEN.length * takt + 0.6
  let drehung = 0

  return {
    kamera,
    groesse(breite, hoehe) {
      kamera.aspect = breite / hoehe
      kamera.updateProjectionMatrix()
    },
    bild(sek, zeit) {
      // Aufbau von aussen nach innen: Bronze zuerst, wie beim Aufsteigen.
      schalen.forEach((schale, index) => {
        const t = (zeit - index * takt) / 0.55
        schale.halter.scale.setScalar(Math.max(0.0001, federnd(t)))
      })
      // Erst frontal wie das 2D-Zeichen, dann in den Raum drehen.
      const raum = sanft((zeit - aufbauEnde * 0.7) / 1.4)
      drehung += sek * raum
      schalen.forEach((schale) => {
        schale.halter.rotation.y = drehung * schale.tempo * schale.richtung * 2.2
        schale.halter.rotation.x = Math.sin(drehung * 0.6 + schale.tempo * 8) * 0.35 * raum
      })
      if (kern) {
        const puls = 1 + Math.sin(zeit * 3) * 0.08
        kern.scale.setScalar(sanft((zeit - aufbauEnde) / 0.4) * puls)
        kern.rotation.y += sek * 1.5
      }
      // Ziehen und Traegheit wirken auf die ganze Gruppe.
      if (!ziehen.aktiv) {
        ziehen.tempoX *= 0.93
        ziehen.tempoY *= 0.93
      }
      gruppe.rotation.x += ziehen.tempoX
      gruppe.rotation.y += ziehen.tempoY
      gruppe.rotation.x *= 0.985
      gruppe.position.y = Math.sin(zeit * 0.9) * 0.06
      if (ziehen.aktiv) {
        ziehen.tempoX *= 0.5
        ziehen.tempoY *= 0.5
      }

      hof.material.opacity = hofZiel * sanft(zeit / 0.9)
      staub.material.opacity = 0.7 * sanft((zeit - 0.4) / 1.2)
      staub.rotation.y += sek * 0.08
      if (welle) {
        const w = Math.max(0, zeit - aufbauEnde + 0.3)
        welle.scale.setScalar(1 + w * 4.5)
        welle.material.opacity = w > 0 ? Math.max(0, 0.9 - w * 0.9) : 0
      }
    },
  }
})
</script>

<template>
  <div
    ref="flaeche"
    class="rang-kristall"
    :class="{ bereit }"
    aria-hidden="true"
    @pointerdown="druecken"
    @pointermove="bewegen"
    @pointerup="loslassen"
    @pointercancel="loslassen"
  ></div>
</template>

<style scoped>
.rang-kristall {
  position: absolute;
  inset: 0;
  cursor: grab;
  touch-action: none;
  opacity: 0;
  transition: opacity var(--base) var(--ease);
}
.rang-kristall.bereit {
  opacity: 1;
}
.rang-kristall:active {
  cursor: grabbing;
}
.rang-kristall :deep(canvas) {
  display: block;
}
</style>
