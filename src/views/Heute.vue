<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import RouterLink from '../components/SeitenLink.vue'
import { useProfil } from '../composables/useProfil.js'
import { useTagebuch } from '../composables/useTagebuch.js'
import { REGELN, datumPruefen, zielBerechnen } from '../lib/ernaehrung.js'
import { bilanzBerechnen } from '../lib/lebensmittel.js'
import { kalorien, lokalesDatum, tagVerschieben, zahl } from '../lib/darstellung.js'
import Makrobalken from '../components/Makrobalken.vue'
import GlyphenText from '../components/GlyphenText.vue'
import DatumFeld from '../components/DatumFeld.vue'
import SystemSymbol from '../components/SystemSymbol.vue'
import ZielHerleitung from '../components/ZielHerleitung.vue'

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
const letzterEintrag = computed(() => eintraege.value.at(-1) ?? null)
const vorschau = computed(() => zielBerechnen(profil.zustand.profil, heute.value))
const ziel = computed(
  () => tag.value?.ziel ?? (vorschau.value.status === 'ok' ? vorschau.value.wert : null)
)
const bilanz = computed(() => bilanzBerechnen(eintraege.value))
const anteil = computed(() =>
  ziel.value?.kcal > 0 ? Math.min(100, (bilanz.value.kcal.bekannt / ziel.value.kcal) * 100) : 0
)
const differenz = computed(() => (ziel.value ? ziel.value.kcal - bilanz.value.kcal.bekannt : null))
const meldung = ref('')
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
        <button class="datum-pfeil" aria-label="Vorheriger Tag" @click="wechseln(tagVerschieben(datum, -1))"><SystemSymbol name="links" /></button>
        <details ref="datumRegister" class="datum-register" @toggle="datumEntwurf = datum" @keydown.esc="datumSchliessen">
          <summary :aria-label="`Datum auswählen, ${datumBeschriftung}`">{{ datumBeschriftung }}<SystemSymbol name="unten" /></summary>
          <form class="datum-auswahl" @submit.prevent="wechseln(datumEntwurf)">
            <label>Datum<DatumFeld v-model="datumEntwurf" min="1900-01-01" :max="heute" required /></label>
            <button type="submit">Tag öffnen</button>
          </form>
        </details>
        <button class="datum-pfeil" aria-label="Nächster Tag" :disabled="datum >= heute" @click="wechseln(tagVerschieben(datum, 1))"><SystemSymbol name="rechts" /></button>
      </div>
    </header>
    <button v-if="datum !== heute" class="textknopf" @click="wechseln(heute)">Zu heute</button>

    <template v-if="!profil.zustand.profil">
      <p class="leerzustand">Erfasse deine Körperdaten, damit hier dein Tagesziel und die Bilanz erscheinen.</p>
      <RouterLink class="knopf primaer" to="/onboarding">Profil einrichten</RouterLink>
    </template>

    <template v-else>
      <section class="bilanz-hero" aria-label="Kalorienbilanz">
        <p class="bilanz-zahl"><GlyphenText :wert="kalorien(bilanz.kcal.bekannt)" /><span>kcal</span></p>
        <div class="bilanz-skala" aria-hidden="true"><span :style="{ transform: `scaleX(${anteil / 100})` }"></span><i :style="{ left: `${anteil}%` }"></i></div>
        <dl class="bilanz-werte">
          <div><dt>Ziel</dt><dd>{{ ziel ? kalorien(ziel.kcal) : '–' }}</dd></div>
          <div><dt>Offen</dt><dd>{{ differenz === null ? '–' : kalorien(Math.abs(differenz)) }}</dd></div>
          <div><dt>Anteil</dt><dd>{{ Math.round(anteil) }} %</dd></div>
        </dl>
        <p v-if="!bilanz.kcal.vollstaendig" class="klein">Bekannte Teilsumme. Bei {{ bilanz.kcal.unbekannt }} Eintrag/Einträgen ist die Energie unbekannt.</p>
        <p v-else-if="differenz < 0" class="klein">{{ kalorien(Math.abs(differenz)) }} kcal über dem Ziel.</p>
      </section>

      <p v-if="!ziel" class="meldung" role="status">{{ vorschau.meldung }} <RouterLink to="/profil">Ziel im Profil prüfen.</RouterLink></p>
      <div class="makro-protokoll">
        <div class="makros">
          <Makrobalken v-for="[key, name] in [['proteinG', 'Eiweiss'], ['kohlenhydrateG', 'Kohlenhydrate'], ['fettG', 'Fett']]" :key="key" :name="name" :bilanz="bilanz[key]" :ziel="ziel?.[key] ?? null" />
        </div>
      </div>

      <div class="zuletzt-zeile">
        <span class="system-label">Zuletzt</span>
        <span v-if="letzterEintrag">{{ letzterEintrag.name }} · {{ zahl(letzterEintrag.mengeG, 1) }} g</span>
        <span v-else>Noch kein Eintrag</span>
      </div>

      <details v-if="tag?.ziel?.herleitung" class="tagesherleitung">
        <summary>Rechenweg dieses Tages</summary>
        <ZielHerleitung :ergebnis="{ status: 'ok', wert: tag.ziel, herleitung: tag.ziel.herleitung }" />
      </details>
      <RouterLink class="knopf primaer erfassen" :to="{ path: '/produkt', query: { datum } }"><SystemSymbol name="plus" />Produkt erfassen</RouterLink>

      <section class="abschnitt" aria-labelledby="eintraege-titel">
        <div class="abschnittkopf"><h2 id="eintraege-titel">Einträge</h2><span class="system-label">{{ eintraege.length }} erfasst</span></div>
        <p v-if="!eintraege.length" class="leerzustand">Für diesen Tag ist noch nichts erfasst.</p>
        <ul v-else class="eintragsliste">
          <li v-for="eintrag in eintraege" :key="eintrag.id">
            <div class="eintragsdaten">
              <strong>{{ eintrag.name }}</strong><span v-if="eintrag.marke" class="klein">{{ eintrag.marke }}</span>
              <span class="messzahl klein">{{ zahl(eintrag.mengeG, 1) }} g · {{ Number.isFinite(eintrag.pro100g.kcal) ? `etwa ${kalorien((eintrag.pro100g.kcal * eintrag.mengeG) / 100)} kcal` : 'Energie unbekannt' }}</span>
            </div>
            <button :aria-label="`${eintrag.name} löschen`" @click="loeschen(eintrag.id)"><SystemSymbol name="loeschen" />Löschen</button>
          </li>
        </ul>
      </section>
      <p v-if="meldung" class="statuszeile" role="status">{{ meldung }}</p>
    </template>
    <p v-if="tagebuch.zustand.hinweis || profil.zustand.hinweis" class="meldung" role="status">{{ tagebuch.zustand.hinweis || profil.zustand.hinweis }}</p>
  </section>
</template>
