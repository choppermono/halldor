<script setup>
import SystemSymbol from '../components/SystemSymbol.vue'
defineOptions({ name: 'RangAnsicht' })
</script>

<template>
  <section class="ansicht ruhende-ansicht" aria-labelledby="rang-titel">
    <p class="system-label seitenrubrik">Stufe 3</p>
    <h1 id="rang-titel">Rang</h1>
    <div class="platzhalter">
      <div class="platzhalter-schema" aria-hidden="true">
        <SystemSymbol name="rang" /><span class="system-label">Noch keine Daten</span>
      </div>
      <p class="platzhalter-label">Deine Kraftwerte folgen in Stufe 3.</p>
      <p>
        Ränge werden hier später aus Trainingsdaten berechnet. Diese Funktion ist noch nicht
        verfügbar.
      </p>
    </div>
  </section>
</template>
