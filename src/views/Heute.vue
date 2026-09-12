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
import TagesBogen from '../components/TagesBogen.vue'
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
const datumBeschriftung = computed(() =>
  new Intl.DateTimeFormat('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(`${datum.value}T12:00:00`)
  )
)
function wechseln(wert) {
  if (datumRegister.value) datumRegister.value.open = false
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
    <div class="heute-kopf">
      <h1>{{ datum === heute ? 'Heute.' : 'Rückblick.' }}</h1>
      <div class="datumswechsler" aria-label="Tag auswählen">
        <button
          class="datum-pfeil"
          aria-label="Vorheriger Tag"
          @click="wechseln(tagVerschieben(datum, -1))"
        >
          <SystemSymbol name="links" />
        </button>
        <details ref="datumRegister" class="datum-register">
          <summary :aria-label="`Datum auswählen, ${datumBeschriftung}`">
            {{ datumBeschriftung }}<SystemSymbol name="unten" />
          </summary>
          <label class="datum-auswahl"
            >Datum<DatumFeld
              :model-value="datum"
              min="1900-01-01"
              :max="heute"
              @update:model-value="wechseln"
          /></label>
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
    </div>
    <button v-if="datum !== heute" class="textknopf" @click="wechseln(heute)">Zu heute</button>
    <template v-if="!profil.zustand.profil">
      <p class="leerzustand">
        Erfasse deine Körperdaten, damit hier dein Tagesziel und die Bilanz erscheinen.
      </p>
      <RouterLink class="knopf primaer" to="/onboarding">Profil einrichten</RouterLink>
    </template>
    <template v-else>
      <div class="tagesuebersicht">
        <div class="tagesmessung">
          <TagesBogen :anteil="anteil" :ueberschritten="differenz !== null && differenz < 0">
            <p class="system-label">
              {{ bilanz.kcal.vollstaendig ? 'Erfasst' : 'Bekannte Energie · Bilanz unvollständig' }}
            </p>
            <p class="tageszahl">
              <GlyphenText :wert="kalorien(bilanz.kcal.bekannt)" /><span class="einheit"
                >kcal · gerundet</span
              >
            </p>
          </TagesBogen>
          <dl class="zielbezug">
            <div>
              <dt>Tagesziel</dt>
              <dd>{{ ziel ? `etwa ${kalorien(ziel.kcal)} kcal` : 'nicht berechenbar' }}</dd>
            </div>
          </dl>
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
        <div class="makro-protokoll">
          <p class="system-label">Makros / erfasst : Ziel</p>
          <div class="makros staffel">
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
          <dl class="protokoll-daten">
            <div>
              <dt>Zielstand</dt>
              <dd>{{ tag ? 'Festgehalten' : 'Profilvorschau' }}</dd>
            </div>
            <div>
              <dt>Rundung</dt>
              <dd>{{ REGELN.kcalRundung }} kcal / 1 g</dd>
            </div>
          </dl>
          <details class="messhinweise">
            <summary>Messhinweise</summary>
            <p class="klein">
              {{
                tag
                  ? 'Ziel beim ersten Eintrag festgehalten. Profiländerungen ändern diesen Tag nicht.'
                  : 'Zielvorschau aus dem aktuellen Profil. Der erste Eintrag hält dieses Ziel fest.'
              }}
              <RouterLink v-if="!tag" to="/profil">Rechenweg im Profil</RouterLink>
            </p>
            <p class="klein">
              Kalorien auf {{ REGELN.kcalRundung }} kcal, Makros auf ganze Gramm gerundet. Summen
              werden vor der Rundung berechnet.
            </p>
          </details>
        </div>
      </div>
      <details v-if="tag?.ziel?.herleitung" class="tagesherleitung">
        <summary>Rechenweg dieses Tages</summary>
        <ZielHerleitung
          :ergebnis="{ status: 'ok', wert: tag.ziel, herleitung: tag.ziel.herleitung }"
        />
      </details>
      <RouterLink class="knopf primaer erfassen" :to="{ path: '/produkt', query: { datum } }"
        ><SystemSymbol name="plus" />Produkt erfassen</RouterLink
      >
      <section class="abschnitt" aria-labelledby="eintraege-titel">
        <div class="abschnittkopf">
          <h2 id="eintraege-titel">Einträge</h2>
          <span class="system-label">{{ eintraege.length }} erfasst</span>
        </div>
        <p v-if="!eintraege.length" class="leerzustand">
          Für diesen Tag ist noch nichts erfasst. Füge ein Produkt und seine Menge in Gramm hinzu.
        </p>
        <ul v-else class="eintragsliste staffel">
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
              <SystemSymbol name="loeschen" />Löschen
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
