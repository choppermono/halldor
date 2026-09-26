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

// Stufenprofile, von -1 (ohne) bis 5 (Olymp). Jede Stufe legt sichtbar zu.
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
  // Olymp: alles auf einmal. Sechs Schalen, vier Ringe, eine Krone aus
  // Dornen, aufsteigende Glut, eine Energiekugel und ein Puls, der von
  // selbst immer wieder durch den Raum geht.
  5: {
    groesse: 1.24,
    schalen: 6,
    glanz: 1.6,
    kanten: 1,
    staub: 520,
    ringe: 4,
    splitter: 16,
    strahlen: 16,
    hof: 0.75,
    tempo: 0.95,
    facetten: true,
    kern: true,
    prisma: true,
    olymp: true,
  },
}
const RADIEN = [1.5, 1.25, 1, 0.75, 0.5, 0.26]

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
  const schimmer = tokenFarbe(THREE, profil.olymp ? '--rang-olymp-glut' : '--rang-diamant-schimmer')
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

  // Ringe umkreisen den Kristall in eigenen Neigungen. Jede Neigung laesst
  // den Ring sichtbar schraeg liegen; hochkant zur Kamera waere er nur ein
  // Strich (cos x * cos y bleibt ueber 0.4).
  const NEIGUNGEN = [
    [1.15, 0, 0],
    [0.5, 0.9, 0.4],
    [-0.9, 0.6, 0.8],
    [0.3, -1.1, 0.5],
  ]
  const ringe = []
  for (let i = 0; i < profil.ringe; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.85 + i * 0.14, 0.008 + i * 0.002, 6, 160),
      new THREE.MeshBasicMaterial({ color: i === 1 ? weiss : farbe, opacity: 0, ...plus })
    )
    ring.rotation.set(...NEIGUNGEN[i])
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

  // Strahlen: weiche Lichtflaechen in einem Faecher hinter dem Kristall.
  // Flaechen statt Sprites: ein gestrecktes Sprite wurde zu einem harten Stab.
  const strahlenFaecher = new THREE.Group()
  strahlenFaecher.position.z = -0.8
  wurzel.add(strahlenFaecher)
  const strahlen = []
  for (let i = 0; i < profil.strahlen; i++) {
    const strahl = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 5.6),
      new THREE.MeshBasicMaterial({ map: textur, color: farbe, opacity: 0, ...plus })
    )
    strahl.rotation.z = (i / profil.strahlen) * Math.PI
    strahlenFaecher.add(strahl)
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

  // ---- Nur Olymp ----
  let krone = null
  let glut = null
  let energie = null
  const pulse = []
  if (profil.olymp) {
    // Krone: zwoelf Dornen, nach aussen gerichtet, um den Kristall kreisend.
    krone = new THREE.Group()
    for (let i = 0; i < 12; i++) {
      const dorn = new THREE.Mesh(
        new THREE.ConeGeometry(0.05, i % 2 ? 0.34 : 0.56, 4),
        new THREE.MeshBasicMaterial({ color: i % 2 ? schimmer : farbe, opacity: 0, ...plus })
      )
      const winkel = (i / 12) * Math.PI * 2
      dorn.position.set(Math.cos(winkel) * 2.05, Math.sin(winkel) * 2.05, 0)
      dorn.rotation.z = winkel - Math.PI / 2
      krone.add(dorn)
    }
    wurzel.add(krone)

    // Glut: Funken, die vom Boden aufsteigen und oben verglimmen.
    const anzahl = 240
    const lage = new Float32Array(anzahl * 3)
    const farben = new Float32Array(anzahl * 3)
    const funken = []
    for (let i = 0; i < anzahl; i++) {
      funken.push({
        x: (Math.random() - 0.5) * 3.4,
        y: -2.4 + Math.random() * 4.8,
        z: (Math.random() - 0.5) * 2,
        tempo: 0.35 + Math.random() * 0.9,
        phase: Math.random() * 6.28,
      })
      const f = (Math.random() < 0.6 ? schimmer : farbe).clone()
      farben.set([f.r, f.g, f.b], i * 3)
    }
    const form = new THREE.BufferGeometry()
    form.setAttribute('position', new THREE.BufferAttribute(lage, 3))
    form.setAttribute('color', new THREE.BufferAttribute(farben, 3))
    glut = {
      funken,
      lage,
      punkte: new THREE.Points(
        form,
        new THREE.PointsMaterial({
          size: 0.07,
          vertexColors: true,
          map: textur,
          opacity: 0,
          ...plus,
        })
      ),
    }
    glut.punkte.frustumCulled = false
    wurzel.add(glut.punkte)

    // Energiekugel: ein feines Gitter, das atmet.
    energie = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.3, 2)),
      new THREE.LineBasicMaterial({ color: farbe, opacity: 0, ...plus })
    )
    wurzel.add(energie)

    // Puls: zwei Wellen, die im Wechsel durch den Raum laufen.
    for (let i = 0; i < 2; i++) {
      const welle = new THREE.Mesh(
        new THREE.RingGeometry(0.985, 1, 128),
        new THREE.MeshBasicMaterial({ color: i ? schimmer : farbe, opacity: 0, ...plus })
      )
      wurzel.add(welle)
      pulse.push({ welle, versatz: i * 1.2 })
    }
  }

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
      strahlenFaecher.rotation.z += sek * 0.05
      strahlen.forEach((strahl, i) => {
        strahl.material.opacity = zusatz * (0.1 + Math.sin(zeit * 1.2 + i * 1.7) * 0.05)
      })
      if (staub) {
        staub.material.opacity = 0.75 * sanft((t - 0.3) / 1.2)
        staub.rotation.y += sek * 0.08
      }
      hof.material.opacity = profil.hof * sanft(t / 0.9)
      wurzel.position.y = Math.sin(zeit * 0.9) * 0.05

      if (profil.olymp) {
        // Der Hof atmet mit dem Puls.
        hof.material.opacity *= 0.8 + Math.sin(zeit * 2.6) * 0.2
        krone.rotation.z -= sek * 0.35
        krone.scale.setScalar(Math.max(0.0001, federnd((t - aufbauEnde - 0.2) / 0.6)))
        krone.children.forEach((dorn, i) => {
          dorn.material.opacity = zusatz * (0.65 + Math.sin(zeit * 4 + i) * 0.35)
        })
        glut.funken.forEach((f, i) => {
          f.y += sek * f.tempo
          if (f.y > 2.4) f.y = -2.4
          glut.lage[i * 3] = f.x + Math.sin(zeit * 1.3 + f.phase) * 0.18
          glut.lage[i * 3 + 1] = f.y
          glut.lage[i * 3 + 2] = f.z
        })
        glut.punkte.geometry.attributes.position.needsUpdate = true
        glut.punkte.material.opacity = 0.95 * sanft((t - 0.4) / 1)
        energie.material.opacity = 0.14 * zusatz
        energie.rotation.y += sek * 0.12
        energie.rotation.x -= sek * 0.07
        energie.scale.setScalar(1 + Math.sin(zeit * 1.4) * 0.03)
        pulse.forEach(({ welle, versatz }) => {
          const p = ((zeit + versatz) % 2.4) / 2.4
          welle.scale.setScalar(0.4 + p * 2.6)
          welle.material.opacity = zusatz * (1 - p) * 0.6
        })
      }
    },
    zerspringen() {
      wurzel.visible = false
    },
  }
}

