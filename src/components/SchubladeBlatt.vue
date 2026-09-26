<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

defineOptions({ name: 'SchubladeBlatt' })

// Ein Blatt, das sich über die Seite legt, statt die Seite zu verlängern.
// <dialog> mit showModal() bringt Fokusfalle, Escape und die Rückgabe des
// Fokus an den auslösenden Knopf mit; nichts davon muss nachgebaut werden.
const props = defineProps({
  offen: { type: Boolean, default: false },
  titel: { type: String, required: true },
})
const melden = defineEmits(['schliessen'])
const dialog = ref(null)

function abgleichen(offen) {
  const element = dialog.value
  if (!element) return
  if (offen && !element.open) element.showModal()
  if (!offen && element.open) element.close()
}
watch(() => props.offen, abgleichen, { flush: 'post' })
onMounted(() => abgleichen(props.offen))
onBeforeUnmount(() => dialog.value?.open && dialog.value.close())

// Ein Klick auf den abgedunkelten Rand trifft das dialog-Element selbst.
function randKlick(ereignis) {
  if (ereignis.target === dialog.value) melden('schliessen')
}
</script>

<template>
  <dialog
    ref="dialog"
    class="schublade"
    :aria-label="titel"
    @cancel.prevent="melden('schliessen')"
    @close="props.offen && melden('schliessen')"
    @click="randKlick"
  >
    <div class="schublade-inhalt">
      <header class="schublade-kopf">
        <span class="system-label">{{ titel }}</span>
        <button type="button" class="leiser-knopf" @click="melden('schliessen')">Schliessen</button>
      </header>
      <slot v-if="offen" />
    </div>
  </dialog>
</template>
