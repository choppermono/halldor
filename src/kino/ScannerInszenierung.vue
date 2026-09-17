<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  zustand: { type: String, required: true },
  code: { type: String, default: '' },
  punkte: { type: Array, default: () => [] },
  videoMasse: { type: Object, default: () => ({ breite: 0, hoehe: 0 }) },
  abfrageStatus: { type: String, default: 'bereit' },
  produktname: { type: String, default: '' },
})

const auflage = ref(null)
const buehne = ref({ breite: 0, hoehe: 0 })
let groessenBeobachter

const fehlgeschlagen = computed(() => props.abfrageStatus === 'unbekannt')
const eingerastet = computed(() => props.zustand === 'erkannt')

const eckenStile = computed(() => {
  const { breite, hoehe } = buehne.value
  const videoBreite = Number(props.videoMasse.breite)
  const videoHoehe = Number(props.videoMasse.hoehe)
  if (
    !breite ||
    !hoehe ||
    !videoBreite ||
    !videoHoehe ||
    !Array.isArray(props.punkte) ||
    props.punkte.length < 2
  )
    return [{}, {}, {}, {}]

  const skalierung = Math.max(breite / videoBreite, hoehe / videoHoehe)
  const versatzX = (breite - videoBreite * skalierung) / 2
  const versatzY = (hoehe - videoHoehe * skalierung) / 2
  const xs = props.punkte.map((punkt) => punkt.x * skalierung + versatzX)
  const ys = props.punkte.map((punkt) => punkt.y * skalierung + versatzY)
  const links = Math.max(0, Math.min(...xs))
  const rechts = Math.min(breite, Math.max(...xs))
  const mitteY = Math.max(0, Math.min(hoehe, (Math.min(...ys) + Math.max(...ys)) / 2))
  const oben = Math.max(0, mitteY - hoehe * 0.12)
  const unten = Math.min(hoehe, mitteY + hoehe * 0.12)
  const starts = [
    [breite * 0.08, hoehe * 0.14],
    [breite * 0.92, hoehe * 0.14],
    [breite * 0.08, hoehe * 0.86],
    [breite * 0.92, hoehe * 0.86],
  ]
  const ziele = [
    [links, oben],
    [rechts, oben],
    [links, unten],
    [rechts, unten],
  ]
  return starts.map(([x, y], index) => ({
    '--treffer-transform': `translate(${ziele[index][0] - x}px, ${ziele[index][1] - y}px)`,
  }))
})

onMounted(() => {
  groessenBeobachter = new ResizeObserver(([eintrag]) => {
    buehne.value = {
      breite: eintrag.contentRect.width,
      hoehe: eintrag.contentRect.height,
    }
  })
  groessenBeobachter.observe(auflage.value)
})
onBeforeUnmount(() => groessenBeobachter?.disconnect())
</script>

<template>
  <div
    ref="auflage"
    class="scanner-inszenierung"
    :class="{
      'ist-erkannt': eingerastet,
      'ist-fehlgeschlagen': fehlgeschlagen,
      'hat-treffer': abfrageStatus === 'treffer',
    }"
    aria-hidden="true"
  >
    <div class="scan-raster">
      <i v-for="(stil, index) in eckenStile" :key="index" :style="stil"></i>
      <span v-if="zustand === 'sucht'" class="scan-linie"></span>
    </div>
    <span v-if="eingerastet" class="glitch-blitz"></span>
    <p v-if="code" class="code-dekor">
      <span v-for="(zeichen, index) in code" :key="index" :style="{ '--zeichen-index': index }">{{
        zeichen
      }}</span
      ><i class="schreibmarke"></i>
    </p>
    <p v-if="abfrageStatus === 'treffer'" class="treffer-dekor">{{ produktname }}</p>
    <div v-if="fehlgeschlagen" class="glitch-schnitte">
      <i v-for="schnitt in 3" :key="schnitt"></i>
    </div>
  </div>
</template>

