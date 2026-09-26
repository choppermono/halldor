<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

defineOptions({ name: 'ZahlAufzaehlen' })

// Zaehlt eine Zahl von null auf ihren Wert hoch. Der echte Wert steht fuer
// Vorleseprogramme sofort im DOM; nur die sichtbare Kopie zaehlt.
const props = defineProps({
  wert: { type: Number, required: true },
  nachkomma: { type: Number, default: 0 },
  verzoegerung: { type: Number, default: 0 },
  dauer: { type: Number, default: 1400 },
})
const anzeige = ref(0)
let auftrag = null
let zeitgeber = null

function format(zahl) {
  return zahl.toLocaleString('de-CH', {
    minimumFractionDigits: props.nachkomma,
    maximumFractionDigits: props.nachkomma,
  })
}

onMounted(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    anzeige.value = props.wert
    return
  }
  zeitgeber = setTimeout(() => {
    const beginn = performance.now()
    const schritt = (jetzt) => {
      const t = Math.min(1, (jetzt - beginn) / props.dauer)
      anzeige.value = props.wert * (1 - Math.pow(1 - t, 4))
      if (t < 1) auftrag = requestAnimationFrame(schritt)
    }
    auftrag = requestAnimationFrame(schritt)
  }, props.verzoegerung)
})
onBeforeUnmount(() => {
  clearTimeout(zeitgeber)
  if (auftrag) cancelAnimationFrame(auftrag)
})
</script>

<template>
  <span class="zahl-aufzaehlen"
    ><span class="nur-vorlesbar">{{ format(props.wert) }}</span
    ><span aria-hidden="true">{{ format(anzeige) }}</span></span
  >
</template>
