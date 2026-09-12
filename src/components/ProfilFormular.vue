<script setup>
import { computed, reactive, ref } from 'vue'
import { REGELN, zielBerechnen } from '../lib/ernaehrung.js'
import { lokalesDatum } from '../lib/darstellung.js'
import { useProfil } from '../composables/useProfil.js'
import ZielHerleitung from './ZielHerleitung.vue'
import DatumFeld from './DatumFeld.vue'

const props = defineProps({ onboarding: Boolean })
const emit = defineEmits(['gespeichert'])
const { zustand, profilSpeichern } = useProfil()
const profil = zustand.profil
const heute = lokalesDatum()
const eingabe = reactive({
  geschlecht: profil?.geschlecht ?? '',
  geburtsdatum: profil?.geburtsdatum ?? '',
  groesseCm: profil?.groesseCm ?? '',
  gewichtKg: profil?.gewichtsverlauf?.at(-1)?.kg ?? '',
  aktivitaet: profil?.aktivitaet ?? REGELN.aktivitaeten[0],
  ziel: profil?.ziel ?? 'halten',
  aenderungsrateProzent: profil?.aenderungsrateProzent ?? REGELN.rateMin,
  hinweisBestaetigt: profil?.hinweisBestaetigt ?? false,
})
const meldung = ref('')
const erfolgreich = ref(false)
const aktivitaetTexte = [
  'Überwiegend sitzend',
  'Leicht aktiv im Alltag',
  'Regelmässig aktiv',
  'Sehr aktiv im Alltag',
  'Körperlich sehr anstrengender Alltag',
]
const grenzen = REGELN.grenzen
const entwurf = computed(() => ({
  geschlecht: eingabe.geschlecht,
  geburtsdatum: eingabe.geburtsdatum,
  groesseCm: eingabe.groesseCm,
  aktivitaet: eingabe.aktivitaet,
  ziel: eingabe.ziel,
  aenderungsrateProzent: eingabe.aenderungsrateProzent,
  hinweisBestaetigt: eingabe.hinweisBestaetigt,
  gewichtsverlauf: [
    ...(profil?.gewichtsverlauf ?? []).filter((wert) => wert.datum !== heute),
    { datum: heute, kg: eingabe.gewichtKg },
  ].sort((a, b) => a.datum.localeCompare(b.datum)),
}))
const vorschau = computed(() => zielBerechnen({ ...entwurf.value, hinweisBestaetigt: true }, heute))
const vollstaendig = computed(
  () =>
    eingabe.geschlecht &&
    eingabe.geburtsdatum &&
    eingabe.groesseCm !== '' &&
    eingabe.gewichtKg !== ''
)
function speichern() {
  const ergebnis = profilSpeichern(entwurf.value, lokalesDatum())
  erfolgreich.value = ergebnis.status === 'ok'
  meldung.value = erfolgreich.value
    ? 'Profil gespeichert. Bereits angelegte Tage behalten ihr Ziel.'
    : ergebnis.meldung
  if (erfolgreich.value) emit('gespeichert')
}
</script>

<template>
  <form class="profil-formular" @submit.prevent="speichern" @input="meldung = ''">
    <fieldset class="formulargruppe">
      <legend><span class="register-index">01</span> Körperdaten</legend>
      <p class="klein">
        Die Angaben dienen einer rechnerischen Schätzung. Eingabegrenzen sind technische Grenzen,
        keine Gesundheitsbewertung.
      </p>
      <div class="formularraster">
        <label
          >Formelvariante<select v-model="eingabe.geschlecht" required>
            <option disabled value="">Auswählen</option>
            <option value="m">Männlich</option>
            <option value="w">Weiblich</option>
          </select></label
        >
        <label
          >Geburtsdatum<DatumFeld
            v-model="eingabe.geburtsdatum"
            min="1900-01-01"
            :max="heute"
            required
        /></label>
        <label
          >Körpergrösse (cm)<input
            v-model.number="eingabe.groesseCm"
            type="number"
            :min="grenzen.cmMin"
            :max="grenzen.cmMax"
            step="0.1"
            inputmode="decimal"
            required
        /></label>
        <label
          >Gewicht heute (kg)<input
            v-model.number="eingabe.gewichtKg"
            type="number"
            :min="grenzen.kgMin"
            :max="grenzen.kgMax"
            step="0.1"
            inputmode="decimal"
            required
        /></label>
      </div>
      <label
        >Aktivität<select v-model.number="eingabe.aktivitaet">
          <option v-for="(wert, index) in REGELN.aktivitaeten" :key="wert" :value="wert">
            {{ aktivitaetTexte[index] }}
          </option>
        </select></label
      >
    </fieldset>
    <fieldset class="formulargruppe">
      <legend><span class="register-index">02</span> Ziel und Tempo</legend>
      <label
        >Ziel<select v-model="eingabe.ziel">
          <option value="halten">Halten</option>
          <option value="abnehmen">Abnehmen</option>
          <option value="aufbauen">Aufbauen</option>
        </select></label
      >
      <p class="klein">
        Unter 18 Jahren ist Abnehmen nicht verfügbar. Halten und Aufbauen bleiben wählbar.
      </p>
      <label v-if="eingabe.ziel !== 'halten'"
        >Änderungsrate (% Körpergewicht pro Woche)<input
          v-model.number="eingabe.aenderungsrateProzent"
          type="number"
          :min="REGELN.rateMin"
          :max="REGELN.rateMax"
          step="any"
          inputmode="decimal"
          required
      /></label>
    </fieldset>
    <ZielHerleitung v-if="vollstaendig" :ergebnis="vorschau" />
    <p v-else class="klein">Nach Eingabe der Körperdaten erscheint hier die Zielberechnung.</p>
    <label class="bestaetigung"
      ><input v-model="eingabe.hinweisBestaetigt" type="checkbox" required /><span
        >Ich habe verstanden: Trackify ersetzt keine medizinische oder Ernährungsberatung. Die
        berechneten Ziele sind Schätzungen.</span
      ></label
    >
    <p v-if="zustand.hinweis" class="meldung" role="status">{{ zustand.hinweis }}</p>
    <p v-if="meldung" :class="erfolgreich ? 'statuszeile' : 'meldung'" role="status">
      {{ meldung }}
    </p>
    <button class="primaer" type="submit">
      {{ props.onboarding ? 'Profil speichern und beginnen' : 'Profil speichern' }}
    </button>
  </form>
</template>
