<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import GlyphenAufloesung from './GlyphenAufloesung.vue'
import { bewegungsTokens } from './bewegung.js'
const props = defineProps({ beginn: { type: Number, required: true } })
const sichtbar = ref(false)
let timer
onMounted(() => {
  const rest = bewegungsTokens().dauer('--slow') - (performance.now() - props.beginn)
  // Ein langsamer Download darf die Startsequenz nicht nach einer Aktion nachholen.
  if (rest <= 0) return
  sichtbar.value = true
  timer = setTimeout(() => {
    sichtbar.value = false
  }, rest)
})
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div v-if="sichtbar" class="startsequenz" aria-hidden="true">
    <div class="startprotokoll">
      <p class="system-label start-zeile">Trackify / Systemstart</p>
      <div class="start-linie"></div>
      <p class="start-marke glyphen-text">
        <span class="glyphen-endwert">Trackify.</span><GlyphenAufloesung wert="Trackify." />
      </p>
      <p class="system-label start-zeile">Tagesprotokoll · bereit</p>
      <p class="system-label start-zeile">Eingabe · bereit</p>
      <div class="start-linie"></div>
      <p class="klein">Jede Eingabe überspringt.</p>
    </div>
  </div>
</template>

<style scoped>
.startsequenz {
  position: fixed;
  inset: 0;
  z-index: var(--z-start);
  display: grid;
  place-items: center;
  padding: var(--seite-rand);
  background: var(--farbe-grund);
  pointer-events: none;
}
.startprotokoll {
  width: min(100%, var(--start-breite));
}
.start-marke {
  margin: var(--a-6) 0;
  font: var(--display-gewicht) var(--start-wortmarke) / var(--titel-zh) var(--display);
  letter-spacing: var(--titel-laufweite);
}
.start-linie {
  height: var(--linien-breite);
  background: var(--farbe-linie-stark);
  margin-block: var(--a-4);
  transform-origin: left;
  animation: lineIn var(--base) var(--ease) both;
}
.start-zeile {
  margin-block: var(--a-2);
  animation: typeIn var(--fast) var(--ease) both;
}
.start-zeile:nth-of-type(3) {
  animation-delay: var(--fast);
}
.start-zeile:nth-of-type(4) {
  animation-delay: calc(var(--fast) * 2);
}
</style>
