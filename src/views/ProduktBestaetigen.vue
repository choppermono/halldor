<script setup>
import { computed, nextTick, onUnmounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import RouterLink from '../components/SeitenLink.vue'
import { produktLaden } from '../lib/openfoodfacts.js'
import { NAEHRWERTE, PRODUKT_GRENZEN, produktPruefen } from '../lib/lebensmittel.js'
import { datumPruefen } from '../lib/ernaehrung.js'
import { kalorien, lokalesDatum, zahl } from '../lib/darstellung.js'
import { useTagebuch } from '../composables/useTagebuch.js'
import GlyphenText from '../components/GlyphenText.vue'
import SystemSymbol from '../components/SystemSymbol.vue'
defineOptions({ name: 'ProduktBestaetigenAnsicht' })
const route = useRoute()
const router = useRouter()
const { eintragHinzufuegen } = useTagebuch()
const datum = computed(() =>
  typeof route.query.datum === 'string' &&
  datumPruefen(route.query.datum).status === 'ok' &&
  route.query.datum <= lokalesDatum()
    ? route.query.datum
    : lokalesDatum()
)
const barcode = ref('')
const laden = ref(false)
const suchmeldung = ref('')
const suchfehler = ref(false)
const ergebnisBarcode = ref(null)
const quelle = ref(false)
const mengeG = ref('')
const meldung = ref('')
const schritt = ref('produkt')
const titel = ref(null)
function titelFokussieren() {
  nextTick(() => titel.value?.focus({ preventScroll: true }))
}
function angabenBearbeiten() {
  schritt.value = 'produkt'
  titelFokussieren()
}
const produkt = reactive({
  name: '',
  marke: '',
  pro100g: Object.fromEntries(NAEHRWERTE.map((feld) => [feld.key, ''])),
})
let anfrageNummer = 0
const normalisiert = computed(() => ({
  name: produkt.name,
  marke: produkt.marke || null,
  barcode: ergebnisBarcode.value,
  pro100g: Object.fromEntries(
    NAEHRWERTE.map((feld) => [
      feld.key,
      produkt.pro100g[feld.key] === '' ? null : produkt.pro100g[feld.key],
    ])
  ),
}))
async function suchen() {
  const nummer = ++anfrageNummer
  const gesucht = barcode.value.trim()
  laden.value = true
  suchmeldung.value = ''
  suchfehler.value = false
  // Ein voriger Treffer darf nie mit dem neu eingegebenen Barcode gespeichert werden.
  ergebnisBarcode.value = null
  quelle.value = false
  const antwort = await produktLaden(gesucht)
  if (nummer !== anfrageNummer) return
  laden.value = false
  if (antwort.status !== 'gefunden') {
    produkt.name = ''
    produkt.marke = ''
    for (const feld of NAEHRWERTE) produkt.pro100g[feld.key] = ''
    mengeG.value = ''
    suchmeldung.value = antwort.meldung
    suchfehler.value = antwort.status !== 'unbekannt'
    return
  }
  produkt.name = antwort.produkt.name
  produkt.marke = antwort.produkt.marke ?? ''
  for (const feld of NAEHRWERTE) produkt.pro100g[feld.key] = antwort.produkt.pro100g[feld.key] ?? ''
  ergebnisBarcode.value = antwort.produkt.barcode
  quelle.value = true
  mengeG.value = antwort.produkt.portionG ?? ''
  suchmeldung.value = antwort.produkt.volumenbasis
    ? 'Produkt gefunden. Angaben pro 100 ml sind ohne Dichte nicht in Gramm umrechenbar; Nährwerte bleiben unbekannt.'
    : 'Produkt gefunden. Nährwerte prüfen und Menge bestätigen.'
}
function manuell() {
  ++anfrageNummer
  laden.value = false
  ergebnisBarcode.value = null
  quelle.value = false
  suchmeldung.value = ''
  produkt.name = ''
  produkt.marke = ''
  for (const feld of NAEHRWERTE) produkt.pro100g[feld.key] = ''
  mengeG.value = ''
}
function weiter() {
  const pruefung = produktPruefen(normalisiert.value)
  meldung.value = pruefung.status === 'ok' ? '' : pruefung.meldung
  if (pruefung.status === 'ok') {
    schritt.value = 'menge'
    window.scrollTo({ top: 0 })
    titelFokussieren()
  }
}
function bestaetigen() {
  const ergebnis = eintragHinzufuegen(datum.value, normalisiert.value, mengeG.value, lokalesDatum())
  if (ergebnis.status !== 'ok') {
    meldung.value = ergebnis.meldung
    return
  }
  router.push({ path: '/', query: { datum: datum.value } })
}
onUnmounted(() => {
  ++anfrageNummer
})
</script>
<template>
  <section class="ansicht produkt">
    <RouterLink class="zurueck" :to="{ path: '/', query: { datum } }"
      ><SystemSymbol name="links" />Tagesprotokoll</RouterLink
    >
    <p class="system-label seitenrubrik">Ernährung / {{ datum }}</p>
    <h1 ref="titel" tabindex="-1">{{ schritt === 'produkt' ? 'Produkt.' : 'Menge.' }}</h1>
    <ol class="schrittanzeige" aria-label="Erfassung">
      <li :aria-current="schritt === 'produkt' ? 'step' : undefined"><span>01</span> Produkt</li>
      <li :aria-current="schritt === 'menge' ? 'step' : undefined"><span>02</span> Menge</li>
    </ol>
    <template v-if="schritt === 'produkt'">
      <form class="barcode-formular" @submit.prevent="suchen">
        <label
          >Barcode eintippen<input
            v-model="barcode"
            type="text"
            inputmode="numeric"
            pattern="[0-9]{8,14}"
            minlength="8"
            maxlength="14"
            required
            autocomplete="off"
        /></label>
        <button
          type="submit"
          :disabled="laden"
          :aria-label="
            laden ? 'Abfrage läuft …' : suchfehler ? 'Erneut abfragen' : 'Barcode abfragen'
          "
        >
          <SystemSymbol name="barcode" />
          {{ laden ? 'Abfrage …' : suchfehler ? 'Wiederholen' : 'Abfragen' }}
        </button>
      </form>
      <p v-if="suchmeldung" :class="suchfehler ? 'meldung' : 'statuszeile'" role="status">
        {{ suchmeldung }}
      </p>
      <button class="textknopf" type="button" @click="manuell">Von Hand eintragen</button>
      <div v-if="quelle" class="produkt-treffer">
        <span class="system-label">Datensatz / {{ ergebnisBarcode }}</span>
        <h2><GlyphenText :wert="produkt.name" /></h2>
        <p v-if="produkt.marke" class="klein">{{ produkt.marke }}</p>
      </div>
      <form class="abschnitt" @submit.prevent="weiter">
        <h2>Angaben pro 100 g</h2>
        <p class="klein">
          Leere Nährwertfelder bleiben unbekannt. Eine eingetragene 0 bedeutet tatsächlich null.
        </p>
        <label
          >Produktname<input
            v-model="produkt.name"
            type="text"
            :maxlength="PRODUKT_GRENZEN.nameMax"
            required
        /></label>
        <label
          >Marke (optional)<input
            v-model="produkt.marke"
            type="text"
            :maxlength="PRODUKT_GRENZEN.nameMax"
        /></label>
        <div class="formularraster">
          <label v-for="feld in NAEHRWERTE" :key="feld.key"
            >{{ feld.label }} ({{ feld.einheit }})<input
              v-model.number="produkt.pro100g[feld.key]"
              type="number"
              min="0"
              :max="feld.max"
              step="any"
              inputmode="decimal"
              placeholder="unbekannt"
          /></label>
        </div>
        <p v-if="quelle" class="klein">
          Produktdaten von Open Food Facts. Angaben vor dem Erfassen prüfen.
        </p>
        <p v-if="meldung" class="meldung" role="status">{{ meldung }}</p>
        <button class="primaer" type="submit" :disabled="laden">Zur Menge</button>
      </form>
    </template>
    <form v-else class="mengenformular" @submit.prevent="bestaetigen">
      <p class="system-label">Portion / {{ datum }}</p>
      <h2 class="produktname">{{ produkt.name }}</h2>
      <p v-if="produkt.marke" class="klein">{{ produkt.marke }}</p>
      <label class="mengenfeld"
        >Menge in Gramm<input
          v-model.number="mengeG"
          type="number"
          :min="PRODUKT_GRENZEN.mengeMin"
          :max="PRODUKT_GRENZEN.mengeMax"
          step="any"
          inputmode="decimal"
          required
      /></label>
      <p class="klein">
        Eine vorbelegte Menge stammt aus der Portionsangabe des Produkts. Prüfe die tatsächlich
        erfasste Grammmenge.
      </p>
      <dl class="messwerte staffel">
        <div v-for="feld in NAEHRWERTE.slice(0, 4)" :key="feld.key">
          <dt>{{ feld.label }}</dt>
          <dd>
            {{
              normalisiert.pro100g[feld.key] === null || !Number.isFinite(mengeG)
                ? 'unbekannt'
                : feld.key === 'kcal'
                  ? kalorien((normalisiert.pro100g[feld.key] * mengeG) / 100)
                  : zahl((normalisiert.pro100g[feld.key] * mengeG) / 100)
            }}
            {{ feld.einheit }}
          </dd>
        </div>
      </dl>
      <p v-if="meldung" class="meldung" role="status">
        {{ meldung }} <RouterLink to="/profil">Profil prüfen</RouterLink>
      </p>
      <div class="aktionen">
        <button class="primaer" type="submit">Menge bestätigen und erfassen</button
        ><button type="button" @click="angabenBearbeiten">Produktangaben ändern</button>
      </div>
    </form>
    <p class="klein off-quelle">
      Produktdaten:
      <a href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer">Open Food Facts</a
      >,
      <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noreferrer"
        >ODbL</a
      >. Gespeichert wird eine Momentaufnahme beim Erfassen.
    </p>
  </section>
</template>
