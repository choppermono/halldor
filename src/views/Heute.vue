<script setup>
import { useRoute } from 'vue-router'

defineOptions({ name: 'HeuteAnsicht' })
const route = useRoute()
</script>

<template>
  <section class="ansicht" aria-labelledby="heute-titel">
    <p v-if="route.redirectedFrom" class="routenhinweis" role="status">
      Diese Seite gibt es nicht. Du bist wieder auf Heute.
    </p>
    <p class="system-label seitenrubrik">Dein Tag</p>
    <h1 id="heute-titel">Heute</h1>
    <div class="platzhalter">
      <p class="platzhalter-label">Hier entsteht dein Ernährungstagebuch.</p>
      <p>Einträge und Tagesbilanz sind noch nicht verfügbar.</p>
    </div>
  </section>
</template>
