<script setup>
import { ref } from 'vue'
import { rangFarbName } from '../lib/rangfarbe.js'
import { federnd, lichtTextur, sanft, tokenFarbe, useDreiBuehne } from './buehne.js'

// Das Rangzeichen in drei Dimensionen. Wie in Spielen waechst das Modell mit
// der Stufe: ohne Rang ein kleiner grauer Umriss, Bronze ein einzelner
// matter Kristall, Diamant ein grosses, verschachteltes Gebilde mit Ringen,
// Splittern, Strahlen und leuchtendem Kern. Man soll auf Anhieb sehen, wie
// stark jemand ist. Ein Oktaeder sieht von vorn wie die flache Raute aus;
// deshalb beginnt jedes Modell frontal und dreht sich dann in den Raum.
const props = defineProps({
  stufe: { type: Number, default: -1 },
  // Rang-Aufstieg: das alte Modell zerspringt, das neue baut sich auf.
  aufstieg: { type: Boolean, default: false },
  vorher: { type: Number, default: null },
})

// Stufenprofile, von -1 (ohne) bis 4 (Diamant). Jede Stufe legt sichtbar zu.
const PROFILE = {
  '-1': {
    groesse: 0.45,
    schalen: 1,
    glanz: 0.08,
    kanten: 0.35,
    staub: 0,
    ringe: 0,
    splitter: 0,
    strahlen: 0,
    hof: 0,
    tempo: 0.2,
  },
  0: {
    groesse: 0.58,
    schalen: 1,
    glanz: 0.45,
    kanten: 0.75,
    staub: 24,
    ringe: 0,
    splitter: 0,
    strahlen: 0,
    hof: 0.1,
    tempo: 0.3,
  },
  1: {
    groesse: 0.72,
    schalen: 2,
    glanz: 0.65,
    kanten: 0.9,
    staub: 70,
    ringe: 1,
    splitter: 0,
    strahlen: 0,
    hof: 0.18,
    tempo: 0.4,
  },
  2: {
    groesse: 0.86,
    schalen: 3,
    glanz: 0.85,
    kanten: 1,
    staub: 150,
    ringe: 2,
    splitter: 4,
    strahlen: 4,
    hof: 0.28,
    tempo: 0.5,
  },
  3: {
    groesse: 1,
    schalen: 4,
    glanz: 1.05,
    kanten: 1,
    staub: 260,
    ringe: 2,
    splitter: 6,
    strahlen: 6,
    hof: 0.38,
    tempo: 0.62,
    facetten: true,
  },
  4: {
    groesse: 1.14,
    schalen: 5,
    glanz: 1.3,
    kanten: 1,
    staub: 420,
    ringe: 3,
    splitter: 10,
    strahlen: 10,
    hof: 0.52,
    tempo: 0.78,
    facetten: true,
    kern: true,
    prisma: true,
  },
}
const RADIEN = [1.5, 1.2, 0.9, 0.6, 0.3]

const flaeche = ref(null)
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

const FRESNEL_VERTEX = `
  varying vec3 vNormale;
  varying vec3 vBlick;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormale = normalize(normalMatrix * normal);
    vBlick = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`
const FRESNEL_FRAGMENT = `
  uniform vec3 uFarbe;
  uniform float uStaerke;
  varying vec3 vNormale;
  varying vec3 vBlick;
  void main() {
    float kante = pow(1.0 - abs(dot(vNormale, vBlick)), 2.2);
    float licht = (0.1 + kante) * uStaerke;
    gl_FragColor = vec4(uFarbe * licht, licht);
  }`

