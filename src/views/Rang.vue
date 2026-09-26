<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useTraining } from '../composables/useTraining.js'
import { rangdaten, ranglisteBerechnen, schwellenFuer } from '../lib/rang.js'

defineOptions({ name: 'RangAnsicht' })

const training = useTraining()
training.trainingLaden()
const raenge = computed(() => ranglisteBerechnen(training.zustand.einheiten, training.uebungen))
const rangNachUebung = computed(() => new Map(raenge.value.map((rang) => [rang.uebungId, rang])))
const mitLast = computed(() =>
  training.uebungen
    .filter((uebung) => rangNachUebung.value.has(uebung.id))
    .map((uebung) => ({ uebung, rang: rangNachUebung.value.get(uebung.id) }))
)
const ohneLast = computed(() =>
  training.uebungen.filter((uebung) => !rangNachUebung.value.has(uebung.id))
)
// Solange keine einzige Skala eingetragen ist, sagt die Seite das einmal oben
// statt fünfzehnmal in jeder Zeile.
const stufenFestgelegt = computed(() =>
  training.uebungen.some((uebung) => schwellenFuer(uebung.id))
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
      Beste Last je Übung, gezählt ab der Untergrenze des Wiederholungsfensters.
    </p>
    <p v-if="!stufenFestgelegt" class="rang-vermerk system-label">
      Stufen Bronze bis Diamant noch nicht festgelegt
    </p>

    <div v-if="!mitLast.length" class="rang-leer">
      <p class="leerzustand">
        Noch keine Last erfasst. Nach der ersten Einheit steht hier je Übung dein bester Satz.
      </p>
      <RouterLink class="knopf primaer" to="/training">Zum Training</RouterLink>
    </div>

    <ol v-else class="rangliste">
      <li v-for="{ uebung, rang } in mitLast" :key="uebung.id" class="rangzeile">
        <div class="rangzeile-kopf">
          <h2>{{ uebung.name }}</h2>
          <p class="rang-last">
            <strong>{{ zahl(rang.wert.lastKg) }}</strong
            ><span>kg × {{ rang.satz.wiederholungen }}</span>
          </p>
        </div>

        <template v-if="rang.herleitung.schwellen">
          <p v-if="rang.wert.stufe" class="stufe">{{ rang.wert.stufe.name }}</p>
          <div class="rang-leiter" aria-hidden="true">
            <span
              v-for="(stufe, index) in rangdaten.stufen"
              :key="stufe"
              :class="{
                erreicht: rang.wert.stufe && index < rang.wert.stufe.index,
                aktuell: index === rang.wert.stufe?.index,
              }"
            ></span>
          </div>
          <div class="rang-schwellen">
            <span v-for="(stufe, index) in rangdaten.stufen" :key="stufe">
              <abbr :title="stufe">{{ stufe[0] }}</abbr>
              {{ zahl(rang.herleitung.schwellen[index]) }}
            </span>
          </div>
          <p class="rang-abstand">
            <template v-if="rang.wert.naechsteStufe">
              {{ rang.wert.naechsteStufe }} ab {{ zahl(rang.wert.lastKg + rang.wert.abstandKg) }} kg
              · noch {{ zahl(rang.wert.abstandKg) }} kg
            </template>
            <template v-else>Höchste Stufe erreicht</template>
          </p>
        </template>
      </li>
    </ol>

    <section
      v-if="ohneLast.length && mitLast.length"
      class="rang-offen"
      aria-labelledby="offen-titel"
    >
      <h2 id="offen-titel" class="system-label">Noch ohne Last</h2>
      <ul>
        <li v-for="uebung in ohneLast" :key="uebung.id">{{ uebung.name }}</li>
      </ul>
    </section>

    <p class="klein methodenhinweis">
      Es gibt bewusst keinen Gesamtrang. Die Skala misst den eigenen Fortschritt, nicht den
      Vergleich mit anderen.
    </p>
  </section>
</template>
