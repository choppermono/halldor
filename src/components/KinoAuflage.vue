<script setup>
import { computed, shallowRef, watch } from 'vue'
import { useAnzeigeebene } from '../composables/useAnzeigeebene.js'
defineOptions({ inheritAttrs: false })
const props = defineProps({ name: { type: String, required: true } })
// Ein optionales Register, kein Importvertrag: ohne src/kino bleibt die Ruhefassung stehen.
const register = import.meta.glob('../kino/*.vue')
const { anzeigeebeneAktiv, zustand } = useAnzeigeebene()
const erlaubt = computed(() => anzeigeebeneAktiv.value && !zustand.reduzierteBewegung)
const auflage = shallowRef(null)
watch(
  () => [erlaubt.value, props.name],
  async ([aktiv, name], vorher, aufraeumen) => {
    if (!aktiv) return
    const laden = register[`../kino/${name}.vue`]
    if (!laden) return
    let verworfen = false
    aufraeumen(() => {
      verworfen = true
    })
    try {
      const modul = await laden()
      if (!verworfen) auflage.value = modul.default
    } catch {
      // Darstellungsfehler duerfen weder Daten noch Bedienung beruehren.
    }
  },
  { immediate: true }
)
</script>

<template>
  <component :is="auflage" v-if="erlaubt && auflage" v-bind="$attrs" />
</template>