function modellBauen(THREE, stufe, textur) {
  const profil = PROFILE[stufe] ?? PROFILE[-1]
  const farbe = tokenFarbe(THREE, `--rang-${rangFarbName(stufe)}`)
  const weiss = tokenFarbe(THREE, '--bone')
  const schimmer = tokenFarbe(THREE, '--rang-diamant-schimmer')
  const plus = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }
  const wurzel = new THREE.Group()
  const koerper = new THREE.Group()
  wurzel.add(koerper)

  const schalen = []
  for (let i = 0; i < profil.schalen; i++) {
    const form = new THREE.OctahedronGeometry(RADIEN[i], 0)
    const flaechen = new THREE.Mesh(
      form,
      new THREE.ShaderMaterial({
        vertexShader: FRESNEL_VERTEX,
        fragmentShader: FRESNEL_FRAGMENT,
        uniforms: {
          uFarbe: { value: farbe.clone() },
          uStaerke: { value: profil.glanz * (i === profil.schalen - 1 ? 1.2 : 0.7) },
        },
        side: THREE.DoubleSide,
        ...plus,
      })
    )
    const kanten = new THREE.LineSegments(
      new THREE.EdgesGeometry(form),
      new THREE.LineBasicMaterial({
        color: i === 0 ? farbe : farbe.clone().lerp(weiss, 0.35),
        opacity: profil.kanten * (1 - i * 0.08),
        ...plus,
      })
    )
    const halter = new THREE.Group()
    halter.add(flaechen, kanten)
    halter.scale.setScalar(0.0001)
    koerper.add(halter)
    schalen.push({ halter, kanten, richtung: i % 2 ? -1 : 1, tempo: 0.5 + i * 0.25 })
  }

  // Ab Platin: feine Facettenkugel im Inneren, mehr Detail je Blick.
  let facetten = null
  if (profil.facetten) {
    facetten = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.75, 1)),
      new THREE.LineBasicMaterial({ color: farbe, opacity: 0, ...plus })
    )
    koerper.add(facetten)
  }

  // Diamant: fester Kern mit eigenem Glanz.
  let kern = null
  if (profil.kern) {
    kern = new THREE.Group()
    const glanz = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: textur, color: farbe, opacity: 0.9, ...plus })
    )
    glanz.scale.set(1.4, 1.4, 1)
    kern.add(
      new THREE.Mesh(
        new THREE.OctahedronGeometry(0.22, 0),
        new THREE.MeshBasicMaterial({ color: weiss })
      ),
      glanz
    )
    kern.scale.setScalar(0.0001)
    koerper.add(kern)
  }

  // Ringe umkreisen den Kristall in eigenen Neigungen.
  const ringe = []
  for (let i = 0; i < profil.ringe; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.85 + i * 0.14, 0.008 + i * 0.002, 6, 160),
      new THREE.MeshBasicMaterial({ color: i === 1 ? weiss : farbe, opacity: 0, ...plus })
    )
    ring.rotation.set(1.1 + i * 0.5, i * 0.9, i * 0.4)
    wurzel.add(ring)
    ringe.push({ ring, tempo: (i % 2 ? -1 : 1) * (0.3 + i * 0.15) })
  }

  // Splitter: kleine Kristalle auf Umlaufbahnen.
  const splitter = []
  for (let i = 0; i < profil.splitter; i++) {
    const stueck = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.07 + Math.random() * 0.06, 0),
      new THREE.MeshBasicMaterial({ color: i % 3 ? farbe : weiss, opacity: 0, ...plus })
    )
    wurzel.add(stueck)
    splitter.push({
      stueck,
      radius: 1.9 + Math.random() * 0.4,
      winkel: (i / profil.splitter) * Math.PI * 2,
      neigung: (Math.random() - 0.5) * 1.4,
      tempo: 0.4 + Math.random() * 0.5,
    })
  }

  // Strahlen: gestreckte Lichtflecken, die sich langsam drehen.
  const strahlen = []
  for (let i = 0; i < profil.strahlen; i++) {
    const strahl = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: textur, color: farbe, opacity: 0, ...plus })
    )
    // Breite, weiche Lichtbahnen statt duenner Staebe.
    strahl.scale.set(0.42, 5, 1)
    strahl.position.z = -0.6
    strahl.material.rotation = (i / profil.strahlen) * Math.PI
    wurzel.add(strahl)
    strahlen.push(strahl)
  }

  // Staub im Raum um das Modell.
  let staub = null
  if (profil.staub) {
    const punkte = new Float32Array(profil.staub * 3)
    for (let i = 0; i < profil.staub; i++) {
      const r = 1.9 + Math.random() * 0.9
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      punkte.set(
        [
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.cos(phi) * 0.7,
          r * Math.sin(phi) * Math.sin(theta),
        ],
        i * 3
      )
    }
    const form = new THREE.BufferGeometry()
    form.setAttribute('position', new THREE.BufferAttribute(punkte, 3))
    staub = new THREE.Points(
      form,
      new THREE.PointsMaterial({ color: farbe, size: 0.035, opacity: 0, ...plus })
    )
    wurzel.add(staub)
  }

  // Lichthof, kleiner als der sichtbare Ausschnitt.
  const hof = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: textur, color: farbe, opacity: 0, ...plus })
  )
  hof.scale.setScalar(4.2)
  hof.position.z = -1
  wurzel.add(hof)

  wurzel.scale.setScalar(profil.groesse)
  let drehung = 0

  return {
    wurzel,
    profil,
    farbe,
    // t: Sekunden seit Beginn des Aufbaus; negativ heisst noch nicht begonnen.
    bild(sek, zeit, t, takt) {
      const sichtbar = t >= 0
      wurzel.visible = sichtbar
      if (!sichtbar) return
      schalen.forEach((schale, i) => {
        schale.halter.scale.setScalar(Math.max(0.0001, federnd((t - i * takt) / 0.55)))
      })
      const aufbauEnde = profil.schalen * takt + 0.5
      const zusatz = sanft((t - aufbauEnde) / 0.8)
      const raum = sanft((t - aufbauEnde * 0.6) / 1.4)
      drehung += sek * raum * profil.tempo
      schalen.forEach((schale) => {
        schale.halter.rotation.y = drehung * schale.tempo * schale.richtung * 2
        schale.halter.rotation.x = Math.sin(drehung + schale.tempo * 6) * 0.35 * raum
      })
      if (profil.prisma)
        schalen.forEach((schale, i) => {
          const mischung = (Math.sin(zeit * 1.6 + i * 1.3) + 1) / 2
          schale.kanten.material.color.copy(farbe).lerp(schimmer, mischung * 0.8)
        })
      if (facetten) {
        facetten.material.opacity = 0.35 * zusatz
        facetten.rotation.y -= sek * 0.4
        facetten.rotation.z += sek * 0.2
      }
      if (kern) {
        kern.scale.setScalar(
          Math.max(0.0001, federnd((t - aufbauEnde) / 0.5) * (1 + Math.sin(zeit * 3) * 0.1))
        )
        kern.rotation.y += sek * 1.8
      }
      ringe.forEach(({ ring, tempo }) => {
        ring.material.opacity = 0.75 * zusatz
        ring.rotation.z += sek * tempo
        ring.scale.setScalar(0.6 + 0.4 * zusatz)
      })
      splitter.forEach((s) => {
        s.winkel += sek * s.tempo
        s.stueck.position.set(
          Math.cos(s.winkel) * s.radius,
          Math.sin(s.winkel) * s.radius * s.neigung * 0.5,
          Math.sin(s.winkel) * s.radius
        )
        s.stueck.rotation.x += sek * 2
        s.stueck.rotation.y += sek * 1.5
        s.stueck.material.opacity = zusatz
      })
      strahlen.forEach((strahl, i) => {
        strahl.material.rotation += sek * 0.05
        strahl.material.opacity = zusatz * (0.13 + Math.sin(zeit * 1.2 + i * 1.7) * 0.06)
      })
      if (staub) {
        staub.material.opacity = 0.75 * sanft((t - 0.3) / 1.2)
        staub.rotation.y += sek * 0.08
      }
      hof.material.opacity = profil.hof * sanft(t / 0.9)
      wurzel.position.y = Math.sin(zeit * 0.9) * 0.05
    },
    zerspringen() {
      wurzel.visible = false
    },
  }
}

