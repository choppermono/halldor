<script setup>
import { computed, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useProfil } from '../composables/useProfil.js'
import { naechsteProgrammEinheit, useTraining } from '../composables/useTraining.js'
import { einheitFortschritt, progressionBerechnen } from '../lib/training.js'

defineOptions({ name: 'TrainingAnsicht' })

const training = useTraining()
const profil = useProfil()
training.trainingLaden()
profil.profilLaden()
const formular = reactive({})
const meldung = ref('')
const uebungenNachId = new Map(training.uebungen.map((uebung) => [uebung.id, uebung]))

function programmEinheitFinden(einheit) {
  const programm = training.programme.find(
    (kandidat) => kandidat.id === einheit?.programmvariante?.id
  )
  return (
    programm?.einheiten.find((kandidat) => kandidat.id === einheit?.programmEinheit?.id) ?? null
  )
}

const planEinheit = computed(
  () =>
    programmEinheitFinden(training.offeneEinheit.value) ??
    naechsteProgrammEinheit(training.aktuellesProgramm.value, training.zustand.einheiten)
)
const planUebungen = computed(() =>
  (planEinheit.value?.uebungen ?? []).map((vorgabe) => ({
    ...vorgabe,
    uebung: uebungenNachId.get(vorgabe.uebungId),
  }))
)
const fortschritt = computed(() =>
  training.offeneEinheit.value
    ? einheitFortschritt(training.offeneEinheit.value, planEinheit.value)
    : {
        erfasst: 0,
        gesamt:
          planEinheit.value?.uebungen.reduce((summe, uebung) => summe + uebung.saetze, 0) ?? 0,
        anteil: 0,
        gesamtlastKg: 0,
      }
)

function feld(uebungId) {
  formular[uebungId] ??= {
    gewichtKg: '',
    wiederholungen: '',
    gewichtFehler: '',
    wiederholungenFehler: '',
  }
  return formular[uebungId]
}
function erfassteSaetze(uebungId) {
  return training.offeneEinheit.value?.saetze.filter((satz) => satz.uebungId === uebungId) ?? []
}
function naechsteVorgabe(vorgabe, uebung) {
  return progressionBerechnen({
    uebung,
    vorgabe,
    einheiten: training.zustand.einheiten,
    ziel: profil.zustand.profil?.ziel,
  })
}
function programmSetzen(ereignis) {
  const ergebnis = training.programmWaehlen(ereignis.target.value)
  meldung.value = ergebnis.status === 'ok' ? 'Programmvariante gespeichert.' : ergebnis.meldung
}
function starten() {
  const ergebnis = training.einheitStarten()
  meldung.value =
    ergebnis.status === 'ok'
      ? `${ergebnis.einheit.programmEinheit.name} gestartet.`
      : ergebnis.meldung
}
function satzErfassen(uebungId) {
  const eingabe = feld(uebungId)
  eingabe.gewichtFehler = ''
  eingabe.wiederholungenFehler = ''
  const ergebnis = training.satzHinzufuegen(
    training.offeneEinheit.value?.id,
    uebungId,
    Number(eingabe.gewichtKg),
    Number(eingabe.wiederholungen)
  )
  if (ergebnis.status === 'ok') {
    eingabe.wiederholungen = ''
    meldung.value = 'Satz gespeichert.'
    return
  }
  if (ergebnis.feld === 'gewicht') eingabe.gewichtFehler = ergebnis.meldung
  else if (ergebnis.feld === 'wiederholungen') eingabe.wiederholungenFehler = ergebnis.meldung
  else meldung.value = ergebnis.meldung
}
function satzLoeschen(satzId) {
  const ergebnis = training.satzLoeschen(training.offeneEinheit.value?.id, satzId)
  meldung.value = ergebnis.status === 'ok' ? 'Satz gelöscht.' : ergebnis.meldung
}
function abschliessen() {
  const ergebnis = training.einheitAbschliessen(training.offeneEinheit.value?.id)
  meldung.value = ergebnis.status === 'ok' ? 'Einheit abgeschlossen.' : ergebnis.meldung
}
</script>

