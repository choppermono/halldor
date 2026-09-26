<script setup>
import { onMounted, ref } from 'vue'
import { rangFarbe } from '../lib/rangfarbe.js'
import KinoAuflage from './KinoAuflage.vue'
import RangZeichen from './RangZeichen.vue'

defineOptions({ name: 'RangAufstieg' })

// Der eine Moment, in dem die App feiert: eine Last hat eine Rangschwelle
// ueberschritten. Belohnt wird Kraft, nie ein Kaloriendefizit. Mit
// Anzeigeebene verwandelt sich das alte Modell in das neue.
const props = defineProps({
  titel: { type: String, required: true },
  untertitel: { type: String, required: true },
  stufe: { type: Object, required: true },
  vorher: { type: Number, default: -1 },
  zeile: { type: String, default: '' },
})
const melden = defineEmits(['weiter'])
const dialog = ref(null)

onMounted(() => {
  dialog.value?.showModal()
  navigator.vibrate?.([30, 60, 30, 60, 120])
})
</script>

<template>
  <dialog
    ref="dialog"
    class="rang-aufstieg"
    :style="{ '--rang-farbe': rangFarbe(props.stufe.index) }"
    aria-labelledby="aufstieg-titel"
    @cancel.prevent="melden('weiter')"
  >
    <div class="aufstieg-inhalt">
      <p class="system-label">{{ props.titel }}</p>
      <div class="kristall-buehne gross">
        <RangZeichen :stufe="props.stufe.index" :groesse="160" />
        <KinoAuflage
          name="RangKristall"
          :stufe="props.stufe.index"
          :vorher="props.vorher"
          aufstieg
        />
      </div>
      <h2 id="aufstieg-titel">{{ props.stufe.name }}</h2>
      <p class="aufstieg-uebung">{{ props.untertitel }}</p>
      <p v-if="props.zeile" class="aufstieg-last">{{ props.zeile }}</p>
      <button type="button" class="primaer" autofocus @click="melden('weiter')">Weiter</button>
    </div>
  </dialog>
</template>
