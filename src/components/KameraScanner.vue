<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { BarcodeFormat, BrowserMultiFormatOneDReader } from '@zxing/browser'
import KinoAuflage from './KinoAuflage.vue'

defineOptions({ name: 'KameraScanner' })

const props = defineProps({
  abfrageStatus: { type: String, default: 'bereit' },
  produktname: { type: String, default: '' },
  pruefzustand: { type: String, default: '' },
  pruefcode: { type: String, default: '' },
})
const melden = defineEmits(['erkannt'])

const video = ref(null)
const zustand = ref('vorbereiten')
const erkannterCode = ref('')
const ergebnisPunkte = ref([])
const videoMasse = ref({ breite: 0, hoehe: 0 })

let kameraStream
let scannerSteuerung
let zeitgeber
let laufNummer = 0

const fehlermeldungen = {
  unsicher:
    'Die Kamera ist hier gesperrt, weil diese Seite nicht über HTTPS geladen wurde. Öffne die HTTPS-Vorschau oder verwende das Eingabefeld.',
  erlaubnis:
    'Der Kamerazugriff wurde verweigert. Öffne das Schloss- oder Kamera-Symbol neben der Browseradresse, erlaube die Kamera und lade die Seite neu. Das Eingabefeld bleibt verfügbar.',
  keine_kamera:
    'Auf diesem Gerät ist keine Kamera verfügbar. Verwende stattdessen das Eingabefeld.',
  fehler:
    'Die Kamera konnte nicht gestartet werden. Verwende das Eingabefeld oder versuche es erneut.',
  zeitlimit:
    'Nach 15 Sekunden wurde kein Barcode erkannt. Du kannst erneut starten oder den Scanner abbrechen und den Code eintippen.',
}

const kameraAktiv = computed(() => zustand.value === 'sucht')
const fehlertext = computed(() => fehlermeldungen[zustand.value] ?? '')
const liveMeldung = computed(() => {
  if (props.abfrageStatus === 'treffer')
    return `Produkt gefunden: ${props.produktname}. Erkannter Barcode: ${erkannterCode.value}.`
  if (props.abfrageStatus === 'unbekannt')
    return `Produkt unbekannt. Open Food Facts kennt den Barcode ${erkannterCode.value} nicht. Von Hand eintragen.`
  if (zustand.value === 'erkannt')
    return `Barcode ${erkannterCode.value} erkannt. Produkt wird bei Open Food Facts gesucht.`
  if (zustand.value === 'sucht') return 'Kamera aktiv. Barcode in das Suchraster halten.'
  if (zustand.value === 'abgebrochen')
    return 'Scanner abgebrochen. Der Barcode kann in das Eingabefeld eingetragen werden.'
  return fehlertext.value
})

function ressourcenStoppen() {
  clearTimeout(zeitgeber)
  scannerSteuerung?.stop()
  scannerSteuerung = undefined
  kameraStream?.getTracks().forEach((spur) => spur.stop())
  kameraStream = undefined
  const elementStream = video.value?.srcObject
  if (globalThis.MediaStream && elementStream instanceof MediaStream)
    elementStream.getTracks().forEach((spur) => spur.stop())
  if (video.value) video.value.srcObject = null
}

function fehlerEinordnen(fehler) {
  if (fehler?.name === 'NotAllowedError' || fehler?.name === 'SecurityError') return 'erlaubnis'
  if (fehler?.name === 'NotFoundError' || fehler?.name === 'OverconstrainedError')
    return 'keine_kamera'
  return 'fehler'
}

function scannerAbbrechen() {
  ++laufNummer
  ressourcenStoppen()
  zustand.value = 'abgebrochen'
}

