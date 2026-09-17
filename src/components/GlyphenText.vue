<script setup>
import KinoAuflage from './KinoAuflage.vue'
defineProps({
  wert: { type: [String, Number], required: true },
  aktiv: { type: Boolean, default: true },
})
</script>

<template>
  <span class="glyphen-text">
    <span class="glyphen-endwert" :data-lang="String(wert).length > 5 ? '' : undefined">{{
      wert
    }}</span>
    <KinoAuflage v-if="aktiv" name="GlyphenAufloesung" :wert="String(wert)" />
  </span>
</template>