const { bereit } = useDreiBuehne(flaeche, (THREE, szene) => {
  const kamera = new THREE.PerspectiveCamera(30, 1, 0.1, 60)
  // Weit genug weg, dass auch die geneigten Diamant-Ringe ganz im Bild bleiben.
  kamera.position.set(0, 0, 10.8)
  const textur = lichtTextur(THREE)
  const buehne = new THREE.Group()
  szene.add(buehne)

  const neu = modellBauen(THREE, props.stufe, textur)
  buehne.add(neu.wurzel)
  const verwandlung = props.aufstieg && props.vorher !== null && props.vorher !== props.stufe
  const alt = verwandlung ? modellBauen(THREE, props.vorher, textur) : null
  if (alt) buehne.add(alt.wurzel)

  // Verwandlung: das alte Modell dreht immer schneller, bricht in einem
  // Lichtblitz auseinander, und das neue baut sich aus der Mitte auf.
  const BRUCH = verwandlung ? 1.3 : 0
  const blitz = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: textur,
      color: tokenFarbe(THREE, '--bone'),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  )
  szene.add(blitz)
  const truemmer = []
  if (alt) {
    for (let i = 0; i < 36; i++) {
      const stueck = new THREE.Mesh(
        new THREE.TetrahedronGeometry(0.05 + Math.random() * 0.1, 0),
        new THREE.MeshBasicMaterial({
          color: i % 2 ? alt.farbe : neu.farbe,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      )
      const richtung = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      )
        .normalize()
        .multiplyScalar(3 + Math.random() * 4)
      szene.add(stueck)
      truemmer.push({ stueck, richtung })
    }
  }
  let welle = null
  if (props.aufstieg) {
    welle = new THREE.Mesh(
      new THREE.RingGeometry(0.98, 1, 128),
      new THREE.MeshBasicMaterial({
        color: neu.farbe,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    )
    szene.add(welle)
  }

  const takt = props.aufstieg ? 0.16 : 0.1
  return {
    kamera,
    groesse(breite, hoehe) {
      kamera.aspect = breite / hoehe
      kamera.updateProjectionMatrix()
    },
    bild(sek, zeit) {
      if (alt) {
        if (zeit < BRUCH) {
          // Anlauf: das alte Modell steht schon und dreht sich hoch.
          alt.bild(sek * (1 + zeit * 5), zeit, 10, takt)
          alt.wurzel.position.x = (Math.random() - 0.5) * 0.04 * zeit
        } else alt.zerspringen()
      }
      neu.bild(sek, zeit, zeit - BRUCH, takt)

      if (verwandlung) {
        const b = zeit - BRUCH
        blitz.material.opacity = b >= 0 ? Math.max(0, 1 - b * 1.8) : 0
        blitz.scale.setScalar(2 + Math.max(0, b) * 9)
        truemmer.forEach(({ stueck, richtung }) => {
          if (b < 0) return
          stueck.position.copy(richtung).multiplyScalar(sanft(b / 1.4) * 0.9)
          stueck.rotation.x += sek * 4
          stueck.rotation.y += sek * 3
          stueck.material.opacity = Math.max(0, 1 - b * 0.8)
        })
      }
      if (welle) {
        const w = zeit - BRUCH - 0.15
        welle.scale.setScalar(0.5 + Math.max(0, w) * 5)
        welle.material.opacity = w > 0 ? Math.max(0, 0.85 - w * 0.8) : 0
      }

      if (!ziehen.aktiv) {
        ziehen.tempoX *= 0.93
        ziehen.tempoY *= 0.93
      }
      buehne.rotation.x += ziehen.tempoX
      buehne.rotation.y += ziehen.tempoY
      buehne.rotation.x *= 0.985
      if (ziehen.aktiv) {
        ziehen.tempoX *= 0.5
        ziehen.tempoY *= 0.5
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
