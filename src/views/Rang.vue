<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import RangZeichen from '../components/RangZeichen.vue'
import SchubladeBlatt from '../components/SchubladeBlatt.vue'
import KinoAuflage from '../components/KinoAuflage.vue'
import { useProfil } from '../composables/useProfil.js'
import { useTraining } from '../composables/useTraining.js'
import { gesamtrangBerechnen, rangdaten, ranglisteBerechnen, schwellenFuer } from '../lib/rang.js'
import { rangFarbe } from '../lib/rangfarbe.js'

defineOptions({ name: 'RangAnsicht' })

const training = useTraining()
const profil = useProfil()
training.trainingLaden()
profil.profilLaden()

const geschlecht = computed(() => profil.zustand.profil?.geschlecht ?? '')
const skalaName = computed(
  () => ({ m: 'Männer', w: 'Frauen' })[geschlecht.value] ?? 'nicht gewählt'
)
const raenge = computed(() =>
  ranglisteBerechnen(training.zustand.einheiten, training.uebungen, rangdaten, geschlecht.value)
)
const rangNachUebung = computed(() => new Map(raenge.value.map((rang) => [rang.uebungId, rang])))

// Zwei Reiter statt einer langen Liste: so passt eine Körperhälfte auf einen
// Handybildschirm, ohne zu scrollen.
const bereiche = [
  { id: 'oberkoerper', name: 'Oberkörper' },
  { id: 'unterkoerper', name: 'Unterkörper' },
]
const bereich = ref('oberkoerper')
const kacheln = computed(() =>
  training.uebungen
    .filter((uebung) => uebung.bereich === bereich.value)
    .map((uebung) => ({
      uebung,
      rang: rangNachUebung.value.get(uebung.id) ?? null,
      schwellen: schwellenFuer(uebung.id, rangdaten, geschlecht.value),
    }))
)
// Der Hauptrang: Durchschnitt aller Übungen des Plans (E-140).
const gesamt = computed(() =>
  gesamtrangBerechnen(training.zustand.einheiten, training.uebungen, rangdaten, geschlecht.value)
)
const hauptIndex = computed(() => gesamt.value.stufe?.index ?? -1)
const hauptName = computed(() =>
  gesamt.value.stufe ? `${gesamt.value.stufe.name} ${gesamt.value.division}` : 'Ohne Rang'
)
const gesamtOffen = ref(false)

const gewaehlt = ref(null)
const detail = computed(() =>
  gewaehlt.value ? kacheln.value.find((k) => k.uebung.id === gewaehlt.value) : null
)

// Füllung je Leitersegment: erreichte Stufen voll, die nächste anteilig.
function segmentAnteil(lastKg, schwellen, index) {
  if (lastKg >= schwellen[index]) return 1
  const untergrenze = index === 0 ? 0 : schwellen[index - 1]
  if (lastKg < untergrenze) return 0
  return (lastKg - untergrenze) / (schwellen[index] - untergrenze)
}
function zahl(wert) {
  return Number(wert).toLocaleString('de-CH', { maximumFractionDigits: 2 })
}
</script>

