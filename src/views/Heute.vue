<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useProfil } from '../composables/useProfil.js'
import { useTagebuch } from '../composables/useTagebuch.js'
import { REGELN, datumPruefen, zielBerechnen } from '../lib/ernaehrung.js'
import { bilanzBerechnen } from '../lib/lebensmittel.js'
import { kalorien, lokalesDatum, tagVerschieben, zahl } from '../lib/darstellung.js'
import Makrobalken from '../components/Makrobalken.vue'
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
function wechseln(wert) {
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
  <section class="ansicht heute">
    <p class="system-label seitenrubrik">Ernährung / Tagesprotokoll</p>
    <h1>{{ datum === heute ? 'Heute.' : 'Rückblick.' }}</h1>
    <div class="datumswechsler" aria-label="Tag auswählen">
      <button aria-label="Vorheriger Tag" @click="wechseln(tagVerschieben(datum, -1))">←</button>
      <label class="datumfeld"
        >Datum<input
          type="date"
          :value="datum"
          min="1900-01-01"
          :max="heute"
          @change="wechseln($event.target.value)"
      /></label>
      <button
        aria-label="Nächster Tag"
        :disabled="datum >= heute"
        @click="wechseln(tagVerschieben(datum, 1))"
      >
        →
      </button>
    </div>
    <button v-if="datum !== heute" class="textknopf" @click="wechseln(heute)">Zu heute</button>
    <template v-if="!profil.zustand.profil">
      <p class="leerzustand">
        Erfasse deine Körperdaten, damit hier dein Tagesziel und die Bilanz erscheinen.
      </p>
      <RouterLink class="knopf primaer" to="/onboarding">Profil einrichten</RouterLink>
    </template>
    <template v-else>
      <div class="tagesmessung">
        <p class="system-label">
          {{ bilanz.kcal.vollstaendig ? 'Erfasst' : 'Bekannte Energie · Bilanz unvollständig' }}
        </p>
        <p class="tageszahl">
          {{ kalorien(bilanz.kcal.bekannt) }}<span class="einheit">kcal · gerundet</span>
        </p>
        <p class="zielbezug">
          Tagesziel: {{ ziel ? `etwa ${kalorien(ziel.kcal)} kcal` : 'nicht berechenbar' }}
        </p>
        <div class="skala energieskala" aria-hidden="true">
          <span :style="{ width: `${anteil}%` }"></span>
        </div>
        <p v-if="ziel && bilanz.kcal.vollstaendig" class="differenz">
          {{ kalorien(Math.abs(differenz)) }} kcal
          {{ differenz >= 0 ? 'bis zum Ziel' : 'über dem Ziel' }}
        </p>
        <p v-else-if="!bilanz.kcal.vollstaendig" class="klein">
          Energie bei {{ bilanz.kcal.unbekannt }} Eintrag/Einträgen unbekannt. Die bekannte
          Teilsumme erlaubt keine vollständige Tagesbilanz.
        </p>
      </div>
      <p v-if="!ziel" class="meldung" role="status">
        {{ vorschau.meldung }} <RouterLink to="/profil">Ziel im Profil prüfen.</RouterLink>
      </p>
      <div class="makros">
        <Makrobalken
          v-for="[key, name] in [
            ['proteinG', 'Protein'],
            ['fettG', 'Fett'],
            ['kohlenhydrateG', 'Kohlenhydrate'],
          ]"
          :key="key"
          :name="name"
          :bilanz="bilanz[key]"
          :ziel="ziel?.[key] ?? null"
        />
      </div>
      <p class="klein">
        {{
          tag
            ? 'Ziel beim ersten Eintrag festgehalten. Profiländerungen ändern diesen Tag nicht.'
            : 'Zielvorschau aus dem aktuellen Profil. Der erste Eintrag hält dieses Ziel fest.'
        }}
        <RouterLink v-if="!tag" to="/profil">Rechenweg im Profil</RouterLink>
      </p>
      <p class="klein">
        Kalorien auf {{ REGELN.kcalRundung }} kcal, Makros auf ganze Gramm gerundet. Summen werden
        vor der Rundung berechnet.
      </p>
      <details v-if="tag?.ziel?.herleitung" class="tagesherleitung">
        <summary>Rechenweg dieses Tages</summary>
        <ZielHerleitung
          :ergebnis="{ status: 'ok', wert: tag.ziel, herleitung: tag.ziel.herleitung }"
        />
      </details>
      <RouterLink class="knopf primaer" :to="{ path: '/produkt', query: { datum } }"
        >Produkt erfassen</RouterLink
      >
      <section class="abschnitt" aria-labelledby="eintraege-titel">
        <div class="abschnittkopf">
          <h2 id="eintraege-titel">Einträge</h2>
          <span class="system-label">{{ eintraege.length }} erfasst</span>
        </div>
        <p v-if="!eintraege.length" class="leerzustand">
          Für diesen Tag ist noch nichts erfasst. Füge ein Produkt und seine Menge in Gramm hinzu.
        </p>
        <ul v-else class="eintragsliste">
          <li v-for="eintrag in eintraege" :key="eintrag.id">
            <div class="eintragsdaten">
              <strong>{{ eintrag.name }}</strong
              ><span v-if="eintrag.marke" class="klein">{{ eintrag.marke }}</span
              ><span class="messzahl klein"
                >{{ zahl(eintrag.mengeG, 1) }} g ·
                {{
                  Number.isFinite(eintrag.pro100g.kcal)
                    ? `etwa ${kalorien((eintrag.pro100g.kcal * eintrag.mengeG) / 100)} kcal`
                    : 'Energie unbekannt'
                }}</span
              >
            </div>
            <button :aria-label="`${eintrag.name} löschen`" @click="loeschen(eintrag.id)">
              Löschen
            </button>
          </li>
        </ul>
      </section>
      <p v-if="meldung" class="statuszeile" role="status">{{ meldung }}</p>
    </template>
    <p v-if="tagebuch.zustand.hinweis || profil.zustand.hinweis" class="meldung" role="status">
      {{ tagebuch.zustand.hinweis || profil.zustand.hinweis }}
    </p>
  </section>
</template>
