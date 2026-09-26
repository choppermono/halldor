<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import RangZeichen from '../components/RangZeichen.vue'
import { useProfil } from '../composables/useProfil.js'
import { useTraining } from '../composables/useTraining.js'
import { rangdaten, ranglisteBerechnen, schwellenFuer } from '../lib/rang.js'

defineOptions({ name: 'RangAnsicht' })

const training = useTraining()
const profil = useProfil()
training.trainingLaden()
profil.profilLaden()

const geschlecht = computed(() => profil.zustand.profil?.geschlecht ?? '')
const skalaName = computed(
  () => ({ m: 'Männer', w: 'Frauen' })[geschlecht.value] ?? 'nicht gewählt'
)
const raenge = computed(() =>
  ranglisteBerechnen(training.zustand.einheiten, training.uebungen, rangdaten, geschlecht.value)
)
const rangNachUebung = computed(() => new Map(raenge.value.map((rang) => [rang.uebungId, rang])))
const mitLast = computed(() =>
  training.uebungen
    .filter((uebung) => rangNachUebung.value.has(uebung.id))
    .map((uebung) => ({ uebung, rang: rangNachUebung.value.get(uebung.id) }))
)
const ohneLast = computed(() =>
  training.uebungen
    .filter((uebung) => !rangNachUebung.value.has(uebung.id))
    .map((uebung) => ({ uebung, schwellen: schwellenFuer(uebung.id, rangdaten, geschlecht.value) }))
)
// Wie viele Übungen auf welcher Stufe stehen. Das ist eine Verteilung, kein
// Gesamtrang (E-27): keine Stufe wird aus den anderen verrechnet.
const verteilung = computed(() =>
  rangdaten.stufen.map((name, index) => ({
    name,
    index,
    anzahl: raenge.value.filter((rang) => rang.wert.stufe?.index === index).length,
  }))
)

// Füllung je Leitersegment: erreichte Stufen voll, die nächste anteilig.
function segmentAnteil(rang, index) {
  const schwellen = rang.herleitung.schwellen
  const last = rang.wert.lastKg
  if (last >= schwellen[index]) return 1
  const untergrenze = index === 0 ? 0 : schwellen[index - 1]
  if (last < untergrenze) return 0
  return (last - untergrenze) / (schwellen[index] - untergrenze)
}

function zahl(wert) {
  return Number(wert).toLocaleString('de-CH', { maximumFractionDigits: 2 })
}
</script>

<template>
  <section class="ansicht rang" aria-labelledby="rang-titel">
    <p class="system-label">Rangskala {{ skalaName }}</p>
    <h1 id="rang-titel">Rang.</h1>
    <p class="einleitung">
      Jede Übung hat feste Gewichtsschwellen von Bronze bis Diamant. Gezählt wird deine beste Last
      in einem Satz, der die Untergrenze des Wiederholungsfensters erreicht.
    </p>

    <p v-if="!geschlecht" class="meldung" role="status">
      Die Rangskala hängt an der Auswahl Männlich oder Weiblich im Profil.
      <RouterLink to="/profil">Im Profil wählen</RouterLink>
    </p>

    <ol class="stufenverteilung" aria-label="Übungen je Stufe">
      <li v-for="stufe in verteilung" :key="stufe.name" :class="{ leer: !stufe.anzahl }">
        <RangZeichen :stufe="stufe.anzahl ? stufe.index : -1" :groesse="40" />
        <strong>{{ stufe.anzahl }}</strong>
        <span>{{ stufe.name }}</span>
      </li>
    </ol>

    <div v-if="!mitLast.length" class="rang-leer">
      <p class="leerzustand">
        Noch keine Last erfasst. Nach der ersten Einheit steht hier je Übung deine Stufe.
      </p>
      <RouterLink class="knopf primaer" to="/training">Zum Training</RouterLink>
    </div>

    <ol v-else class="rangliste">
      <li
        v-for="({ uebung, rang }, position) in mitLast"
        :key="uebung.id"
        class="rangzeile"
        :style="{ '--i': position }"
      >
        <RangZeichen :stufe="rang.wert.stufe?.index ?? -1" :groesse="52" />
        <div class="rangzeile-text">
          <h2>{{ uebung.name }}</h2>
          <p class="stufe" :class="{ ohne: !rang.wert.stufe }">
            {{
              rang.wert.stufe?.name ?? (rang.herleitung.schwellen ? 'Unter Bronze' : 'Ohne Skala')
            }}
          </p>
        </div>
        <p class="rang-last">
          <strong>{{ zahl(rang.wert.lastKg) }}</strong
          ><span>kg × {{ rang.satz.wiederholungen }}</span>
        </p>

        <template v-if="rang.herleitung.schwellen">
          <div class="rang-leiter" aria-hidden="true">
            <span v-for="(stufe, index) in rangdaten.stufen" :key="stufe"
              ><i :style="{ transform: `scaleX(${segmentAnteil(rang, index)})` }"></i
            ></span>
          </div>
          <div class="rang-schwellen">
            <span
              v-for="(stufe, index) in rangdaten.stufen"
              :key="stufe"
              :class="{ erreicht: rang.wert.stufe && index <= rang.wert.stufe.index }"
            >
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
        <li v-for="{ uebung, schwellen } in ohneLast" :key="uebung.id">
          <span>{{ uebung.name }}</span>
          <span v-if="schwellen" class="system-label">Bronze ab {{ zahl(schwellen[0]) }} kg</span>
        </li>
      </ul>
    </section>

    <p class="klein methodenhinweis">
      Die Schwellen sind gesetzt, nicht gemessen, und für alle mit derselben Skala gleich. Es gibt
      keinen Gesamtrang: jede Übung steht für sich.
    </p>
  </section>
</template>
