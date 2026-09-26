<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useTraining } from '../composables/useTraining.js'
import { rangdaten, ranglisteBerechnen } from '../lib/rang.js'

defineOptions({ name: 'RangAnsicht' })

const training = useTraining()
training.trainingLaden()
const raenge = computed(() => ranglisteBerechnen(training.zustand.einheiten, training.uebungen))
const rangNachUebung = computed(() => new Map(raenge.value.map((rang) => [rang.uebungId, rang])))
const zeilen = computed(() =>
  training.uebungen.map((uebung) => ({ uebung, rang: rangNachUebung.value.get(uebung.id) ?? null }))
)

function zahl(wert) {
  return Number(wert).toLocaleString('de-CH', { maximumFractionDigits: 2 })
}
</script>

<template>
  <section class="ansicht rang" aria-labelledby="rang-titel">
    <p class="system-label">Eigener Fortschritt</p>
    <h1 id="rang-titel">Rang.</h1>
    <p class="einleitung">
      Jede Übung steht für sich. Gezählt wird die beste Last in einem Satz, der das
      Wiederholungsfenster erreicht hat.
    </p>

    <div v-if="!raenge.length" class="rang-leer">
      <p>Noch keine gültige Last gespeichert. Die offenen Stufen der Übungen sind unten sichtbar.</p>
      <RouterLink class="knopf primaer" to="/training">Training erfassen</RouterLink>
    </div>

    <ol class="rangliste">
      <li v-for="zeile in zeilen" :key="zeile.uebung.id" class="rangkarte">
        <header class="rangkopf">
          <h2>{{ zeile.uebung.name }}</h2>
          <p class="stufe">{{ zeile.rang?.wert.stufe?.name ?? 'Offen' }}</p>
        </header>
        <p class="beste-last">
          <span>Beste Last</span>
          <strong v-if="zeile.rang">{{ zahl(zeile.rang.wert.lastKg) }} kg × {{ zeile.rang.satz.wiederholungen }}</strong>
          <strong v-else>Noch keine Last</strong>
        </p>

        <div class="rang-leiter" aria-hidden="true">
          <span
            v-for="(stufe, index) in rangdaten.stufen"
            :key="stufe"
            :class="{ erreicht: zeile.rang?.wert.stufe && index < zeile.rang.wert.stufe.index, aktuell: index === zeile.rang?.wert.stufe?.index }"
          ></span>
        </div>
        <div class="rang-schwellen" aria-label="Stufenschwellen">
          <span v-for="(stufe, index) in rangdaten.stufen" :key="stufe">
            <abbr :title="stufe">{{ stufe[0] }}</abbr>
            {{ zeile.rang?.herleitung.schwellen?.[index] ? zahl(zeile.rang.herleitung.schwellen[index]) : '–' }}
          </span>
        </div>
        <p v-if="zeile.rang?.wert.naechsteStufe" class="rang-abstand">
          {{ zeile.rang.wert.naechsteStufe }} ab
          {{ zahl(zeile.rang.wert.lastKg + zeile.rang.wert.abstandKg) }} kg · noch
          {{ zahl(zeile.rang.wert.abstandKg) }} kg
        </p>
        <p v-else-if="zeile.rang?.wert.stufe" class="rang-abstand">Höchste Stufe erreicht</p>
        <p v-else class="rang-abstand">Stufen noch nicht festgelegt</p>
      </li>
    </ol>

    <p class="klein methodenhinweis">
      Es gibt bewusst keinen Gesamtrang. Die Skala misst den eigenen Fortschritt nach absoluter
      Last, nicht den Vergleich mit anderen Menschen.
    </p>
  </section>
</template>
