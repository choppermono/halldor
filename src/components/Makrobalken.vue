<script setup>
import { computed } from 'vue'
import { zahl } from '../lib/darstellung.js'
defineOptions({ name: 'MakroBalken' })
const props = defineProps({
  name: { type: String, required: true },
  bilanz: { type: Object, required: true },
  ziel: { type: Number, default: null },
})
const anteil = computed(() =>
  props.ziel > 0
    ? Math.min(100, Math.max(0, (props.bilanz.bekannt / props.ziel) * 100))
    : props.ziel === 0 && props.bilanz.bekannt > 0
      ? 100
      : 0
)
</script>
<template>
  <div class="makrozeile">
    <div class="makrokopf">
      <span>{{ name }}</span
      ><span class="messzahl">{{ zahl(bilanz.bekannt) }} / {{ zahl(ziel) }} g</span>
    </div>
    <div class="skala" aria-hidden="true"><span :style="{ width: `${anteil}%` }"></span></div>
    <span v-if="!bilanz.vollstaendig" class="klein"
      >Bekannter Anteil, gerundet. {{ bilanz.unbekannt }} Eintrag/Einträge mit unbekanntem
      Wert.</span
    >
  </div>
</template>
