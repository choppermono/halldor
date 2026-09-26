<script setup>
import { computed, reactive, ref } from 'vue'
import {
  REGELN,
  alterBerechnen,
  grundumsatzBerechnen,
  zielBerechnen,
  zielPruefen,
} from '../lib/ernaehrung.js'
import { lokalesDatum } from '../lib/darstellung.js'
import { useProfil } from '../composables/useProfil.js'
import ZielHerleitung from './ZielHerleitung.vue'
import DatumFeld from './DatumFeld.vue'
import Zahlenschritt from './Zahlenschritt.vue'

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
const schritt = ref(0)
const aktivitaetTexte = [
  'Überwiegend sitzend',
  'Leicht aktiv im Alltag',
  'Regelmässig aktiv',
  'Sehr aktiv im Alltag',
  'Körperlich sehr anstrengender Alltag',
]
const grenzen = REGELN.grenzen
const alter = computed(() => alterBerechnen(eingabe.geburtsdatum, heute))
const schritte = computed(() => [
  'formel',
  'geburtsdatum',
  'groesse',
  'gewicht',
  'aktivitaet',
  'ziel',
  ...(eingabe.ziel === 'halten' ? [] : ['rate']),
  'hinweis',
  'ergebnis',
])
const aktuellerSchritt = computed(() => schritte.value[schritt.value])
const entwurf = computed(() => ({
  geschlecht: eingabe.geschlecht,
  geburtsdatum: eingabe.geburtsdatum,
  groesseCm: Number(eingabe.groesseCm),
  aktivitaet: Number(eingabe.aktivitaet),
  ziel: eingabe.ziel,
  aenderungsrateProzent: Number(eingabe.aenderungsrateProzent),
  hinweisBestaetigt: eingabe.hinweisBestaetigt,
  gewichtsverlauf: [
    ...(profil?.gewichtsverlauf ?? []).filter((wert) => wert.datum !== heute),
    { datum: heute, kg: Number(eingabe.gewichtKg) },
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

function auswaehlen(feld, wert) {
  eingabe[feld] = wert
  meldung.value = ''
}
function schrittPruefen() {
  const name = aktuellerSchritt.value
  if (name === 'formel' && !['m', 'w'].includes(eingabe.geschlecht))
    return 'Wähle die Formelvariante männlich oder weiblich.'
  if (name === 'geburtsdatum') {
    const ergebnis = alterBerechnen(eingabe.geburtsdatum, heute)
    if (ergebnis.status !== 'ok') return ergebnis.meldung
  }
  if (name === 'groesse') {
    const wert = Number(eingabe.groesseCm)
    if (!Number.isFinite(wert) || wert < grenzen.cmMin || wert > grenzen.cmMax)
      return 'Die Körpergrösse liegt ausserhalb der Eingabegrenzen.'
  }
  if (name === 'gewicht') {
    const ergebnis = grundumsatzBerechnen({
      geschlecht: eingabe.geschlecht,
      geburtsdatum: eingabe.geburtsdatum,
      groesseCm: Number(eingabe.groesseCm),
      gewichtKg: Number(eingabe.gewichtKg),
      stichtag: heute,
    })
    if (ergebnis.status !== 'ok') return ergebnis.meldung
  }
  if (name === 'aktivitaet' && !REGELN.aktivitaeten.includes(Number(eingabe.aktivitaet)))
    return 'Wähle eine Aktivitätsstufe.'
  if (name === 'ziel') {
    const ergebnis = zielPruefen(eingabe.ziel, alter.value.wert)
    if (ergebnis.status !== 'ok') return ergebnis.meldung
  }
  if (name === 'rate') {
    const ergebnis = vorschau.value
    if (ergebnis.status !== 'ok') return ergebnis.meldung
  }
  if (name === 'hinweis' && !eingabe.hinweisBestaetigt)
    return 'Bestätige den Hinweis zur Schätzung.'
  return ''
}
function weiter() {
  const fehler = schrittPruefen()
  if (fehler) {
    meldung.value = fehler
    return
  }
  meldung.value = ''
  schritt.value = Math.min(schritt.value + 1, schritte.value.length - 1)
}
function zurueck() {
  meldung.value = ''
  schritt.value = Math.max(0, schritt.value - 1)
}
function speichern() {
  const ergebnis = profilSpeichern(entwurf.value, heute)
  erfolgreich.value = ergebnis.status === 'ok'
  meldung.value = erfolgreich.value
    ? 'Profil gespeichert. Bereits angelegte Tage behalten ihr Ziel.'
    : ergebnis.meldung
  if (erfolgreich.value) emit('gespeichert')
}
</script>

<template>
  <form
    class="profil-formular"
    :class="{ 'onboarding-formular': props.onboarding }"
    @submit.prevent="speichern"
    @input="meldung = ''"
  >
    <template v-if="props.onboarding">
      <div class="onboarding-stand">
        <span>Schritt {{ schritt + 1 }} / {{ schritte.length }}</span>
        <div aria-hidden="true"><span :style="{ transform: `scaleX(${(schritt + 1) / schritte.length})` }"></span></div>
      </div>

      <fieldset v-if="aktuellerSchritt === 'formel'" class="onboarding-frage">
        <legend>Welche Formelvariante passt?</legend>
        <p>Die Auswahl setzt nur den Konstantenwert in Mifflin-St Jeor.</p>
        <div class="auswahlkarten">
          <label v-for="option in [{ wert: 'm', text: 'Männlich' }, { wert: 'w', text: 'Weiblich' }]" :key="option.wert" :class="{ gewaehlt: eingabe.geschlecht === option.wert }">
            <input v-model="eingabe.geschlecht" type="radio" name="geschlecht" :value="option.wert" />
            <span>{{ option.text }}</span>
          </label>
        </div>
      </fieldset>

      <fieldset v-else-if="aktuellerSchritt === 'geburtsdatum'" class="onboarding-frage">
        <legend>Wann bist du geboren?</legend>
        <p>Unter 18 Jahren ist ein Abnehmziel nicht verfügbar.</p>
        <label>Geburtsdatum<DatumFeld v-model="eingabe.geburtsdatum" min="1900-01-01" :max="heute" required /></label>
      </fieldset>

      <fieldset v-else-if="aktuellerSchritt === 'groesse'" class="onboarding-frage">
        <legend>Wie gross bist du?</legend>
        <Zahlenschritt v-model="eingabe.groesseCm" name="Körpergrösse" einheit="cm" :schritt="0.1" :min="grenzen.cmMin" :max="grenzen.cmMax" />
      </fieldset>

      <fieldset v-else-if="aktuellerSchritt === 'gewicht'" class="onboarding-frage">
        <legend>Was wiegst du heute?</legend>
        <Zahlenschritt v-model="eingabe.gewichtKg" name="Gewicht" einheit="kg" :schritt="0.1" :min="grenzen.kgMin" :max="grenzen.kgMax" />
      </fieldset>

      <fieldset v-else-if="aktuellerSchritt === 'aktivitaet'" class="onboarding-frage">
        <legend>Wie aktiv ist dein Alltag?</legend>
        <div class="auswahlkarten">
          <label v-for="(wert, index) in REGELN.aktivitaeten" :key="wert" :class="{ gewaehlt: eingabe.aktivitaet === wert }">
            <input v-model.number="eingabe.aktivitaet" type="radio" name="aktivitaet" :value="wert" />
            <span>{{ aktivitaetTexte[index] }}</span>
          </label>
        </div>
      </fieldset>

      <fieldset v-else-if="aktuellerSchritt === 'ziel'" class="onboarding-frage">
        <legend>Was ist dein Ziel?</legend>
        <p>Halten und Aufbauen bleiben in jedem unterstützten Alter verfügbar.</p>
        <div class="auswahlkarten">
          <label v-for="option in [{ wert: 'halten', text: 'Halten' }, { wert: 'aufbauen', text: 'Aufbauen' }, { wert: 'abnehmen', text: 'Abnehmen' }]" :key="option.wert" :class="{ gewaehlt: eingabe.ziel === option.wert, gesperrt: option.wert === 'abnehmen' && alter.wert < REGELN.abnehmenAb }">
            <input v-model="eingabe.ziel" type="radio" name="ziel" :value="option.wert" :disabled="option.wert === 'abnehmen' && alter.wert < REGELN.abnehmenAb" />
            <span>{{ option.text }}</span>
          </label>
        </div>
      </fieldset>

      <fieldset v-else-if="aktuellerSchritt === 'rate'" class="onboarding-frage">
        <legend>Wie schnell soll sich das Gewicht ändern?</legend>
        <p>Prozent des Körpergewichts pro Woche.</p>
        <Zahlenschritt v-model="eingabe.aenderungsrateProzent" name="Änderungsrate" einheit="%" :schritt="0.1" :min="REGELN.rateMin" :max="REGELN.rateMax" />
      </fieldset>

      <fieldset v-else-if="aktuellerSchritt === 'hinweis'" class="onboarding-frage">
        <legend>Schätzung verstanden?</legend>
        <label class="bestaetigung hinweis-karte">
          <input v-model="eingabe.hinweisBestaetigt" type="checkbox" required />
          <span>Trackify ersetzt keine medizinische oder Ernährungsberatung. Die berechneten Ziele sind Schätzungen.</span>
        </label>
      </fieldset>

      <section v-else class="onboarding-ergebnis" aria-labelledby="ergebnis-titel">
        <p class="system-label">Berechnung prüfen</p>
        <h2 id="ergebnis-titel">Deine Basis steht.</h2>
        <ZielHerleitung :ergebnis="vorschau" />
      </section>

      <p v-if="meldung" :class="erfolgreich ? 'statuszeile' : 'meldung'" role="status">{{ meldung }}</p>
      <div class="onboarding-aktionen">
        <button v-if="schritt > 0" type="button" class="leiser-knopf" @click="zurueck">Zurück</button>
        <button v-if="aktuellerSchritt !== 'ergebnis'" type="button" class="primaer" @click="weiter">Weiter</button>
        <button v-else class="primaer" type="submit">Profil speichern und beginnen</button>
      </div>
    </template>

    <template v-else>
      <fieldset class="formulargruppe">
        <legend>Körperdaten</legend>
        <div class="profil-auswahl">
          <span>Formelvariante</span>
          <div class="auswahlkarten kompakt">
            <label v-for="option in [{ wert: 'm', text: 'Männlich' }, { wert: 'w', text: 'Weiblich' }]" :key="option.wert" :class="{ gewaehlt: eingabe.geschlecht === option.wert }">
              <input v-model="eingabe.geschlecht" type="radio" name="profil-geschlecht" :value="option.wert" />
              <span>{{ option.text }}</span>
            </label>
          </div>
        </div>
        <label>Geburtsdatum<DatumFeld v-model="eingabe.geburtsdatum" min="1900-01-01" :max="heute" required /></label>
        <label>Körpergrösse<Zahlenschritt v-model="eingabe.groesseCm" name="Körpergrösse" einheit="cm" :schritt="0.1" :min="grenzen.cmMin" :max="grenzen.cmMax" /></label>
        <label>Gewicht heute<Zahlenschritt v-model="eingabe.gewichtKg" name="Gewicht" einheit="kg" :schritt="0.1" :min="grenzen.kgMin" :max="grenzen.kgMax" /></label>
      </fieldset>

      <fieldset class="formulargruppe">
        <legend>Aktivität und Ziel</legend>
        <div class="auswahlkarten">
          <label v-for="(wert, index) in REGELN.aktivitaeten" :key="wert" :class="{ gewaehlt: eingabe.aktivitaet === wert }">
            <input v-model.number="eingabe.aktivitaet" type="radio" name="profil-aktivitaet" :value="wert" />
            <span>{{ aktivitaetTexte[index] }}</span>
          </label>
        </div>
        <div class="auswahlkarten kompakt">
          <label v-for="option in [{ wert: 'halten', text: 'Halten' }, { wert: 'aufbauen', text: 'Aufbauen' }, { wert: 'abnehmen', text: 'Abnehmen' }]" :key="option.wert" :class="{ gewaehlt: eingabe.ziel === option.wert }">
            <input v-model="eingabe.ziel" type="radio" name="profil-ziel" :value="option.wert" />
            <span>{{ option.text }}</span>
          </label>
        </div>
        <label v-if="eingabe.ziel !== 'halten'">Änderungsrate<Zahlenschritt v-model="eingabe.aenderungsrateProzent" name="Änderungsrate" einheit="%" :schritt="0.1" :min="REGELN.rateMin" :max="REGELN.rateMax" /></label>
      </fieldset>
      <ZielHerleitung v-if="vollstaendig" :ergebnis="vorschau" />
      <p v-else class="klein">Nach Eingabe der Körperdaten erscheint hier die Zielberechnung.</p>
      <label class="bestaetigung hinweis-karte">
        <input v-model="eingabe.hinweisBestaetigt" type="checkbox" required />
        <span>Ich habe verstanden: Trackify ersetzt keine medizinische oder Ernährungsberatung. Die berechneten Ziele sind Schätzungen.</span>
      </label>
      <p v-if="zustand.hinweis" class="meldung" role="status">{{ zustand.hinweis }}</p>
      <p v-if="meldung" :class="erfolgreich ? 'statuszeile' : 'meldung'" role="status">{{ meldung }}</p>
      <button class="primaer" type="submit">Profil speichern</button>
    </template>
  </form>
</template>
