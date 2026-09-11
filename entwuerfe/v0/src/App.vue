<script setup>
import { computed, ref } from 'vue'
import RangRelikt from './components/RangRelikt.vue'
import AppSternenfeld from './components/AppSternenfeld.vue'

const rangIndex = ref(0)
const rangStufen = ['bronze', 'silber', 'gold', 'platin', 'diamant', 'champion', 'olympus']
const rang = computed(() => rangStufen[rangIndex.value])

function vorherigerRang() {
  rangIndex.value = Math.max(0, rangIndex.value - 1)
}

function naechsterRang() {
  rangIndex.value = Math.min(rangStufen.length - 1, rangIndex.value + 1)
}
</script>

<template>
  <main class="spike">
    <AppSternenfeld />
    <section class="konsole" aria-labelledby="spike-titel">
      <header class="kopf">
        <p class="system-label"><span aria-hidden="true">◆</span> Trackify · visueller Spike</p>
        <h1 id="spike-titel">Rang-Relikte</h1>
        <p class="erklaerung">
          Mock-Daten: Die Form entwickelt sich pro Rang weiter. Ranglogik und 1RM-Berechnung sind
          bewusst nicht Teil dieses Tests.
        </p>
      </header>
      <div class="rang-buehne">
        <div class="rahmen rahmen-aussen" aria-hidden="true"></div>
        <div class="rahmen rahmen-innen" aria-hidden="true"></div>
        <RangRelikt :stufe="rang" />
      </div>
      <section class="rang-daten" aria-live="polite">
        <p class="system-label">Kraftprofil · Mock</p>
        <h2>{{ rang }}</h2>
        <p>Bankdrücken · Division II</p>
      </section>
      <div class="steuerung" aria-label="Rang im visuellen Spike auswählen">
        <button type="button" :disabled="rangIndex === 0" @click="vorherigerRang">
          ← vorheriger
        </button>
        <span>{{ rangIndex + 1 }} / {{ rangStufen.length }}</span>
        <button
          type="button"
          :disabled="rangIndex === rangStufen.length - 1"
          @click="naechsterRang"
        >
          nächster →
        </button>
      </div>
      <p class="hinweis">Bei reduzierter Bewegung wird das Relikt ohne Animation angezeigt.</p>
    </section>
  </main>
</template>
