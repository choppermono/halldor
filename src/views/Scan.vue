<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import ProduktBestaetigen from './ProduktBestaetigen.vue'

defineOptions({ name: 'ScanAnsicht' })

const route = useRoute()
const pruefzustaende = ['erlaubnis', 'keine_kamera']
const pruefzustand = computed(() =>
  import.meta.env.DEV && pruefzustaende.includes(route.query.pruefzustand)
    ? route.query.pruefzustand
    : ''
)
const pruefcode = computed(() =>
  import.meta.env.DEV && typeof route.query.pruefcode === 'string' ? route.query.pruefcode : ''
)

onMounted(() => {
  if (import.meta.env.DEV && route.query.schrift === '200')
    document.documentElement.dataset.scannerSchrifttest = '200'
})
onUnmounted(() => delete document.documentElement.dataset.scannerSchrifttest)
</script>

<template>
  <ProduktBestaetigen scanner :scanner-pruefzustand="pruefzustand" :scanner-pruefcode="pruefcode" />
</template>
