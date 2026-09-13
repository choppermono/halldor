<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { bewegungsTokens } from './bewegung.js'
const props = defineProps({ wert: { type: String, required: true } })
const zeichen = ref('')
const sichtbar = ref(false)
let timer
let beenden
onMounted(() => {
  const tokens = bewegungsTokens()
  const dauer = tokens.dauer('--dauer-glyphen')
  const takt = tokens.dauer('--glyphen-takt')
  const schritte = Number(tokens.wert('--kurve-technisch').match(/steps\((\d+)/)[1])
  const alphabet = tokens.wert('--glyphen-zeichen').replace(/^['"]|['"]$/g, '')
  beenden = watch(
    () => props.wert,
    (wert) => {
      clearTimeout(timer)
      const start = performance.now()
      sichtbar.value = true
      function schritt() {
        const anteil = Math.min(1, (performance.now() - start) / dauer)
        if (anteil >= 1) {
          sichtbar.value = false
          return
        }
        const fest = Math.floor((wert.length * Math.floor(anteil * schritte)) / schritte)
        zeichen.value = [...wert]
          .map((zeichen, index) =>
            index < fest || /\s/.test(zeichen)
              ? zeichen
              : alphabet[Math.floor(Math.random() * alphabet.length)]
          )
          .join('')
        timer = setTimeout(schritt, takt)
      }
      schritt()
    },
    { immediate: true }
  )
})
onBeforeUnmount(() => {
  clearTimeout(timer)
  beenden?.()
})
</script>

<template>
  <span v-if="sichtbar" class="glyphen-dekor" aria-hidden="true">{{ zeichen }}</span>
</template>
