<script setup>
import { shallowRef, watch } from 'vue'
import { useAnzeigeebene } from '../composables/useAnzeigeebene.js'

// Vite erzeugt nur Ladefunktionen; ohne den Kino-Ordner bleibt das Register leer.
const hintergruende = import.meta.glob('../kino/*.vue')
const laden = hintergruende['../kino/AppSternenfeld.vue']
const hintergrund = shallowRef(null)
const { webglAktiv } = useAnzeigeebene()

watch(
  webglAktiv,
  async (aktiv, vorher, beimAufraeumen) => {
    if (!aktiv || hintergrund.value || !laden) return
    let verworfen = false
    beimAufraeumen(() => {
      verworfen = true
    })
    try {
      const modul = await laden()
      // Gilt auch beim Entfernen des Einhaengepunkts waehrend des Downloads.
      if (!verworfen && webglAktiv.value) hintergrund.value = modul.default
    } catch {
      // Die vollstaendige CSS-Ruhefassung braucht dieses Modul nicht.
    }
  },
  { immediate: true }
)
</script>

<template>
  <component :is="hintergrund" v-if="hintergrund" />
</template>
