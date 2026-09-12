<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import RouterLink from './SeitenLink.vue'

defineOptions({ name: 'HauptNavigation' })

const melden = defineEmits(['hoehe'])
const leiste = ref(null)
const ziele = [
  { name: 'Heute', pfad: '/', symbol: 'M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9' },
  {
    name: 'Training',
    pfad: '/training',
    symbol: 'M3 9v6m3-9v12m0-6h12m0-6v12m3-9v6',
  },
  { name: 'Rang', pfad: '/rang', symbol: 'm12 3 8 9-8 9-8-9 8-9Zm-4 9 4-4 4 4-4 4-4-4Z' },
  {
    name: 'Profil',
    pfad: '/profil',
    symbol: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2',
  },
]
let groessenBeobachter

onMounted(() => {
  // Die reale Höhe enthält auch umgebrochene Texte und die Safe-Area.
  groessenBeobachter = new ResizeObserver(() => {
    melden('hoehe', `${leiste.value.getBoundingClientRect().height}px`)
  })
  groessenBeobachter.observe(leiste.value, { box: 'border-box' })
})

onBeforeUnmount(() => groessenBeobachter?.disconnect())
</script>

<template>
  <nav ref="leiste" class="navigationsleiste" aria-label="Hauptnavigation">
    <div class="navigationsziele">
      <RouterLink v-for="ziel in ziele" :key="ziel.pfad" :to="ziel.pfad" class="navigationslink">
        <svg class="navigationssymbol" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path :d="ziel.symbol" />
        </svg>
        <span>{{ ziel.name }}</span>
      </RouterLink>
    </div>
  </nav>
</template>
