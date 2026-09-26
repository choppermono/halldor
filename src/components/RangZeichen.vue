<script setup>
import { computed } from 'vue'
import { rangFarbe } from '../lib/rangfarbe.js'

defineOptions({ name: 'RangZeichen' })

// Das flache Abzeichen folgt derselben Steigerung wie das 3D-Modell: je
// hoeher die Stufe, desto groesser und verschachtelter. Ohne Rang eine
// gestrichelte Raute, Bronze ein facettierter Einzelkristall, dann Ring,
// Umlaufbahn und Splitter, Strahlen, bei Diamant ein weisser Kern. Die Stufe
// ist so an der Form lesbar, nicht nur an der Farbe.
const props = defineProps({
  stufe: { type: Number, default: -1 },
  groesse: { type: Number, default: 48 },
})

const MITTE = 32
const MASS = [0.5, 0.62, 0.72, 0.82, 0.92, 1, 1.02]
const BREITE = 0.74

function raute(r, x = MITTE, y = MITTE) {
  const w = r * BREITE
  return `${x},${y - r} ${x + w},${y} ${x},${y + r} ${x - w},${y}`
}
function polar(radius, winkel) {
  const bogen = (winkel * Math.PI) / 180
  return [MITTE + Math.cos(bogen) * radius, MITTE + Math.sin(bogen) * radius]
}

const t = computed(() => Math.max(-1, Math.min(5, props.stufe)))
const r = computed(() => 20 * MASS[t.value + 1])

// Vier Facetten mit verschiedener Deckkraft geben dem Kristall Licht von
// oben links, ohne Verlauf und ohne zweite Farbe.
const facetten = computed(() => {
  const radius = r.value
  const w = radius * BREITE
  const oben = `${MITTE},${MITTE - radius}`
  const rechts = `${MITTE + w},${MITTE}`
  const unten = `${MITTE},${MITTE + radius}`
  const links = `${MITTE - w},${MITTE}`
  const mitte = `${MITTE},${MITTE}`
  return [
    { punkte: `${oben} ${links} ${mitte}`, deckkraft: 0.55 },
    { punkte: `${oben} ${rechts} ${mitte}`, deckkraft: 0.3 },
    { punkte: `${links} ${unten} ${mitte}`, deckkraft: 0.22 },
    { punkte: `${rechts} ${unten} ${mitte}`, deckkraft: 0.1 },
  ]
})
const innere = computed(() =>
  t.value < 1 ? [] : [0.64, 0.42, 0.24, 0.1].slice(0, t.value).map((f) => raute(r.value * f))
)
const bahnen = computed(
  () =>
    ({
      1: [{ rx: 25, ry: 25, dreh: 0 }],
      2: [{ rx: 28, ry: 8, dreh: -18 }],
      3: [
        { rx: 28, ry: 9, dreh: -24 },
        { rx: 28, ry: 9, dreh: 24 },
      ],
      4: [
        { rx: 28.5, ry: 9, dreh: 0 },
        { rx: 28.5, ry: 9, dreh: 60 },
        { rx: 28.5, ry: 9, dreh: 120 },
      ],
      5: [
        { rx: 29, ry: 8, dreh: 0 },
        { rx: 29, ry: 8, dreh: 45 },
        { rx: 29, ry: 8, dreh: 90 },
        { rx: 29, ry: 8, dreh: 135 },
      ],
    })[t.value] ?? []
)
const splitter = computed(() => {
  const anzahl = { 2: 4, 3: 6, 4: 8, 5: 12 }[t.value] ?? 0
  return Array.from({ length: anzahl }, (_, i) => {
    const [x, y] = polar(27.5, (i * 360) / anzahl + 22.5)
    return raute(t.value >= 4 ? 2.8 : 2.3, x, y)
  })
})
// Olymp: eine Krone aus zwölf Dornen, abwechselnd lang und kurz.
const krone = computed(() => {
  if (t.value < 5) return []
  return Array.from({ length: 12 }, (_, i) => {
    const winkel = i * 30 - 90
    const spitze = polar(i % 2 ? 29 : 31.5, winkel)
    const links = polar(23.5, winkel - 5)
    const rechts = polar(23.5, winkel + 5)
    return `${links.join(',')} ${spitze.join(',')} ${rechts.join(',')}`
  })
})
const strahlen = computed(() => {
  const anzahl = { 3: 8, 4: 12, 5: 16 }[t.value] ?? 0
  return Array.from({ length: anzahl }, (_, i) => {
    const winkel = (i * 360) / anzahl
    const [x1, y1] = polar(23, winkel)
    const [x2, y2] = polar(i % 2 ? 29 : 31.5, winkel)
    return { x1, y1, x2, y2 }
  })
})
</script>

<template>
  <svg
    class="rangzeichen"
    :class="[`rangzeichen-${t + 1}`, { 'rangzeichen-leer': t < 0 }]"
    :style="{ '--rang-farbe': rangFarbe(t), '--strich': `${Math.max(1, groesse / 44)}px` }"
    viewBox="0 0 64 64"
    :width="groesse"
    :height="groesse"
    aria-hidden="true"
    focusable="false"
  >
    <g class="rz-strahlen">
      <line v-for="(s, i) in strahlen" :key="`s${i}`" v-bind="s" />
    </g>
    <g class="rz-krone">
      <polygon v-for="(p, i) in krone" :key="`k${i}`" :points="p" />
    </g>
    <g class="rz-bahnen">
      <ellipse
        v-for="(b, i) in bahnen"
        :key="`b${i}`"
        :cx="MITTE"
        :cy="MITTE"
        :rx="b.rx"
        :ry="b.ry"
        :transform="`rotate(${b.dreh} ${MITTE} ${MITTE})`"
      />
    </g>
    <template v-if="t >= 0">
      <polygon
        v-for="(f, i) in facetten"
        :key="`f${i}`"
        class="rz-facette"
        :points="f.punkte"
        :fill-opacity="f.deckkraft"
      />
    </template>
    <polygon class="rz-umriss" :points="raute(r)" />
    <polygon v-for="(p, i) in innere" :key="`i${i}`" class="rz-innen" :points="p" />
    <g class="rz-splitter">
      <polygon v-for="(p, i) in splitter" :key="`p${i}`" :points="p" />
    </g>
    <template v-if="t >= 4">
      <circle class="rz-schein" :cx="MITTE" :cy="MITTE" r="8" />
      <polygon class="rz-kern" :points="raute(3.6)" />
    </template>
  </svg>
</template>
