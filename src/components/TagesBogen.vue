<script setup>
import { computed } from 'vue'
import KinoAuflage from './KinoAuflage.vue'
const props = defineProps({ anteil: { type: Number, required: true }, ueberschritten: Boolean })
// 270 Grad, unten offen. Der identische Pfad traegt Ruhefassung und optionale Auflage.
const pfad = 'M 63.23 256.77 A 122 122 0 1 1 235.77 256.77'
const winkel = computed(
  () => ((135 + (270 * Math.min(100, Math.max(0, props.anteil))) / 100) * Math.PI) / 180
)
const punkt = computed(() => ({
  x: 149.5 + 122 * Math.cos(winkel.value),
  y: 170.5 + 122 * Math.sin(winkel.value),
}))
</script>

<template>
  <div class="tagesinstrument" :class="{ 'ziel-ueberschritten': ueberschritten }">
    <svg class="tagesbogen" viewBox="0 0 299 290" aria-hidden="true" focusable="false">
      <path class="bogen-teilung" d="M 50 270 A 141 141 0 1 1 249 270" />
      <path class="bogen-grund" :d="pfad" pathLength="100" />
      <path class="bogen-spur" :d="pfad" pathLength="100" :stroke-dasharray="`${anteil} 100`" />
      <circle class="bogen-punkt" :cx="punkt.x" :cy="punkt.y" />
    </svg>
    <div class="instrument-inhalt"><slot /></div>
    <KinoAuflage name="BogenAufzug" :anteil="anteil" :pfad="pfad" />
  </div>
</template>
