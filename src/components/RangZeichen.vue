<script setup>
import { computed } from 'vue'

defineOptions({ name: 'RangZeichen' })

// Das Zeichen zeigt die Stufe über Geometrie statt über Farbe: jede Stufe
// legt eine Raute nach innen dazu, Diamant füllt den Kern. So bleibt es bei
// einer Akzentfarbe, und die Stufe ist auch ohne Farbsehen lesbar.
const props = defineProps({
  stufe: { type: Number, default: -1 },
  groesse: { type: Number, default: 48 },
})
const HALBMASSE = [22, 17.5, 13, 8.5, 4]
const rauten = computed(() =>
  HALBMASSE.map((h, index) => ({
    index,
    punkte: `24,${24 - h} ${24 + h},24 24,${24 + h} ${24 - h},24`,
    erreicht: index <= props.stufe,
    aktuell: index === props.stufe,
  }))
)
</script>

<template>
  <svg
    class="rangzeichen"
    :class="{ 'rangzeichen-leer': stufe < 0 }"
    viewBox="0 0 48 48"
    :width="groesse"
    :height="groesse"
    aria-hidden="true"
    focusable="false"
  >
    <polygon
      v-for="raute in rauten"
      :key="raute.index"
      :points="raute.punkte"
      :class="{ erreicht: raute.erreicht, aktuell: raute.aktuell }"
      :style="{ '--i': raute.index }"
    />
    <polygon v-if="stufe >= 4" class="kern" points="24,21 27,24 24,27 21,24" />
  </svg>
</template>