<template>
  <section class="ansicht training" aria-labelledby="training-titel">
    <p class="system-label seitenrubrik">Training / Protokoll</p>
    <h1 id="training-titel">Training.</h1>
    <p class="einleitung">
      Erfasse die tatsächlich ausgeführten Sätze. Die nächste Vorgabe folgt nachvollziehbar aus
      diesen Daten; sie ist keine persönliche Trainingsempfehlung.
    </p>

    <template v-if="!profil.zustand.profil">
      <p class="leerzustand">Erfasse zuerst dein Profil und ein Körpergewicht.</p>
      <RouterLink class="knopf primaer" to="/onboarding">Profil einrichten</RouterLink>
    </template>

    <template v-else>
      <section class="programmwahl" aria-labelledby="programm-titel">
        <p class="system-label">Programmvariante</p>
        <h2 id="programm-titel">{{ training.aktuellesProgramm.value.name }}</h2>
        <label v-if="training.programme.length > 1">
          Trainingstage pro Woche
          <select
            :value="training.zustand.programmId"
            :disabled="Boolean(training.offeneEinheit.value)"
            @change="programmSetzen"
          >
            <option v-for="programm in training.programme" :key="programm.id" :value="programm.id">
              {{ programm.name }}
            </option>
          </select>
        </label>
        <p class="klein">
          {{ training.aktuellesProgramm.value.beschreibung }} Die Einheiten wechseln der Reihe nach.
        </p>
      </section>

      <section class="einheitskopf" aria-labelledby="einheit-titel">
        <div>
          <p class="system-label">
            {{ training.offeneEinheit.value ? 'Aktuelle Einheit' : 'Als Nächstes' }}
          </p>
          <h2 id="einheit-titel" class="einheitsname">{{ planEinheit?.name }}</h2>
        </div>
        <button v-if="!training.offeneEinheit.value" class="primaer" @click="starten">
          Einheit starten
        </button>
      </section>

      <div class="fortschritt" aria-live="polite">
        <div>
          <span class="system-label">Fortschritt</span>
          <strong class="trainingszahl"
            >{{ fortschritt.erfasst }} / {{ fortschritt.gesamt }}</strong
          >
          <span>Sätze</span>
        </div>
        <div>
          <span class="system-label">Gesamtlast</span>
          <strong class="trainingszahl">{{
            fortschritt.gesamtlastKg.toLocaleString('de-CH')
          }}</strong>
          <span>kg</span>
        </div>
        <progress :value="fortschritt.erfasst" :max="fortschritt.gesamt || 1">
          {{ Math.round(fortschritt.anteil) }} %
        </progress>
      </div>

      <ol class="uebungsliste staffel">
        <li v-for="(vorgabe, index) in planUebungen" :key="vorgabe.uebungId" class="uebung">
          <header class="uebungskopf">
            <span class="system-label">{{ String(index + 1).padStart(2, '0') }}</span>
            <div>
              <h2 class="uebungsname">{{ vorgabe.uebung.name }}</h2>
              <p class="messwert">
                {{ vorgabe.saetze }} Sätze · {{ vorgabe.min }}–{{ vorgabe.max }} Wiederholungen
              </p>
            </div>
          </header>
          <div class="vorgabe">
            <p class="system-label">Nächste Erfassung</p>
            <p>
              <strong class="trainingszahl">
                {{
                  naechsteVorgabe(vorgabe, vorgabe.uebung).gewichtKg === null
                    ? 'Last offen'
                    : `${naechsteVorgabe(vorgabe, vorgabe.uebung).gewichtKg.toLocaleString('de-CH')} kg`
                }}
              </strong>
              · {{ naechsteVorgabe(vorgabe, vorgabe.uebung).wiederholungen }} Wiederholungen
            </p>
            <p class="klein">{{ naechsteVorgabe(vorgabe, vorgabe.uebung).meldung }}</p>
          </div>

          <form
            v-if="training.offeneEinheit.value"
            class="satzformular"
            @submit.prevent="satzErfassen(vorgabe.uebungId)"
          >
            <label :for="`${vorgabe.uebungId}-gewicht`">
              Gewicht (kg)
              <input
                :id="`${vorgabe.uebungId}-gewicht`"
                v-model.number="feld(vorgabe.uebungId).gewichtKg"
                type="number"
                inputmode="decimal"
                min="0.1"
                max="1000"
                step="0.1"
                required
                :aria-describedby="`${vorgabe.uebungId}-gewicht-hinweis ${vorgabe.uebungId}-gewicht-fehler`"
              />
              <span :id="`${vorgabe.uebungId}-gewicht-hinweis`" class="klein">
                {{ vorgabe.uebung.gewichtshinweis }}
              </span>
              <span
                v-if="feld(vorgabe.uebungId).gewichtFehler"
                :id="`${vorgabe.uebungId}-gewicht-fehler`"
                class="feldfehler"
              >
                {{ feld(vorgabe.uebungId).gewichtFehler }}
              </span>
            </label>
            <label :for="`${vorgabe.uebungId}-wdh`">
              Wiederholungen
              <input
                :id="`${vorgabe.uebungId}-wdh`"
                v-model.number="feld(vorgabe.uebungId).wiederholungen"
                type="number"
                inputmode="numeric"
                min="1"
                max="100"
                step="1"
                required
                :aria-describedby="`${vorgabe.uebungId}-wdh-fehler`"
              />
              <span
                v-if="feld(vorgabe.uebungId).wiederholungenFehler"
                :id="`${vorgabe.uebungId}-wdh-fehler`"
                class="feldfehler"
              >
                {{ feld(vorgabe.uebungId).wiederholungenFehler }}
              </span>
            </label>
            <button type="submit">Satz erfassen</button>
          </form>

          <ul v-if="erfassteSaetze(vorgabe.uebungId).length" class="satzliste">
            <li v-for="(satz, satzIndex) in erfassteSaetze(vorgabe.uebungId)" :key="satz.id">
              <span class="messwert">
                Satz {{ satzIndex + 1 }} · {{ satz.gewichtKg.toLocaleString('de-CH') }} kg ×
                {{ satz.wiederholungen }}
              </span>
              <button
                :aria-label="`${vorgabe.uebung.name}, Satz ${satzIndex + 1} löschen`"
                @click="satzLoeschen(satz.id)"
              >
                Löschen
              </button>
            </li>
          </ul>
        </li>
      </ol>

      <button v-if="training.offeneEinheit.value" class="primaer abschluss" @click="abschliessen">
        Einheit abschliessen
      </button>
      <p v-if="meldung" class="statuszeile" role="status">{{ meldung }}</p>
      <p v-if="training.zustand.hinweis || profil.zustand.hinweis" class="meldung" role="status">
        {{ training.zustand.hinweis || profil.zustand.hinweis }}
      </p>
    </template>
  </section>
