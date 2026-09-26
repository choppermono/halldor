<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import Zahlenschritt from '../components/Zahlenschritt.vue'
import { useProfil } from '../composables/useProfil.js'
import { naechsteProgrammEinheit, useTraining } from '../composables/useTraining.js'
import { einheitFortschritt, progressionBerechnen, schrittFuer } from '../lib/training.js'

defineOptions({ name: 'TrainingAnsicht' })

const training = useTraining()
const profil = useProfil()
training.trainingLaden()
profil.profilLaden()

const meldung = ref('')
const zuletztBestaetigt = ref('')
const anpassung = ref(null)
const hauptknopf = ref(null)
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
    : { erfasst: 0, gesamt: planUebungen.value.reduce((summe, uebung) => summe + uebung.saetze, 0) }
)
const aktiveNummer = computed(() => {
  if (!training.offeneEinheit.value) return 0
  const index = planUebungen.value.findIndex(
    (vorgabe) => erfassteSaetze(vorgabe.uebungId).length < vorgabe.saetze
  )
  return index === -1 ? planUebungen.value.length : index
})
const aktiveVorgabe = computed(() => planUebungen.value[aktiveNummer.value] ?? null)
const aktuellerSatz = computed(() =>
  aktiveVorgabe.value ? erfassteSaetze(aktiveVorgabe.value.uebungId).length + 1 : null
)
const vorgabeHeute = computed(() => {
  const aktiv = aktiveVorgabe.value
  if (!aktiv) return null
  return progressionBerechnen({
    uebung: aktiv.uebung,
    vorgabe: aktiv,
    einheiten: training.zustand.einheiten,
    ziel: profil.zustand.profil?.ziel,
  })
})
// Innerhalb der Einheit gilt die Last des vorherigen Satzes als Vorgabe: wer
// Satz 1 auf 42.5 kg angepasst hat, will Satz 2 nicht wieder zurückstellen.
// Die Wiederholungen bleiben das Ziel aus der Progression.
const satzVorgabe = computed(() => {
  const aktiv = aktiveVorgabe.value
  if (!aktiv || !vorgabeHeute.value) return null
  const vorsatz = erfassteSaetze(aktiv.uebungId).at(-1)
  return {
    gewichtKg: vorsatz?.gewichtKg ?? vorgabeHeute.value.gewichtKg,
    wiederholungen: vorgabeHeute.value.wiederholungen,
  }
})
const lastBekannt = computed(() => Number.isFinite(satzVorgabe.value?.gewichtKg))
// Nur beim allerersten Satz einer Übung fehlt jede Last. Dann steht die
// Startlast direkt als Bedienelement da, statt hinter «Anpassen».
const startlast = ref('')
watch(
  () => aktiveVorgabe.value?.uebungId,
  () => {
    startlast.value = ''
  }
)
const startlastGueltig = computed(
  () => Number.isFinite(Number(startlast.value)) && Number(startlast.value) > 0
)
const erledigteUebungen = computed(
  () =>
    planUebungen.value.filter(
      (vorgabe) => erfassteSaetze(vorgabe.uebungId).length >= vorgabe.saetze
    ).length
)
const vorherigeSaetze = computed(() => {
  const id = aktiveVorgabe.value?.uebungId
  if (!id) return []
  return (
    [...training.zustand.einheiten]
      .filter((einheit) => einheit.abgeschlossenAm)
      .sort((a, b) => Date.parse(a.abgeschlossenAm) - Date.parse(b.abgeschlossenAm))
      .reverse()
      .find((einheit) => einheit.saetze?.some((satz) => satz.uebungId === id))
      ?.saetze.filter((satz) => satz.uebungId === id) ?? []
  )
})

