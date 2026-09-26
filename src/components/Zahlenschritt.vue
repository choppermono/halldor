<script setup>
import { nextTick, ref } from 'vue'

defineOptions({ name: 'ZahlenSchritt' })

const props = defineProps({
  modelValue: { type: [Number, String], default: '' },
  name: { type: String, required: true },
  einheit: { type: String, required: true },
  schritt: { type: Number, required: true },
  min: { type: Number, required: true },
  max: { type: Number, required: true },
  inputmode: { type: String, default: 'decimal' },
})
const emit = defineEmits(['update:modelValue'])
const bearbeiten = ref(false)
const eingabe = ref(null)

function begrenzen(wert) {
  if (!Number.isFinite(wert)) return ''
  return Math.min(props.max, Math.max(props.min, Math.round(wert * 1000) / 1000))
}
function aendern(richtung) {
  const basis = Number(props.modelValue)
  // Ein leeres Feld beginnt beim ersten Druck an der Untergrenze, nicht einen
  // Schritt darüber.
  if (!Number.isFinite(basis) || props.modelValue === '') {
    emit('update:modelValue', begrenzen(props.min))
    return
  }
  emit('update:modelValue', begrenzen(basis + richtung * props.schritt))
}
function direktBearbeiten() {
  bearbeiten.value = true
  nextTick(() => {
    eingabe.value?.focus()
    eingabe.value?.select()
  })
}
function uebernehmen(ereignis) {
  const wert = Number(ereignis.target.value)
  emit('update:modelValue', begrenzen(wert))
  bearbeiten.value = false
}
function formatieren(wert) {
  const zahl = Number(wert)
  return Number.isFinite(zahl) && wert !== '' ? zahl.toLocaleString('de-CH') : '–'
}
</script>

<template>
  <div class="zahlenschritt">
    <button type="button" :aria-label="`${name} verringern`" @click="aendern(-1)">−</button>
    <input
      v-if="bearbeiten"
      ref="eingabe"
      :value="modelValue"
      type="number"
      :inputmode="inputmode"
      :min="min"
      :max="max"
      :step="schritt"
      :aria-label="`${name} in ${einheit}`"
      @change="uebernehmen"
      @blur="uebernehmen"
      @keydown.enter.prevent="uebernehmen"
      @keydown.esc.prevent="bearbeiten = false"
    />
    <button
      v-else
      type="button"
      class="zahlenwert"
      :aria-label="`${name}: ${formatieren(modelValue)} ${einheit}. Wert eintippen`"
      @click="direktBearbeiten"
    >
      <span>{{ formatieren(modelValue) }}</span
      ><small>{{ einheit }}</small>
    </button>
    <button type="button" :aria-label="`${name} erhöhen`" @click="aendern(1)">+</button>
  </div>
</template>
