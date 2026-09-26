<script setup>
import { onMounted, ref } from 'vue'
import KinoAuflage from './KinoAuflage.vue'
import ZahlAufzaehlen from './ZahlAufzaehlen.vue'

defineOptions({ name: 'EinheitAbschluss' })

// Das Ende einer Einheit als eigener Moment: was geschafft wurde, gross und
// hochzaehlend. Gefeiert wird Arbeit und Kraft, nicht Kalorien.
const props = defineProps({
  name: { type: String, required: true },
  saetze: { type: Number, required: true },
  gesamtlastKg: { type: Number, required: true },
  minuten: { type: Number, default: null },
  bestwerte: { type: Array, default: () => [] },
})
const melden = defineEmits(['weiter'])
const dialog = ref(null)
onMounted(() => {
  dialog.value?.showModal()
  navigator.vibrate?.([40, 50, 40])
})
</script>

<template>
  <dialog
    ref="dialog"
    class="einheit-fertig"
    aria-labelledby="fertig-titel"
    @cancel.prevent="melden('weiter')"
  >
    <KinoAuflage name="FeuerWerk" />
    <div class="fertig-inhalt">
      <p class="system-label">Einheit abgeschlossen</p>
      <h2 id="fertig-titel">{{ props.name }}.</h2>
      <dl class="fertig-werte">
        <div class="fertig-gross">
          <dt>Bewegte Last</dt>
          <dd>
            <ZahlAufzaehlen :wert="props.gesamtlastKg" :verzoegerung="300" /><small>kg</small>
          </dd>
        </div>
        <div>
          <dt>Sätze</dt>
          <dd><ZahlAufzaehlen :wert="props.saetze" :verzoegerung="500" :dauer="900" /></dd>
        </div>
        <div v-if="props.minuten !== null">
          <dt>Minuten</dt>
          <dd><ZahlAufzaehlen :wert="props.minuten" :verzoegerung="600" :dauer="900" /></dd>
        </div>
        <div>
          <dt>Bestwerte</dt>
          <dd>
            <ZahlAufzaehlen :wert="props.bestwerte.length" :verzoegerung="700" :dauer="900" />
          </dd>
        </div>
      </dl>
      <ul v-if="props.bestwerte.length" class="fertig-bestwerte" aria-label="Neue Bestwerte">
        <li v-for="(eintrag, i) in props.bestwerte" :key="eintrag.name" :style="{ '--i': i }">
          <span>{{ eintrag.name }}</span
          ><strong>{{ eintrag.text }}</strong>
        </li>
      </ul>
      <button type="button" class="primaer" autofocus @click="melden('weiter')">Fertig</button>
    </div>
  </dialog>
</template>