async function scannerStarten() {
  const dieseNummer = ++laufNummer
  ressourcenStoppen()
  erkannterCode.value = ''
  ergebnisPunkte.value = []
  videoMasse.value = { breite: 0, hoehe: 0 }

  if (!window.isSecureContext) {
    zustand.value = 'unsicher'
    return
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    zustand.value = 'keine_kamera'
    return
  }

  zustand.value = 'vorbereiten'
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: 'environment' } },
    })
    if (dieseNummer !== laufNummer) {
      stream.getTracks().forEach((spur) => spur.stop())
      return
    }
    if (!stream.getVideoTracks().length) {
      stream.getTracks().forEach((spur) => spur.stop())
      zustand.value = 'keine_kamera'
      return
    }

    kameraStream = stream
    const leser = new BrowserMultiFormatOneDReader()
    leser.possibleFormats = [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8]
    zustand.value = 'sucht'
    scannerSteuerung = await leser.decodeFromStream(stream, video.value, (ergebnis) => {
      if (!ergebnis || dieseNummer !== laufNummer || zustand.value !== 'sucht') return
      const format = ergebnis.getBarcodeFormat()
      if (format !== BarcodeFormat.EAN_13 && format !== BarcodeFormat.EAN_8) return
      const code = ergebnis.getText()
      if (!/^\d{8}$|^\d{13}$/.test(code)) return

      erkannterCode.value = code
      ergebnisPunkte.value = ergebnis.getResultPoints().map((punkt) => ({
        x: punkt.getX(),
        y: punkt.getY(),
      }))
      videoMasse.value = {
        breite: video.value?.videoWidth ?? 0,
        hoehe: video.value?.videoHeight ?? 0,
      }
      zustand.value = 'erkannt'
      ressourcenStoppen()
      melden('erkannt', code)
    })
    if (dieseNummer !== laufNummer) {
      scannerSteuerung?.stop()
      return
    }
    zeitgeber = setTimeout(() => {
      if (dieseNummer !== laufNummer || zustand.value !== 'sucht') return
      zustand.value = 'zeitlimit'
      ressourcenStoppen()
    }, 15000)
  } catch (fehler) {
    if (dieseNummer !== laufNummer) return
    ressourcenStoppen()
    zustand.value = fehlerEinordnen(fehler)
  }
}

function eingabefeldFokussieren() {
  document.querySelector('#barcode-eingabe')?.focus()
}

onMounted(() => {
  if (props.pruefzustand) {
    zustand.value = props.pruefzustand
    return
  }
  if (/^\d{8}$|^\d{13}$/.test(props.pruefcode)) {
    erkannterCode.value = props.pruefcode
    zustand.value = 'erkannt'
    melden('erkannt', props.pruefcode)
    return
  }
  scannerStarten()
})
onUnmounted(() => {
  ++laufNummer
  ressourcenStoppen()
})
</script>

<template>
  <section class="kamera-scanner" aria-labelledby="scanner-titel">
    <div class="scanner-kopf">
      <div>
        <p class="system-label">Kamera / EAN-13 + EAN-8</p>
        <h2 id="scanner-titel">Barcode scannen</h2>
      </div>
      <span class="scanner-zustand" aria-hidden="true">{{ kameraAktiv ? 'REC' : 'STBY' }}</span>
    </div>

    <div v-if="fehlertext" class="meldung scanner-meldung">
      <p>{{ fehlertext }}</p>
      <button type="button" class="textknopf" @click="eingabefeldFokussieren">
        Zum Eingabefeld
      </button>
    </div>

    <div class="scanner-aktionen">
      <button v-if="kameraAktiv" type="button" @click="scannerAbbrechen">Kamera anhalten</button>
      <template v-else-if="zustand === 'zeitlimit'">
        <button type="button" class="primaer" @click="scannerStarten">Erneut starten</button>
        <button type="button" @click="scannerAbbrechen">Scanner abbrechen</button>
      </template>
      <button
        v-else-if="['abgebrochen', 'erlaubnis', 'keine_kamera', 'fehler'].includes(zustand)"
        type="button"
        @click="scannerStarten"
      >
        Kamera erneut versuchen
      </button>
    </div>

    <div
      class="scanner-buehne"
      :class="{ 'scanner-buehne-inaktiv': !kameraAktiv && zustand !== 'erkannt' }"
    >
      <video ref="video" autoplay muted playsinline aria-label="Livebild der Kamera"></video>
      <div class="scanner-ruhemarken" aria-hidden="true">
        <i v-for="ecke in 4" :key="ecke"></i>
      </div>
      <KinoAuflage
        name="ScannerInszenierung"
        :zustand="zustand"
        :code="erkannterCode"
        :punkte="ergebnisPunkte"
        :video-masse="videoMasse"
        :abfrage-status="abfrageStatus"
        :produktname="produktname"
      />
    </div>

    <p v-if="erkannterCode" class="scanner-code">
      Erkannter Barcode: <output>{{ erkannterCode }}</output>
    </p>
    <div class="nur-vorlesbar" role="status" aria-live="assertive" aria-atomic="true">
      {{ liveMeldung }}
    </div>
  </section>
</template>
