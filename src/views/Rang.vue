<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import RangZeichen from '../components/RangZeichen.vue'
import SchubladeBlatt from '../components/SchubladeBlatt.vue'
import KinoAuflage from '../components/KinoAuflage.vue'
import { useProfil } from '../composables/useProfil.js'
import { useTraining } from '../composables/useTraining.js'
import { rangdaten, ranglisteBerechnen, schwellenFuer } from '../lib/rang.js'

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
// Wie viele Übungen auf welcher Stufe stehen. Eine Verteilung, kein
// Gesamtrang (E-27): keine Stufe wird aus den anderen verrechnet.
const verteilung = computed(() =>
  rangdaten.stufen.map((name, index) => ({
    name,
    index,
    anzahl: raenge.value.filter((rang) => rang.wert.stufe?.index === index).length,
  }))
)

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
    <div class="rang-kopf">
      <div>
        <p class="system-label">Skala {{ skalaName }}</p>
        <h1 id="rang-titel">Rang.</h1>
      </div>
      <ol class="stufenverteilung" aria-label="Übungen je Stufe">
        <li
          v-for="stufe in verteilung"
          :key="stufe.name"
          :class="{ leer: !stufe.anzahl }"
          :aria-label="`${stufe.name}: ${stufe.anzahl}`"
        >
          <RangZeichen :stufe="stufe.anzahl ? stufe.index : -1" :groesse="20" />
          <strong aria-hidden="true">{{ stufe.anzahl }}</strong>
          <span aria-hidden="true">{{ stufe.name[0] }}</span>
        </li>
      </ol>
    </div>

    <p v-if="!geschlecht" class="meldung" role="status">
      Die Rangskala hängt an der Auswahl Männlich oder Weiblich.
      <RouterLink to="/profil">Im Profil wählen</RouterLink>
    </p>

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
          :style="{ '--i': position }"
          :aria-label="`${uebung.name}, ${rang?.wert.stufe?.name ?? 'keine Stufe'}${rang ? `, ${zahl(rang.wert.lastKg)} kg` : ''}. Details öffnen`"
          @click="gewaehlt = uebung.id"
        >
          <RangZeichen :stufe="rang?.wert.stufe?.index ?? -1" :groesse="34" />
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
      <article v-if="detail" class="rang-detail">
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
          {{ detail.uebung.gewichtshinweis }}. Es gibt keinen Gesamtrang.
        </p>
      </article>
    </SchubladeBlatt>
  </section>
</template>
