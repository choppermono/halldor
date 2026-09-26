<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { BarcodeFormat, BrowserMultiFormatOneDReader } from '@zxing/browser'
import SystemSymbol from './SystemSymbol.vue'

defineOptions({ name: 'VollbildScanner' })

// Der Scanner füllt den ganzen Bildschirm, wie bei Bezahl-Apps: nur Kamera,
// Sucherrahmen und ein Ausgang. Er wird erst eingehängt, wenn jemand auf
// «Produkt scannen» tippt; erst dann fragt der Browser nach der Kamera.
const melden = defineEmits(['erkannt', 'schliessen', 'eintippen'])

const dialog = ref(null)
const video = ref(null)
const zustand = ref('vorbereiten')
const code = ref('')
const lichtVerfuegbar = ref(false)
const lichtAn = ref(false)

let stream
let steuerung
let zeitgeber
let laufNummer = 0

const meldungen = {
  unsicher: 'Die Kamera braucht eine sichere Verbindung (HTTPS).',
  erlaubnis:
    'Kamerazugriff verweigert. Erlaube die Kamera in den Browser-Einstellungen und versuche es erneut.',
  keine_kamera: 'Auf diesem Gerät ist keine Kamera verfügbar.',
  fehler: 'Die Kamera konnte nicht gestartet werden.',
  zeitlimit: 'Kein Barcode erkannt. Halte ihn ruhig und gut beleuchtet in den Rahmen.',
}
const fehlertext = computed(() => meldungen[zustand.value] ?? '')

function stoppen() {
  clearTimeout(zeitgeber)
  steuerung?.stop()
  steuerung = undefined
  stream?.getTracks().forEach((spur) => spur.stop())
  stream = undefined
  if (video.value) video.value.srcObject = null
  lichtAn.value = false
}

async function starten() {
  const nummer = ++laufNummer
  stoppen()
  code.value = ''
  if (!window.isSecureContext) return (zustand.value = 'unsicher')
  if (!navigator.mediaDevices?.getUserMedia) return (zustand.value = 'keine_kamera')
  zustand.value = 'vorbereiten'
  try {
    const neu = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: 'environment' } },
    })
    if (nummer !== laufNummer) return neu.getTracks().forEach((spur) => spur.stop())
    stream = neu
    const spur = neu.getVideoTracks()[0]
    lichtVerfuegbar.value = Boolean(spur?.getCapabilities?.().torch)
    const leser = new BrowserMultiFormatOneDReader()
    leser.possibleFormats = [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8]
    zustand.value = 'sucht'
    steuerung = await leser.decodeFromStream(neu, video.value, (ergebnis) => {
      if (!ergebnis || nummer !== laufNummer || zustand.value !== 'sucht') return
      const text = ergebnis.getText()
      // Nur der erkannte Zahlencode verlässt den Scanner, kein Bild.
      if (!/^\d{8}$|^\d{13}$/.test(text)) return
      code.value = text
      zustand.value = 'erkannt'
      navigator.vibrate?.(40)
      stoppen()
      setTimeout(() => melden('erkannt', text), 350)
    })
    zeitgeber = setTimeout(() => {
      if (nummer !== laufNummer || zustand.value !== 'sucht') return
      stoppen()
      zustand.value = 'zeitlimit'
    }, 20000)
  } catch (fehler) {
    if (nummer !== laufNummer) return
    stoppen()
    zustand.value =
      fehler?.name === 'NotAllowedError' || fehler?.name === 'SecurityError'
        ? 'erlaubnis'
        : fehler?.name === 'NotFoundError' || fehler?.name === 'OverconstrainedError'
          ? 'keine_kamera'
          : 'fehler'
  }
}

async function lichtUmschalten() {
  const spur = stream?.getVideoTracks()[0]
  if (!spur) return
  try {
    await spur.applyConstraints({ advanced: [{ torch: !lichtAn.value }] })
    lichtAn.value = !lichtAn.value
  } catch {
    lichtVerfuegbar.value = false
  }
}

onMounted(() => {
  dialog.value?.showModal()
  starten()
})
onUnmounted(() => {
  ++laufNummer
  stoppen()
})
</script>

<template>
  <dialog
    ref="dialog"
    class="vollbild-scanner"
    :data-zustand="zustand"
    aria-label="Barcode scannen"
    @cancel.prevent="melden('schliessen')"
  >
    <video ref="video" autoplay muted playsinline aria-hidden="true"></video>

    <div class="sucher" aria-hidden="true">
      <i></i><i></i><i></i><i></i>
      <span v-if="zustand === 'sucht'" class="sucher-linie"></span>
    </div>

    <header class="scanner-leiste">
      <button
        type="button"
        class="rund-knopf"
        aria-label="Scanner schliessen"
        @click="melden('schliessen')"
      >
        <SystemSymbol name="schliessen" />
      </button>
      <span class="system-label">Barcode scannen</span>
      <button
        v-if="lichtVerfuegbar"
        type="button"
        class="rund-knopf"
        :aria-pressed="lichtAn"
        aria-label="Taschenlampe"
        @click="lichtUmschalten"
      >
        <SystemSymbol name="licht" />
      </button>
      <span v-else class="rund-platz" aria-hidden="true"></span>
    </header>

    <div class="scanner-fuss">
      <p v-if="fehlertext" class="scanner-fehler" role="alert">{{ fehlertext }}</p>
      <p v-else-if="zustand === 'erkannt'" class="scanner-treffer" role="status">
        <span class="system-label">Erkannt</span>
        <strong>{{ code }}</strong>
      </p>
      <p v-else class="scanner-anleitung" role="status">
        {{ zustand === 'sucht' ? 'Barcode in den Rahmen halten' : 'Kamera startet …' }}
      </p>
      <div class="scanner-aktionen-unten">
        <button
          v-if="['zeitlimit', 'fehler', 'erlaubnis'].includes(zustand)"
          type="button"
          class="primaer"
          @click="starten"
        >
          Erneut versuchen
        </button>
        <button type="button" class="glas-knopf" @click="melden('eintippen')">
          Barcode eintippen
        </button>
      </div>
    </div>
  </dialog>
</template>
