<script setup>
import { onMounted, ref } from 'vue'
import KinoAuflage from './KinoAuflage.vue'
import RangZeichen from './RangZeichen.vue'

defineOptions({ name: 'RangAufstieg' })

// Der eine Moment, in dem die App feiert: eine Last hat eine Rangschwelle
// ueberschritten. Belohnt wird Kraft, nie ein Kaloriendefizit.
const props = defineProps({
  uebung: { type: String, required: true },
  stufe: { type: Object, required: true },
  lastKg: { type: Number, required: true },
  wiederholungen: { type: Number, required: true },
})
const melden = defineEmits(['weiter'])
const dialog = ref(null)

onMounted(() => {
  dialog.value?.showModal()
  navigator.vibrate?.([30, 60, 90])
})
</script>

<template>
  <dialog
    ref="dialog"
    class="rang-aufstieg"
    aria-labelledby="aufstieg-titel"
    @cancel.prevent="melden('weiter')"
  >
    <div class="aufstieg-inhalt">
      <p class="system-label">Rang-Aufstieg</p>
      <div class="kristall-buehne gross">
        <RangZeichen :stufe="props.stufe.index" :groesse="160" />
        <KinoAuflage name="RangKristall" :stufe="props.stufe.index" aufstieg />
      </div>
      <h2 id="aufstieg-titel">{{ props.stufe.name }}</h2>
      <p class="aufstieg-uebung">{{ props.uebung }}</p>
      <p class="aufstieg-last">
        {{ props.lastKg.toLocaleString('de-CH') }} kg × {{ props.wiederholungen }}
      </p>
      <button type="button" class="primaer" autofocus @click="melden('weiter')">Weiter</button>
    </div>
  </dialog>
</template>
