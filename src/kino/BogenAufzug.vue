<script setup>
import { nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { bewegungsTokens } from './bewegung.js'
const props = defineProps({
  anteil: { type: Number, required: true },
  pfad: { type: String, required: true },
})
const spur = ref(null)
const punkt = ref(null)
const sichtbar = ref(false)
let animationen = []
let beenden
onMounted(() => {
  const tokens = bewegungsTokens()
  beenden = watch(
    () => props.anteil,
    async (anteil, vorher, aufraeumen) => {
      let verworfen = false
      aufraeumen(() => {
        verworfen = true
        animationen.forEach((animation) => animation.cancel())
      })
      if (anteil <= 0) {
        sichtbar.value = false
        return
      }
      sichtbar.value = true
      await nextTick()
      if (verworfen || !spur.value) return
      const timing = {
        duration: tokens.dauer('--dauer-bogen'),
        easing: tokens.wert('--kurve-bogen'),
        fill: 'both',
      }
      try {
        animationen = [
          spur.value.animate(
            [{ strokeDashoffset: String(anteil) }, { strokeDashoffset: '0' }],
            timing
          ),
        ]
        animationen.push(
          punkt.value.animate(
            [{ transform: 'rotate(0deg)' }, { transform: `rotate(${(270 * anteil) / 100}deg)` }],
            timing
          )
        )
        await Promise.all(animationen.map((animation) => animation.finished))
      } catch {
        // Auch fehlendes WAAPI oder ein Abbruch zeigt den fertigen Kern.
        animationen.forEach((animation) => animation.cancel())
      }
      if (!verworfen) sichtbar.value = false
    },
    { immediate: true }
  )
})
onBeforeUnmount(() => {
  beenden?.()
  animationen.forEach((animation) => animation.cancel())
})
</script>

<template>
  <svg
    v-if="sichtbar"
    class="tagesbogen bogen-aufzug"
    viewBox="0 0 299 290"
    aria-hidden="true"
    focusable="false"
  >
    <path
      ref="spur"
      class="bogen-spur"
      :d="pfad"
      pathLength="100"
      :stroke-dasharray="`${anteil} 100`"
    />
    <g ref="punkt" class="bogen-zeiger"><circle class="bogen-punkt" cx="63.23" cy="256.77" /></g>
  </svg>
</template>

<style>
.tagesinstrument:has(.bogen-aufzug)
  > .tagesbogen:not(.bogen-aufzug)
  :is(.bogen-spur, .bogen-punkt) {
  opacity: 0;
}
.bogen-zeiger {
  transform-origin: var(--bogen-drehpunkt);
}
</style>