const { bereit } = useDreiBuehne(flaeche, (THREE, szene) => {
  const kamera = new THREE.PerspectiveCamera(30, 1, 0.1, 60)
  // Weit genug weg, dass auch Krone und Ringe von Olymp ganz im Bild bleiben.
  kamera.position.set(0, 0, props.stufe >= 5 || props.vorher >= 5 ? 12.4 : 10.8)
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
  // Olymp bekommt mehr von allem: laengerer Anlauf, roter Blitz, doppelt so
  // viele Truemmer, zwei Wellen und ein Beben der Kamera.
  const gipfel = props.aufstieg && props.stufe >= 5
  const BRUCH = verwandlung ? (gipfel ? 1.8 : 1.3) : 0
  const kameraZ = kamera.position.z
  const blitz = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: textur,
      color: gipfel ? neu.farbe : tokenFarbe(THREE, '--bone'),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  )
  szene.add(blitz)
  const truemmer = []
  if (alt) {
    for (let i = 0; i < (gipfel ? 80 : 36); i++) {
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
  const wellen = []
  if (props.aufstieg)
    for (let i = 0; i < (gipfel ? 3 : 1); i++) {
      const welle = new THREE.Mesh(
        new THREE.RingGeometry(0.98, 1, 128),
        new THREE.MeshBasicMaterial({
          color: i === 1 ? tokenFarbe(THREE, '--rang-olymp-glut') : neu.farbe,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      )
      szene.add(welle)
      wellen.push({ welle, versatz: 0.15 + i * 0.28 })
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
      wellen.forEach(({ welle, versatz }) => {
        const w = zeit - BRUCH - versatz
        welle.scale.setScalar(0.5 + Math.max(0, w) * 5)
        welle.material.opacity = w > 0 ? Math.max(0, 0.85 - w * 0.8) : 0
      })
      if (gipfel) {
        // Beben: im Anlauf wachsend, nach dem Bruch schnell abklingend.
        const b = zeit - BRUCH
        const staerke = b < 0 ? Math.max(0, zeit / BRUCH) * 0.06 : Math.max(0, 0.18 - b * 0.25)
        kamera.position.x = (Math.random() - 0.5) * staerke
        kamera.position.y = (Math.random() - 0.5) * staerke
        kamera.position.z = kameraZ - (b >= 0 ? Math.max(0, 1.2 - b * 1.5) : 0)
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
