<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useTraining } from '../composables/useTraining.js'
import { ranglisteBerechnen } from '../lib/rang.js'

defineOptions({ name: 'RangAnsicht' })

const training = useTraining()
training.trainingLaden()
const raenge = computed(() => ranglisteBerechnen(training.zustand.einheiten, training.uebungen))

function zahl(wert, stellen = 1) {
  return Number(wert).toLocaleString('de-CH', {
    minimumFractionDigits: stellen,
    maximumFractionDigits: stellen,
  })
}
function zeit(iso) {
  return new Intl.DateTimeFormat('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso))
}
</script>

<template>
  <section class="ansicht rang" aria-labelledby="rang-titel">
    <p class="system-label seitenrubrik">Rang / Kraftstand</p>
    <h1 id="rang-titel">Rang.</h1>
    <p class="einleitung">
      Jede Übung steht für sich. Die Stufe richtet sich nach der Last, die du in einem sauberen Satz
      bewegt hast — ein Mass für deinen eigenen Fortschritt, kein Vergleich mit anderen.
    </p>

    <div v-if="!raenge.length" class="leerzustand">
      <p>
        Noch keine Sätze gespeichert, die die Untergrenze des Wiederholungsfensters erreicht haben.
      </p>
      <RouterLink class="knopf primaer" to="/training">Training erfassen</RouterLink>
    </div>

    <ol v-else class="rangliste staffel">
      <li v-for="rang in raenge" :key="rang.uebungId" class="rangkarte">
        <header class="rangkopf">
          <div>
            <p class="system-label">Übung / eigene Skala</p>
            <h2>{{ rang.uebungName }}</h2>
          </div>
          <p class="stufe">{{ rang.wert.stufe?.name ?? 'Ohne Stufe' }}</p>
        </header>

        <dl class="rangwerte">
          <div>
            <dt>Beste Last</dt>
            <dd>{{ zahl(rang.wert.lastKg) }} kg</dd>
          </div>
          <div>
            <dt>Nächste Stufe</dt>
            <dd v-if="rang.wert.naechsteStufe">
              {{ rang.wert.naechsteStufe }} · {{ zahl(rang.wert.abstandKg) }} kg Abstand
            </dd>
            <dd v-else-if="rang.wert.stufe">Skala vollständig</dd>
            <dd v-else-if="rang.wert.grund === 'stufen_fehlen'">noch offen</dd>
            <dd v-else>nicht berechenbar</dd>
          </div>
        </dl>

        <p v-if="rang.wert.grund === 'stufen_fehlen'" class="klein">
          Für diese Übung sind die Stufen noch nicht festgelegt. Die beste Last wird trotzdem
          festgehalten.
        </p>

        <details class="rang-herleitung">
          <summary>Herleitung aufklappen</summary>
          <dl>
            <div>
              <dt>Verwendeter Satz</dt>
              <dd>
                {{ zahl(rang.satz.gewichtKg) }} kg × {{ rang.satz.wiederholungen }} ·
                {{ zeit(rang.satz.zeit) }}
              </dd>
            </div>
            <div>
              <dt>Gezählt, weil</dt>
              <dd>mindestens {{ rang.mindestWiederholungen }} Wiederholungen</dd>
            </div>
            <div v-if="rang.herleitung.epleyKg">
              <dt>Geschätztes Maximum · Epley</dt>
              <dd>
                {{ zahl(rang.satz.gewichtKg) }} × (1 + {{ rang.satz.wiederholungen }} / 30) =
                {{ zahl(rang.herleitung.epleyKg) }} kg
              </dd>
            </div>
            <div v-if="rang.herleitung.brzyckiKg">
              <dt>Brzycki · Vergleich</dt>
              <dd>
                {{ zahl(rang.satz.gewichtKg) }} × 36 / (37 − {{ rang.satz.wiederholungen }}) =
                {{ zahl(rang.herleitung.brzyckiKg) }} kg
              </dd>
            </div>
          </dl>
        </details>
      </li>
    </ol>

    <p class="klein methodenhinweis">
      Es gibt bewusst keinen Gesamtrang. Gezählt wird die höchste Last in einem Satz, der die
      Untergrenze des Wiederholungsfensters erreicht hat. Das geschätzte Maximum steht nur zur
      Einordnung in der Herleitung.
    </p>
  </section>
</template>

<style scoped>
.rang {
  font-family: var(--body);
}
.normierung {
  margin-bottom: var(--s-5);
  padding: var(--s-3);
  border-left: var(--markierungs-breite) solid var(--sig-text);
  background: var(--panel);
}
.normierung p {
  margin-block: 0 var(--s-2);
}
.rangliste {
  list-style: none;
  margin: 0;
  padding: 0;
}
.rangkarte {
  padding-block: var(--s-4);
  border-top: var(--linien-breite) solid var(--line-strong);
}
.rangkopf {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--s-3);
  flex-wrap: wrap;
}
.rangkopf h2,
.stufe,
.rangwerte dd {
  font-family: var(--display);
  font-weight: 400;
  font-size: var(--t-zahl-m);
  line-height: var(--t-zahl-m-zh);
}
.rangkopf h2,
.stufe {
  margin: 0;
}
.stufe {
  color: var(--sig-text);
}
.rangwerte,
.rang-herleitung dl {
  display: grid;
  gap: var(--s-3);
  margin-block: var(--s-4);
}
.rangwerte {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--formular-spalte)), 1fr));
}
.rangwerte div,
.rang-herleitung dl div {
  min-width: 0;
  border-bottom: var(--linien-breite) solid var(--line);
  padding-bottom: var(--s-2);
}
.rangwerte dt,
.rang-herleitung dt {
  color: var(--bone-dim);
}
.rangwerte dd,
.rang-herleitung dd {
  margin: 0;
  overflow-wrap: anywhere;
}
.rangwerte dd,
.rang-herleitung dd {
  font-family: var(--mono);
  font-variant-numeric: tabular-nums;
}
.rang-herleitung summary {
  min-height: var(--treffer-min);
  display: flex;
  align-items: center;
  cursor: pointer;
  font-family: var(--body);
}
.methodenhinweis {
  margin-top: var(--s-5);
  padding-top: var(--s-4);
  border-top: var(--linien-breite) solid var(--line-strong);
}
</style>