<template>
  <section class="ansicht rang" aria-labelledby="rang-titel">
    <h1 id="rang-titel" class="nur-vorlesbar">Rang</h1>
    <p v-if="!geschlecht" class="meldung" role="status">
      Die Rangskala hängt an der Auswahl Männlich oder Weiblich.
      <RouterLink to="/profil">Im Profil wählen</RouterLink>
    </p>

    <!-- Der Gesamtrang ist der Hauptrang des Spielers: gross, in seiner
         Stufenfarbe, mit dem 3D-Modell seiner Stufe. -->
    <button
      v-else
      type="button"
      class="gesamtrang"
      :style="{ '--rang-farbe': rangFarbe(hauptIndex) }"
      :aria-label="`Gesamtrang ${hauptName}. Details öffnen`"
      @click="gesamtOffen = true"
    >
      <span class="gesamtrang-buehne">
        <RangZeichen :stufe="hauptIndex" :groesse="96" />
        <KinoAuflage name="RangKristall" :stufe="hauptIndex" />
      </span>
      <span class="gesamtrang-text">
        <span class="system-label">Gesamtrang</span>
        <strong class="gesamtrang-name"
          >{{ gesamt.stufe?.name ?? 'Ohne Rang' }}
          <span v-if="gesamt.division" class="gesamtrang-division">{{ gesamt.division }}</span>
        </strong>
        <span class="gesamtrang-spur" aria-hidden="true"
          ><i :style="{ transform: `scaleX(${gesamt.anteilInStufe ?? 0})` }"></i
        ></span>
        <span class="gesamtrang-zahl">{{ zahl(gesamt.punkte ?? 0) }} / 6 Punkte</span>
      </span>
    </button>

    <div class="bereichswahl" role="group" aria-label="Körperbereich">
      <button
        v-for="eintrag in bereiche"
        :key="eintrag.id"
        type="button"
        :aria-pressed="bereich === eintrag.id"
        @click="bereich = eintrag.id"
      >
        {{ eintrag.name }}
      </button>
    </div>

    <ol :key="bereich" class="vitrine">
      <li v-for="({ uebung, rang, schwellen }, position) in kacheln" :key="uebung.id">
        <button
          type="button"
          class="vitrinen-kachel"
          :class="{ ohne: !rang }"
          :style="{ '--i': position, '--rang-farbe': rangFarbe(rang?.wert.stufe?.index ?? -1) }"
          :aria-label="`${uebung.name}, ${rang?.wert.stufe?.name ?? 'keine Stufe'}${rang ? `, ${zahl(rang.wert.lastKg)} kg` : ''}. Details öffnen`"
          @click="gewaehlt = uebung.id"
        >
          <RangZeichen :stufe="rang?.wert.stufe?.index ?? -1" :groesse="30" />
          <span class="kachel-last">
            <template v-if="rang"
              ><strong>{{ zahl(rang.wert.lastKg) }}</strong
              ><small>kg</small></template
            >
            <template v-else><strong>–</strong></template>
          </span>
          <span class="kachel-stufe" :class="{ erreicht: rang?.wert.stufe }">
            {{
              rang?.wert.stufe?.name ?? (schwellen ? `B ab ${zahl(schwellen[0])}` : 'Ohne Skala')
            }}
          </span>
          <span class="kachel-name">{{ uebung.name }}</span>
        </button>
      </li>
    </ol>

    <SchubladeBlatt
      :titel="`Rang · ${detail?.uebung.bereich === 'unterkoerper' ? 'Unterkörper' : 'Oberkörper'}`"
      :offen="!!detail"
      @schliessen="gewaehlt = null"
    >
      <article
        v-if="detail"
        class="rang-detail"
        :style="{ '--rang-farbe': rangFarbe(detail.rang?.wert.stufe?.index ?? -1) }"
      >
        <!-- Die Bühne zeigt das flache Zeichen; mit Anzeigeebene legt sich der
             3D-Kristall darüber und übernimmt, sobald er sein erstes Bild hat. -->
        <div class="kristall-buehne">
          <RangZeichen :stufe="detail.rang?.wert.stufe?.index ?? -1" :groesse="120" />
          <KinoAuflage name="RangKristall" :stufe="detail.rang?.wert.stufe?.index ?? -1" />
        </div>
        <div class="rang-detail-kopf">
          <div>
            <h2>{{ detail.uebung.name }}</h2>
            <p class="stufe" :class="{ ohne: !detail.rang?.wert.stufe }">
              {{
                detail.rang?.wert.stufe?.name ?? (detail.rang ? 'Unter Bronze' : 'Noch keine Last')
              }}
            </p>
          </div>
        </div>

        <p v-if="detail.rang" class="rang-detail-last">
          <strong>{{ zahl(detail.rang.wert.lastKg) }}</strong>
          <span>kg × {{ detail.rang.satz.wiederholungen }} · beste Last</span>
        </p>

        <template v-if="detail.schwellen">
          <div class="rang-leiter" aria-hidden="true">
            <span v-for="(stufe, index) in rangdaten.stufen" :key="stufe"
              ><i
                :style="{
                  transform: `scaleX(${segmentAnteil(detail.rang?.wert.lastKg ?? 0, detail.schwellen, index)})`,
                }"
              ></i
            ></span>
          </div>
          <div class="rang-schwellen">
            <span
              v-for="(stufe, index) in rangdaten.stufen"
              :key="stufe"
              :class="{
                erreicht: detail.rang?.wert.stufe && index <= detail.rang.wert.stufe.index,
              }"
            >
              <abbr :title="stufe">{{ stufe[0] }}</abbr> {{ zahl(detail.schwellen[index]) }}
            </span>
          </div>
          <p class="rang-abstand">
            <template v-if="!detail.rang">Bronze ab {{ zahl(detail.schwellen[0]) }} kg</template>
            <template v-else-if="detail.rang.wert.naechsteStufe">
              {{ detail.rang.wert.naechsteStufe }} ab
              {{ zahl(detail.rang.wert.lastKg + detail.rang.wert.abstandKg) }} kg · noch
              {{ zahl(detail.rang.wert.abstandKg) }} kg
            </template>
            <template v-else>Höchste Stufe erreicht</template>
          </p>
        </template>

        <p class="klein methodenhinweis">
          Feste Schwellen, für alle mit der Skala {{ skalaName }} gleich. Gezählt wird die beste
          Last in einem Satz ab {{ detail.uebung.wiederholungen.min }} Wiederholungen. Gemessen:
          {{ detail.uebung.gewichtshinweis }}. Jede Übung zählt gleich viel für den Gesamtrang.
        </p>
      </article>
    </SchubladeBlatt>

    <SchubladeBlatt titel="Gesamtrang" :offen="gesamtOffen" @schliessen="gesamtOffen = false">
      <article class="rang-detail" :style="{ '--rang-farbe': rangFarbe(hauptIndex) }">
        <div class="kristall-buehne">
          <RangZeichen :stufe="hauptIndex" :groesse="120" />
          <KinoAuflage name="RangKristall" :stufe="hauptIndex" />
        </div>
        <div class="rang-detail-kopf">
          <div>
            <h2>{{ hauptName }}</h2>
            <p class="stufe" :class="{ ohne: !gesamt.stufe }">
              {{ zahl(gesamt.punkte ?? 0) }} von 6 Punkten
            </p>
          </div>
        </div>
        <div class="rang-leiter" aria-hidden="true">
          <span v-for="(stufe, index) in rangdaten.stufen" :key="stufe"
            ><i
              :style="{
                transform: `scaleX(${Math.min(1, Math.max(0, (gesamt.punkte ?? 0) - (index + 1)))})`,
              }"
            ></i
          ></span>
        </div>
        <div class="rang-schwellen">
          <span
            v-for="(stufe, index) in rangdaten.stufen"
            :key="stufe"
            :class="{ erreicht: index <= hauptIndex }"
            >{{ stufe }}</span
          >
        </div>
        <p class="klein methodenhinweis">
          Jede der {{ gesamt.gesamt }} Übungen bekommt 0 bis 6 Punkte: unter Bronze anteilig bis 1,
          jede Stufe einen Punkt, Diamant bis 6 je nachdem, wie weit du darüber liegst. Der
          Gesamtrang ist der Durchschnitt über alle Übungen; nicht trainierte zählen 0. Jede Stufe
          hat drei Divisionen, III ist die unterste. Gewertet: {{ gesamt.gewertet }} von
          {{ gesamt.gesamt }}.
        </p>
      </article>
    </SchubladeBlatt>
  </section>
</template>