<style scoped>
.scanner-inszenierung,
.scan-raster,
.glitch-blitz,
.glitch-schnitte {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.scan-raster i {
  --treffer-transform: none;
  position: absolute;
  width: var(--scanner-ecke);
  height: var(--scanner-ecke);
  border-color: var(--sig-text);
  border-style: solid;
}
.scan-raster i:nth-of-type(1) {
  left: var(--scanner-raster-x);
  top: var(--scanner-raster-y);
  border-width: var(--scanner-linie) 0 0 var(--scanner-linie);
}
.scan-raster i:nth-of-type(2) {
  right: var(--scanner-raster-x);
  top: var(--scanner-raster-y);
  border-width: var(--scanner-linie) var(--scanner-linie) 0 0;
}
.scan-raster i:nth-of-type(3) {
  left: var(--scanner-raster-x);
  bottom: var(--scanner-raster-y);
  border-width: 0 0 var(--scanner-linie) var(--scanner-linie);
}
.scan-raster i:nth-of-type(4) {
  right: var(--scanner-raster-x);
  bottom: var(--scanner-raster-y);
  border-width: 0 var(--scanner-linie) var(--scanner-linie) 0;
}
.ist-erkannt .scan-raster i {
  animation: grantIn var(--base) var(--ease) both;
}
.scan-linie {
  position: absolute;
  left: var(--scanner-raster-x);
  right: var(--scanner-raster-x);
  top: 50%;
  height: var(--scanner-linie);
  background: var(--sig-text);
  animation: scanRule var(--slow) var(--ease) both;
}
.glitch-blitz {
  background: var(--bone);
  animation: glitchFlash var(--fast) var(--ease) both;
}
.code-dekor {
  position: absolute;
  left: var(--scanner-raster-x);
  right: var(--scanner-raster-x);
  bottom: var(--s-4);
  margin: 0;
  color: var(--bone);
  font: var(--scanner-code-gewicht) var(--scanner-code-groesse) / 1 var(--mono);
  letter-spacing: var(--scanner-code-laufweite);
  text-align: center;
}
.code-dekor > span {
  display: inline-block;
  animation: typeIn var(--fast) steps(1, end) backwards;
  animation-delay: calc(var(--fast) * var(--zeichen-index));
}
.schreibmarke {
  display: inline-block;
  width: var(--scanner-schreibmarke-breite);
  height: var(--scanner-code-groesse);
  margin-left: var(--s-1);
  vertical-align: bottom;
  background: var(--sig-text);
  animation: blink var(--base) steps(1, end) infinite;
}
.treffer-dekor {
  position: absolute;
  inset: auto var(--scanner-raster-x) var(--scanner-treffer-unten);
  margin: 0;
  color: var(--bone);
  font: 400 var(--scanner-treffer-titel) / var(--scanner-treffer-zeilenhoehe) var(--display);
  text-align: center;
  overflow-wrap: anywhere;
  animation: hudIn var(--slow) var(--ease) both;
}
.hat-treffer .code-dekor {
  animation: hudIn var(--base) var(--ease) reverse both;
}
.glitch-schnitte {
  display: grid;
  grid-template-rows: repeat(3, 1fr);
  overflow: hidden;
}
.glitch-schnitte i {
  background: color-mix(in srgb, var(--sig-text) 45%, transparent);
  animation: glitchSlice var(--slow) var(--ease) both;
}
.glitch-schnitte i:nth-child(2) {
  animation-direction: reverse;
}
.ist-fehlgeschlagen .scan-raster {
  animation: glitchSlice var(--slow) var(--ease) both;
}

@keyframes scanRule {
  from {
    opacity: 0;
    transform: translateY(var(--scanner-scan-start));
  }
  to {
    opacity: 1;
    transform: translateY(var(--scanner-scan-ende));
  }
}
@keyframes grantIn {
  from {
    opacity: 1;
    transform: none;
  }
  to {
    opacity: 1;
    transform: var(--treffer-transform);
  }
}
@keyframes glitchFlash {
  0%,
  100% {
    opacity: 0;
    transform: scale(1);
  }
  45% {
    opacity: 0.82;
    transform: scale(1.02);
  }
}
@keyframes typeIn {
  from {
    opacity: 0;
    transform: translateY(var(--s-2));
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@keyframes blink {
  0%,
  49% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0;
  }
}
@keyframes hudIn {
  from {
    opacity: 0;
    transform: translateY(var(--s-4));
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@keyframes glitchSlice {
  0% {
    opacity: 1;
    transform: translateX(0);
  }
  55% {
    opacity: 0.7;
    transform: translateX(var(--scanner-glitch-versatz));
  }
  100% {
    opacity: 0;
    transform: translateX(calc(-1 * var(--scanner-glitch-versatz)));
  }
}
</style>