function erfassteSaetze(uebungId) {
  return training.offeneEinheit.value?.saetze.filter((satz) => satz.uebungId === uebungId) ?? []
}
function satzText(satz, mitEinheit = false) {
  return `${satz.gewichtKg.toLocaleString('de-CH')}${mitEinheit ? ' kg' : ''} × ${satz.wiederholungen}`
}
function planText(vorgabe) {
  return `${vorgabe.saetze} × ${vorgabe.min}–${vorgabe.max}`
}
function statusFuer(index, vorgabe) {
  const anzahl = erfassteSaetze(vorgabe.uebungId).length
  if (anzahl >= vorgabe.saetze) return 'erledigt'
  if (index === aktiveNummer.value) return 'aktiv'
  return 'zukuenftig'
}
function fokusZurueckgeben() {
  nextTick(() => hauptknopf.value?.focus({ preventScroll: true }))
}
function starten() {
  const ergebnis = training.einheitStarten()
  meldung.value =
    ergebnis.status === 'ok'
      ? `${ergebnis.einheit.programmEinheit.name} gestartet.`
      : ergebnis.meldung
  if (ergebnis.status === 'ok') fokusZurueckgeben()
}
function erfassen(gewichtKg, wiederholungen) {
  const aktiv = aktiveVorgabe.value
  if (!aktiv) return
  const satzNummer = aktuellerSatz.value
  const ergebnis = training.satzHinzufuegen(
    training.offeneEinheit.value?.id,
    aktiv.uebungId,
    Number(gewichtKg),
    Number(wiederholungen)
  )
  if (ergebnis.status !== 'ok') {
    meldung.value = ergebnis.meldung
    return
  }
  zuletztBestaetigt.value = ergebnis.satz.id
  meldung.value = `${aktiv.uebung.name}, Satz ${satzNummer} mit ${satzText(ergebnis.satz, true)} erfasst.`
  anpassung.value = null
  fokusZurueckgeben()
}
function vorgabeBestaetigen() {
  if (!lastBekannt.value) {
    if (startlastGueltig.value) erfassen(startlast.value, satzVorgabe.value.wiederholungen)
    return
  }
  erfassen(satzVorgabe.value.gewichtKg, satzVorgabe.value.wiederholungen)
}
function anpassenOeffnen(satz = null, vorgabe = aktiveVorgabe.value, satzIndex = null) {
  const basis = satz ?? (vorgabe === aktiveVorgabe.value ? satzVorgabe.value : null)
  anpassung.value = {
    satz,
    vorgabe,
    satzNummer: satzIndex ?? aktuellerSatz.value,
    gewichtKg: satz?.gewichtKg ?? basis?.gewichtKg ?? '',
    wiederholungen: satz?.wiederholungen ?? basis?.wiederholungen ?? vorgabe.min,
  }
}
function anpassungAbbrechen() {
  anpassung.value = null
  fokusZurueckgeben()
}
function anpassungBestaetigen() {
  erfassen(anpassung.value.gewichtKg, Math.round(Number(anpassung.value.wiederholungen)))
}
function satzEntfernen() {
  const entfernt = anpassung.value?.satz
  if (!entfernt) return
  const ergebnis = training.satzEntfernen(training.offeneEinheit.value?.id, entfernt.id)
  meldung.value =
    ergebnis.status === 'ok'
      ? `${anpassung.value.vorgabe.uebung.name}, Satz ${anpassung.value.satzNummer} gelöscht.`
      : ergebnis.meldung
  anpassung.value = null
  fokusZurueckgeben()
}
function abschliessen() {
  const name = training.offeneEinheit.value?.programmEinheit?.name
  const ergebnis = training.einheitAbschliessen(training.offeneEinheit.value?.id)
  meldung.value = ergebnis.status === 'ok' ? `${name} abgeschlossen.` : ergebnis.meldung
}
</script>

