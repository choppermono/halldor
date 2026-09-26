<script setup>
import { computed, defineAsyncComponent, nextTick, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import RouterLink from '../components/SeitenLink.vue'
import { useProfil } from '../composables/useProfil.js'
import { useTagebuch } from '../composables/useTagebuch.js'
import { datumPruefen, zielBerechnen } from '../lib/ernaehrung.js'
import { bilanzBerechnen } from '../lib/lebensmittel.js'
import { kalorien, lokalesDatum, tagVerschieben, zahl } from '../lib/darstellung.js'
import GlyphenText from '../components/GlyphenText.vue'
import DatumFeld from '../components/DatumFeld.vue'
import SystemSymbol from '../components/SystemSymbol.vue'
import ZielHerleitung from '../components/ZielHerleitung.vue'

// Die Erfassung mit Kamera und zxing wird erst geladen, wenn jemand scannt.
const ProduktBestaetigen = defineAsyncComponent(() => import('./ProduktBestaetigen.vue'))

defineOptions({ name: 'HeuteAnsicht' })

const route = useRoute()
const router = useRouter()
const profil = useProfil()
const tagebuch = useTagebuch()
profil.profilLaden()
tagebuch.tagebuchLaden()
const heute = ref(lokalesDatum())
const datum = computed(() =>
  typeof route.query.datum === 'string' &&
  datumPruefen(route.query.datum).status === 'ok' &&
  route.query.datum <= heute.value
    ? route.query.datum
    : heute.value
)
const tag = computed(() => tagebuch.zustand.tage[datum.value])
const eintraege = computed(() => (Array.isArray(tag.value?.eintraege) ? tag.value.eintraege : []))
const vorschau = computed(() => zielBerechnen(profil.zustand.profil, heute.value))
const ziel = computed(
  () => tag.value?.ziel ?? (vorschau.value.status === 'ok' ? vorschau.value.wert : null)
)
const bilanz = computed(() => bilanzBerechnen(eintraege.value))
const anteil = computed(() =>
  ziel.value?.kcal > 0 ? Math.min(100, (bilanz.value.kcal.bekannt / ziel.value.kcal) * 100) : 0
)
const differenz = computed(() => (ziel.value ? ziel.value.kcal - bilanz.value.kcal.bekannt : null))
const ueberZiel = computed(() => differenz.value !== null && differenz.value < 0)

// Der Ring ist eine Skala aus 60 Strichen wie auf einem Instrument. Erreichte
// Striche sind hell; so liest man den Anteil, ohne eine Fläche zu füllen.
const STRICHE = 60
const striche = computed(() =>
  Array.from({ length: STRICHE }, (_, index) => ({
    index,
    winkel: (index * 360) / STRICHE,
    lang: index % 5 === 0,
    erreicht: index < Math.round((anteil.value / 100) * STRICHE),
  }))
)
const makros = computed(() =>
  [
    ['proteinG', 'Eiweiss'],
    ['kohlenhydrateG', 'Kohlenhydrate'],
    ['fettG', 'Fett'],
  ].map(([key, name]) => {
    const soll = ziel.value?.[key] ?? null
    const ist = bilanz.value[key]
    return {
      key,
      name,
      ist,
      soll,
      anteil: soll > 0 ? Math.min(1, ist.bekannt / soll) : 0,
    }
  })
)

const meldung = ref('')
const scannerOffen = ref(false)
const scannerNummer = ref(0)
const scanKnopf = ref(null)
function scannerOeffnen() {
  scannerNummer.value++
  scannerOffen.value = true
  meldung.value = ''
}
function scannerSchliessen() {
  scannerOffen.value = false
  nextTick(() => scanKnopf.value?.focus({ preventScroll: true }))
}
function erfasst({ name, mengeG }) {
  scannerSchliessen()
  meldung.value = `${name} erfasst, ${zahl(mengeG, 1)} g.`
}

const datumRegister = ref(null)
const datumEntwurf = ref(datum.value)
const datumBeschriftung = computed(() =>
  new Intl.DateTimeFormat('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(`${datum.value}T12:00:00`)
  )
)
function datumSchliessen() {
  if (!datumRegister.value?.open) return
  datumRegister.value.open = false
  datumRegister.value.querySelector('summary')?.focus({ preventScroll: true })
}
function wechseln(wert) {
  datumSchliessen()
  heute.value = lokalesDatum()
  if (datumPruefen(wert).status === 'ok' && wert <= heute.value)
    router.replace({ path: '/', query: { datum: wert } })
}
function loeschen(id) {
  const ergebnis = tagebuch.eintragLoeschen(datum.value, id)
  meldung.value =
    ergebnis.status === 'ok' ? 'Eintrag gelöscht. Bilanz aktualisiert.' : ergebnis.meldung
}
</script>

<template>
  <section class="ansicht heute" aria-labelledby="heute-titel">
    <header class="heute-kopf">
      <h1 id="heute-titel" class="system-label seitenrubrik">
        {{ datum === heute ? 'Tagesbilanz' : 'Rückblick' }}
      </h1>
      <div class="datumswechsler" aria-label="Tag auswählen">
        <button
          class="datum-pfeil"
          aria-label="Vorheriger Tag"
          @click="wechseln(tagVerschieben(datum, -1))"
        >
          <SystemSymbol name="links" />
        </button>
        <details
          ref="datumRegister"
          class="datum-register"
          @toggle="datumEntwurf = datum"
          @keydown.esc="datumSchliessen"
        >
          <summary :aria-label="`Datum auswählen, ${datumBeschriftung}`">
            {{ datumBeschriftung }}<SystemSymbol name="unten" />
          </summary>
          <form class="datum-auswahl" @submit.prevent="wechseln(datumEntwurf)">
            <label
              >Datum<DatumFeld v-model="datumEntwurf" min="1900-01-01" :max="heute" required
            /></label>
            <button type="submit">Tag öffnen</button>
          </form>
        </details>
        <button
          class="datum-pfeil"
          aria-label="Nächster Tag"
          :disabled="datum >= heute"
          @click="wechseln(tagVerschieben(datum, 1))"
        >
          <SystemSymbol name="rechts" />
        </button>
      </div>
    </header>
    <button v-if="datum !== heute" class="textknopf" @click="wechseln(heute)">Zu heute</button>

    <template v-if="!profil.zustand.profil">
      <p class="leerzustand">
        Erfasse deine Körperdaten, damit hier dein Tagesziel und die Bilanz erscheinen.
      </p>
      <RouterLink class="knopf primaer" to="/onboarding">Profil einrichten</RouterLink>
    </template>

    <template v-else>
      <section class="kalorienring" :class="{ ueber: ueberZiel }" aria-label="Kalorienbilanz">
        <svg class="ring-skala" viewBox="0 0 240 240" aria-hidden="true" focusable="false">
          <circle class="ring-grund" cx="120" cy="120" r="96" />
          <!-- Die Drehung sitzt an der Gruppe, damit die CSS-Animation am Strich
               sie nicht überschreibt. -->
          <g
            v-for="strich in striche"
            :key="strich.index"
            :transform="`rotate(${strich.winkel} 120 120)`"
          >
            <line
              x1="120"
              :y1="strich.lang ? 6 : 10"
              x2="120"
              y2="20"
              :class="{ erreicht: strich.erreicht }"
              :style="{ '--i': strich.index }"
            />
          </g>
          <line class="ring-ziel" x1="120" y1="0" x2="120" y2="24" />
        </svg>
        <div class="ring-inhalt">
          <span class="system-label">{{ ueberZiel ? 'Über dem Ziel' : 'Noch offen' }}</span>
          <strong class="ring-zahl"
            ><GlyphenText :wert="differenz === null ? '–' : kalorien(Math.abs(differenz))"
          /></strong>
          <span class="ring-bezug"
            >{{ kalorien(bilanz.kcal.bekannt) }} / {{ ziel ? kalorien(ziel.kcal) : '–' }} kcal</span
          >
        </div>
      </section>
      <p v-if="!bilanz.kcal.vollstaendig" class="klein ring-hinweis">
        Bekannte Teilsumme. Bei {{ bilanz.kcal.unbekannt }} Eintrag/Einträgen ist die Energie
        unbekannt.
      </p>
      <p v-if="!ziel" class="meldung" role="status">
        {{ vorschau.meldung }} <RouterLink to="/profil">Ziel im Profil prüfen.</RouterLink>
      </p>

      <dl class="makrospalten">
        <div v-for="makro in makros" :key="makro.key">
          <dt>{{ makro.name }}</dt>
          <dd>
            <strong>{{ zahl(makro.ist.bekannt) }}</strong
            ><span>/ {{ makro.soll === null ? '–' : zahl(makro.soll) }} g</span>
          </dd>
          <div class="skala" aria-hidden="true">
            <span :style="{ transform: `scaleX(${makro.anteil})` }"></span>
          </div>
        </div>
      </dl>

      <section class="erfassung" aria-label="Produkt erfassen">
        <button
          v-if="!scannerOffen"
          ref="scanKnopf"
          type="button"
          class="scan-buehne"
          @click="scannerOeffnen"
        >
          <span class="scan-ecken" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
          <span class="scan-start"><SystemSymbol name="barcode" />Barcode scannen</span>
          <span class="scan-hinweis">Die Kamera startet erst nach dem Antippen</span>
        </button>
        <ProduktBestaetigen
          v-else
          :key="scannerNummer"
          scanner
          eingebettet
          @erfasst="erfasst"
          @schliessen="scannerSchliessen"
        />
        <RouterLink
          v-if="!scannerOffen"
          class="erfassung-alternative"
          :to="{ path: '/produkt', query: { datum } }"
          >Kein Barcode? <span>Von Hand erfassen</span></RouterLink
        >
      </section>
      <p class="statuszeile" role="status" aria-live="polite">{{ meldung }}</p>

      <section class="tagesprotokoll" aria-labelledby="eintraege-titel">
        <div class="protokollkopf">
          <h2 id="eintraege-titel" class="system-label">Protokoll</h2>
          <span class="system-label"
            >{{ eintraege.length }} {{ eintraege.length === 1 ? 'Eintrag' : 'Einträge' }}</span
          >
        </div>
        <p v-if="!eintraege.length" class="leerzustand">
          Für diesen Tag ist noch nichts erfasst. Scanne dein erstes Produkt.
        </p>
        <ul v-else class="protokoll-liste">
          <li v-for="eintrag in eintraege" :key="eintrag.id">
            <span class="protokoll-name"
              >{{ eintrag.name }}<small v-if="eintrag.marke">{{ eintrag.marke }}</small></span
            >
            <span class="protokoll-menge">{{ zahl(eintrag.mengeG, 1) }} g</span>
            <span class="protokoll-kcal"
              >{{
                Number.isFinite(eintrag.pro100g.kcal)
                  ? kalorien((eintrag.pro100g.kcal * eintrag.mengeG) / 100)
                  : '?'
              }}<small>kcal</small></span
            >
            <button
              class="protokoll-loeschen"
              :aria-label="`${eintrag.name} löschen`"
              @click="loeschen(eintrag.id)"
            >
              <SystemSymbol name="loeschen" />
            </button>
          </li>
        </ul>
      </section>

      <details v-if="tag?.ziel?.herleitung" class="tagesherleitung">
        <summary>Rechenweg dieses Tages</summary>
        <ZielHerleitung
          :ergebnis="{ status: 'ok', wert: tag.ziel, herleitung: tag.ziel.herleitung }"
        />
      </details>
    </template>
    <p v-if="tagebuch.zustand.hinweis || profil.zustand.hinweis" class="meldung" role="status">
      {{ tagebuch.zustand.hinweis || profil.zustand.hinweis }}
    </p>
  </section>
</template>
