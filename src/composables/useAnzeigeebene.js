import { computed, reactive, readonly, watch } from 'vue'
import { bildrateMessen, webglVerfuegbar } from '../lib/anzeigebedingungen.js'

// Es gibt keinen Schalter. Die Vollfassung ist immer die Kino-Fassung; die
// erklaerbare Fassung ohne Effekte ist ein eigener Branch, keine Einstellung.
// Was die Anzeigeebene zurueckhaelt, sind deshalb ausschliesslich
// Geraetebedingungen, nie eine Vorliebe:
//   reduzierteBewegung  eine Betriebssystem-Einstellung, hat immer Vorrang
//   tabSichtbar         im Hintergrund waere jedes Bild verschwendet
//   heruntergestuft     gemessen zu langsam; was ruckelt, sieht billiger aus
//                       als kein Effekt
const zustand = reactive({
  bereit: false,
  reduzierteBewegung: false,
  webgl: false,
  tabSichtbar: false,
  heruntergestuft: false,
})
const lesbarerZustand = readonly(zustand)

// Effekte und 3D sind zwei verschiedene Fragen. Startsequenz und
// Glyphenaufloesung sind reines CSS und JS und laufen auch dort, wo kein
// WebGL bereitsteht.
const anzeigeebeneAktiv = computed(
  () =>
    zustand.bereit && zustand.tabSichtbar && !zustand.reduzierteBewegung && !zustand.heruntergestuft
)
// Nur hieran haengen Three.js-Szenen.
const webglAktiv = computed(() => anzeigeebeneAktiv.value && zustand.webgl)

let bewegungsAbfrage = null
let beobachtungBeenden = null
let messungBeenden = null

function bewegungAktualisieren() {
  zustand.reduzierteBewegung = bewegungsAbfrage.matches
}

function sichtbarkeitAktualisieren() {
  const sichtbar = document.visibilityState === 'visible'
  // Zurueckkehren ist der zweite Versuch. Frueher war das eine erneute
  // Moduswahl im Profil; ohne Schalter waere eine einmalige Herunterstufung
  // sonst bis zum Neuladen endgueltig, und genau das passiert bei einem
  // zugeklappten Laptop oder einem verdeckten Fenster am haeufigsten.
  if (sichtbar && !zustand.tabSichtbar) zustand.heruntergestuft = false
  zustand.tabSichtbar = sichtbar
}

// App.vue besitzt den Lebenszyklus; ein Routenwechsel darf nichts neu starten.
export function anzeigeebeneStarten() {
  if (zustand.bereit) return
  bewegungsAbfrage = matchMedia('(prefers-reduced-motion: reduce)')
  bewegungAktualisieren()
  sichtbarkeitAktualisieren()
  zustand.webgl = webglVerfuegbar()
  bewegungsAbfrage.addEventListener('change', bewegungAktualisieren)
  document.addEventListener('visibilitychange', sichtbarkeitAktualisieren)
  zustand.bereit = true
  // Gemessen wird nur, solange die Anzeigeebene tatsaechlich laeuft. Sobald
  // heruntergestuft ist, wird anzeigeebeneAktiv falsch und die Messung endet
  // von selbst, statt weiter jedes Bild Rechenzeit zu kosten.
  beobachtungBeenden = watch(
    anzeigeebeneAktiv,
    (messen) => {
      messungBeenden?.()
      messungBeenden = messen
        ? bildrateMessen(() => {
            // Nur Arbeitsspeicher: beim Neuladen beginnt eine neue Sitzung.
            zustand.heruntergestuft = true
          })
        : null
    },
    { immediate: true, flush: 'sync' }
  )
}

export function anzeigeebeneBeenden() {
  beobachtungBeenden?.()
  messungBeenden?.()
  bewegungsAbfrage?.removeEventListener('change', bewegungAktualisieren)
  document.removeEventListener('visibilitychange', sichtbarkeitAktualisieren)
  beobachtungBeenden = null
  messungBeenden = null
  bewegungsAbfrage = null
  zustand.bereit = false
}

export function useAnzeigeebene() {
  return { zustand: lesbarerZustand, anzeigeebeneAktiv, webglAktiv }
}

if (import.meta.hot) import.meta.hot.dispose(anzeigeebeneBeenden)