<template>
  <section class="ansicht training" aria-labelledby="training-titel">
    <h1 id="training-titel" class="nur-vorlesbar">Training</h1>

    <template v-if="!profil.zustand.profil">
      <p class="system-label seitenrubrik">Training / Einrichtung</p>
      <p class="leerzustand">Erfasse zuerst dein Profil und ein Körpergewicht.</p>
      <RouterLink class="knopf primaer" to="/onboarding">Profil einrichten</RouterLink>
    </template>

    <template v-else-if="!training.offeneEinheit.value">
      <header class="trainingsstart">
        <p class="system-label">Nächste Einheit</p>
        <h2>{{ planEinheit?.name }}.</h2>
        <p class="plan-meta">
          {{ planUebungen.length }} Übungen · {{ fortschritt.gesamt }} Sätze · danach
          {{ planEinheit?.id === 'ok' ? 'Unterkörper' : 'Oberkörper' }}
        </p>
      </header>
      <div class="rhythmus" aria-label="Trainingsrhythmus: Oberkörper, Unterkörper, Oberkörper">
        <span></span><span></span><span></span>
      </div>
      <ol class="planliste">
        <li v-for="vorgabe in planUebungen.slice(0, 4)" :key="vorgabe.uebungId">
          <span>{{ vorgabe.uebung.name }}</span
          ><span>{{ planText(vorgabe) }}</span>
        </li>
      </ol>
      <!-- Der ganze Plan ist da, aber erst auf Wunsch: der Startknopf soll ohne
           Scrollen erreichbar sein. -->
      <details v-if="planUebungen.length > 4" class="plan-rest">
        <summary>+ {{ planUebungen.length - 4 }} weitere Übungen</summary>
        <ol class="planliste">
          <li v-for="vorgabe in planUebungen.slice(4)" :key="vorgabe.uebungId">
            <span>{{ vorgabe.uebung.name }}</span
            ><span>{{ planText(vorgabe) }}</span>
          </li>
        </ol>
      </details>
      <button ref="hauptknopf" class="primaer trainings-hauptknopf" @click="starten">
        Einheit starten
      </button>
    </template>

    <template v-else>
      <header class="trainingsstatus">
        <span
          >{{ planEinheit?.name }} · Übung {{ Math.min(aktiveNummer + 1, planUebungen.length) }}/{{
            planUebungen.length
          }}</span
        >
        <span>Satz {{ fortschritt.erfasst }}/{{ fortschritt.gesamt }}</span>
      </header>
      <div
        class="uebungsfortschritt"
        role="progressbar"
        :aria-valuenow="Math.min(aktiveNummer + 1, planUebungen.length)"
        aria-valuemin="1"
        :aria-valuemax="planUebungen.length"
        :aria-label="`Übung ${Math.min(aktiveNummer + 1, planUebungen.length)} von ${planUebungen.length}`"
      >
        <span
          :style="{
            transform: `scaleX(${planUebungen.length ? aktiveNummer / planUebungen.length : 0})`,
          }"
        ></span>
      </div>

      <div class="training-arbeitsflaeche">
        <section
          class="training-ablauf"
          :class="{ 'hat-erledigte': erledigteUebungen > 0 }"
          aria-label="Ablauf der Einheit"
        >
          <p class="system-label">Ablauf</p>
          <ol>
            <li
              v-for="(vorgabe, index) in planUebungen"
              :key="vorgabe.uebungId"
              :class="statusFuer(index, vorgabe)"
            >
              <svg
                v-if="statusFuer(index, vorgabe) === 'erledigt'"
                class="satz-haken"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M4 12.5 9.5 18 20 6" />
              </svg>
              <span v-else class="ablauf-marker" aria-hidden="true"></span>
              <span class="ablauf-name">{{ vorgabe.uebung.name }}</span>
              <span v-if="statusFuer(index, vorgabe) !== 'erledigt'" class="ablauf-plan">{{
                planText(vorgabe)
              }}</span>
              <span v-else class="ablauf-saetze">
                <button
                  v-for="(satz, satzIndex) in erfassteSaetze(vorgabe.uebungId)"
                  :key="satz.id"
                  type="button"
                  :aria-label="`${vorgabe.uebung.name}, Satz ${satzIndex + 1}, ${satzText(satz, true)} anpassen`"
                  @click="anpassenOeffnen(satz, vorgabe, satzIndex + 1)"
                >
                  {{ satzText(satz) }}
                </button>
              </span>
            </li>
          </ol>
        </section>

        <section v-if="anpassung" class="satz-anpassung" aria-labelledby="anpassung-titel">
          <p class="system-label">Satz {{ anpassung.satzNummer }} anpassen</p>
          <h2 id="anpassung-titel">{{ anpassung.vorgabe.uebung.name }}</h2>
          <p class="anpassung-hinweis">
            {{
              anpassung.satz
                ? 'Erfassten Satz rückgängig machen.'
                : 'Nur wenn du vom Plan abweichst. Zahl antippen, um sie direkt einzugeben.'
            }}
          </p>
          <template v-if="!anpassung.satz">
            <div class="anpassung-block">
              <div class="anpassung-kopf">
                <span class="system-label">Gewicht</span
                ><span
                  >Schritt
                  {{ schrittFuer(anpassung.vorgabe.uebung).toLocaleString('de-CH') }} kg</span
                >
              </div>
              <Zahlenschritt
                v-model="anpassung.gewichtKg"
                name="Gewicht"
                einheit="kg"
                :schritt="schrittFuer(anpassung.vorgabe.uebung)"
                :min="0.1"
                :max="1000"
              />
            </div>
            <div class="anpassung-block">
              <div class="anpassung-kopf">
                <span class="system-label">Wiederholungen</span
                ><span>Fenster {{ anpassung.vorgabe.min }}–{{ anpassung.vorgabe.max }}</span>
              </div>
              <Zahlenschritt
                v-model="anpassung.wiederholungen"
                name="Wiederholungen"
                einheit="Wdh"
                :schritt="1"
                :min="1"
                :max="100"
                inputmode="numeric"
              />
            </div>
            <button
              class="primaer trainings-hauptknopf"
              :disabled="
                !Number.isFinite(Number(anpassung.gewichtKg)) || Number(anpassung.gewichtKg) <= 0
              "
              @click="anpassungBestaetigen"
            >
              {{ Number(anpassung.gewichtKg).toLocaleString('de-CH') }} kg ×
              {{ anpassung.wiederholungen }} erfassen
            </button>
          </template>
          <button v-else class="satz-loeschen" type="button" @click="satzEntfernen">
            Satz löschen
          </button>
          <button class="leiser-knopf" type="button" @click="anpassungAbbrechen">Abbrechen</button>
        </section>

        <section
          v-else-if="aktiveVorgabe"
          :key="aktiveVorgabe.uebungId"
          class="uebungsfokus"
          aria-labelledby="fokus-titel"
        >
          <p class="system-label">
            Übung {{ aktiveNummer + 1 }} · {{ planText(aktiveVorgabe) }} Wdh
          </p>
          <h2 id="fokus-titel">{{ aktiveVorgabe.uebung.name }}</h2>
          <p class="letztes-mal">
            <template v-if="vorherigeSaetze.length"
              >Letztes Mal {{ vorherigeSaetze.map((satz) => satzText(satz)).join(' · ') }} → heute
              {{ satzVorgabe.gewichtKg.toLocaleString('de-CH') }} kg</template
            >
            <template v-else-if="lastBekannt"
              >Erste Einheit · weiter mit
              {{ satzVorgabe.gewichtKg.toLocaleString('de-CH') }} kg</template
            >
            <template v-else>Erste Einheit · Startlast wählen</template>
          </p>

          <div class="fokus-saetze">
            <button
              v-for="(satz, satzIndex) in erfassteSaetze(aktiveVorgabe.uebungId)"
              :key="satz.id"
              type="button"
              class="erfasster-satz"
              :class="{ 'gerade-erfasst': satz.id === zuletztBestaetigt }"
              :aria-label="`Satz ${satzIndex + 1}, ${satzText(satz, true)} anpassen`"
              @click="anpassenOeffnen(satz, aktiveVorgabe, satzIndex + 1)"
            >
              <span class="system-label">Satz {{ satzIndex + 1 }}</span>
              <strong>{{ satzText(satz, true) }}</strong>
              <svg class="satz-haken" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 12.5 9.5 18 20 6" />
              </svg>
            </button>
            <div v-if="lastBekannt" class="naechster-satz">
              <span class="system-label satz-marke">Satz {{ aktuellerSatz }}</span>
              <strong
                >{{ satzVorgabe.gewichtKg.toLocaleString('de-CH') }} <small>kg</small> ×
                {{ satzVorgabe.wiederholungen }}</strong
              >
              <button class="anpassen-link" type="button" @click="anpassenOeffnen()">
                Anpassen
              </button>
            </div>
            <div v-else class="startlast">
              <div class="anpassung-kopf">
                <span class="system-label satz-marke">Satz {{ aktuellerSatz }} · Startlast</span>
                <span>Ziel {{ satzVorgabe?.wiederholungen }} Wdh</span>
              </div>
              <Zahlenschritt
                v-model="startlast"
                name="Startlast"
                einheit="kg"
                :schritt="schrittFuer(aktiveVorgabe.uebung)"
                :min="schrittFuer(aktiveVorgabe.uebung)"
                :max="1000"
              />
            </div>
          </div>
          <button
            ref="hauptknopf"
            class="primaer trainings-hauptknopf"
            :disabled="!lastBekannt && !startlastGueltig"
            @click="vorgabeBestaetigen"
          >
            Satz {{ aktuellerSatz }} erledigt
          </button>

          <div v-if="aktiveNummer + 1 < planUebungen.length" class="als-naechstes">
            <p class="system-label">Als Nächstes</p>
            <ul>
              <li
                v-for="vorgabe in planUebungen.slice(aktiveNummer + 1, aktiveNummer + 4)"
                :key="vorgabe.uebungId"
              >
                <span>{{ vorgabe.uebung.name }}</span
                ><span>{{ planText(vorgabe) }}</span>
              </li>
            </ul>
            <p v-if="planUebungen.length - aktiveNummer - 4 > 0" class="weitere">
              + {{ planUebungen.length - aktiveNummer - 4 }} weitere
            </p>
          </div>
        </section>

        <section v-else class="einheit-abschluss" aria-labelledby="abschluss-titel">
          <p class="system-label">Einheit vollständig erfasst</p>
          <h2 id="abschluss-titel">{{ planEinheit?.name }}.</h2>
          <p>
            {{ fortschritt.erfasst }} Sätze sind gespeichert. Schliesse die Einheit jetzt bewusst
            ab.
          </p>
          <button ref="hauptknopf" class="primaer trainings-hauptknopf" @click="abschliessen">
            Einheit abschliessen
          </button>
        </section>
      </div>
    </template>

    <div class="nur-vorlesbar" role="status" aria-live="polite" aria-atomic="true">
      {{ meldung }}
    </div>
    <p v-if="training.zustand.hinweis || profil.zustand.hinweis" class="meldung" role="status">
      {{ training.zustand.hinweis || profil.zustand.hinweis }}
    </p>
  </section>
</template>
