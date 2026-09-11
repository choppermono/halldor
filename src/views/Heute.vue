<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

defineOptions({ name: 'HeuteAnsicht' })

const route = useRoute()
const hinweis = ref('')

// Die Live-Region steht schon beim ersten Rendern im DOM und wird erst danach
// gefuellt. Kommen Region und Text gleichzeitig ins DOM, melden die meisten
// Screenreader nichts, weil sie nur Aenderungen einer vorhandenen Region lesen.
onMounted(() => {
  if (route.redirectedFrom) {
    hinweis.value = 'Diese Seite gibt es nicht. Du bist wieder auf Heute.'
  }
})
</script>

<template>
  <section class="ansicht" aria-labelledby="heute-titel">
    <div role="status">
      <p v-if="hinweis" class="routenhinweis">{{ hinweis }}</p>
    </div>
    <p class="system-label seitenrubrik">Dein Tag</p>
    <h1 id="heute-titel">Heute</h1>
    <div class="platzhalter">
      <p class="platzhalter-label">Hier entsteht dein Ernährungstagebuch.</p>
      <p>Einträge und Tagesbilanz sind noch nicht verfügbar.</p>
    </div>
  </section>
</template>
