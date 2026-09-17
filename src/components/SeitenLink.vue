<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAnzeigeebene } from '../composables/useAnzeigeebene.js'
defineOptions({ inheritAttrs: false })
const { zustand } = useAnzeigeebene()
// Vue Router startet push sofort. Nur der Browser animiert die Schnappschuesse.
const uebergang = computed(() => !zustand.reduzierteBewegung)
</script>

<template>
  <RouterLink v-bind="$attrs" :view-transition="uebergang"><slot /></RouterLink>
</template>