</template>

<style scoped>
.training {
  font-family: var(--body);
}
.programmwahl,
.einheitskopf,
.fortschritt,
.uebung {
  border-top: var(--linien-breite) solid var(--line-strong);
  padding-block: var(--s-4);
}
.programmwahl label {
  display: grid;
  gap: var(--s-2);
  margin-block: var(--s-3);
}
.einheitskopf,
.uebungskopf,
.satzliste li {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--s-3);
  flex-wrap: wrap;
}
.einheitsname,
.uebungsname,
.trainingszahl {
  font-family: var(--display);
  font-weight: 400;
}
.einheitsname,
.uebungsname {
  font-size: var(--t-zahl-m);
}
.einheitsname,
.uebungsname,
.vorgabe p,
.satzliste {
  margin: 0;
}
.fortschritt {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--s-4);
}
.fortschritt > div {
  display: grid;
  gap: var(--s-1);
  min-width: 0;
}
.trainingszahl {
  font-size: var(--t-zahl-m);
  line-height: var(--t-zahl-m-zh);
}
.fortschritt progress {
  grid-column: 1 / -1;
  width: 100%;
  accent-color: var(--sig-fill);
}
.uebungsliste,
.satzliste {
  list-style: none;
  padding: 0;
}
.uebungsliste {
  margin: 0;
}
.uebungskopf > div {
  flex: 1;
  min-width: 0;
}
.messwert {
  font-family: var(--mono);
  font-variant-numeric: tabular-nums;
}
.vorgabe {
  margin-block: var(--s-3);
  padding-left: var(--s-3);
  border-left: var(--markierungs-breite) solid var(--sig-text);
}
.satzformular {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--s-3);
  margin-top: var(--s-4);
}
.satzformular label {
  display: grid;
  align-content: start;
  gap: var(--s-2);
  min-width: 0;
}
.satzformular button {
  grid-column: 1 / -1;
}
.feldfehler {
  color: var(--farbe-fehler);
}
.satzliste {
  margin-top: var(--s-3);
  border-top: var(--linien-breite) solid var(--line);
}
.satzliste li {
  align-items: center;
  padding-block: var(--s-2);
  border-bottom: var(--linien-breite) solid var(--line);
}
.satzliste button {
  flex-shrink: 0;
}
.abschluss {
  width: min(100%, var(--aktion-breite));
  margin-top: var(--s-4);
}
@media (max-width: 28rem) {
  .satzformular {
    grid-template-columns: minmax(0, 1fr);
  }
  .satzformular button {
    grid-column: auto;
  }
}
</style>
