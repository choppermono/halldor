import { computed, reactive, readonly, watch } from 'vue'
import { dokumentLaden, dokumentSpeichern, Speicherstatus } from '../lib/speicher.js'
import { bildrateMessen, webglVerfuegbar } from '../lib/anzeigebedingungen.js'

const modi = ['automatisch', 'an', 'aus']
const zustand = reactive({
  modus: 'automatisch',
  bereit: false,
  reduzierteBewegung: false,
  webgl: false,
  tabSichtbar: false,
  heruntergestuft: false,
  speicherHinweis: '',
})
const lesbarerZustand = readonly(zustand)
const anzeigeebeneAktiv = computed(
  () =>
    zustand.bereit &&
    zustand.tabSichtbar &&
    zustand.webgl &&
    (zustand.modus === 'an' ||
      (zustand.modus === 'automatisch' && !zustand.reduzierteBewegung && !zustand.heruntergestuft))
)
let bewegungsAbfrage = null
let beobachtungBeenden = null
let messungBeenden = null

function speicherproblemBeschreiben(status) {
  if (status === Speicherstatus.leer || status === Speicherstatus.geladen) return ''
  if (status === Speicherstatus.speicherVoll)
    return 'Der Gerätespeicher ist voll. Deine Auswahl gilt nur bis zum Neuladen.'
  if (status === Speicherstatus.nichtVerfuegbar)
    return 'Speichern ist gerade nicht möglich. Deine Auswahl gilt nur bis zum Neuladen.'
  if (status === Speicherstatus.veralteterStand)
    return 'Ein anderer Tab hat Daten geändert. Wähle den Modus erneut, um ihn zu speichern.'
  return 'Die gespeicherten Daten können nicht übernommen werden und bleiben unverändert. Deine Auswahl gilt nur bis zum Neuladen.'
}

function modusWaehlen(modus) {
  if (!modi.includes(modus)) return
  zustand.modus = modus
  // Frisch laden: spätere Profil- oder Tagebuchänderungen nicht zurückschreiben.
  const bestand = dokumentLaden()
  if (bestand.status !== Speicherstatus.leer && bestand.status !== Speicherstatus.geladen) {
    zustand.speicherHinweis = speicherproblemBeschreiben(bestand.status)
    return
  }
  const ergebnis = dokumentSpeichern({
    ...bestand.dokument,
    einstellungen: { ...bestand.dokument.einstellungen, kinoModus: modus },
  })
  zustand.speicherHinweis =
    ergebnis.status === Speicherstatus.gespeichert
      ? ''
      : speicherproblemBeschreiben(ergebnis.status)
}

function bewegungAktualisieren() {
  zustand.reduzierteBewegung = bewegungsAbfrage.matches
}

function sichtbarkeitAktualisieren() {
  zustand.tabSichtbar = document.visibilityState === 'visible'
}

// App.vue besitzt den Lebenszyklus; ein Routenwechsel darf nichts neu starten.
export function anzeigeebeneStarten() {
  if (zustand.bereit) return
  const geladen = dokumentLaden()
  const gespeichert = geladen.dokument.einstellungen.kinoModus
  zustand.modus = modi.includes(gespeichert) ? gespeichert : 'automatisch'
  zustand.speicherHinweis = speicherproblemBeschreiben(geladen.status)
  if (gespeichert !== undefined && !modi.includes(gespeichert)) {
    zustand.speicherHinweis =
      'Der gespeicherte Modus ist unbekannt. Automatisch gilt, bis du neu wählst.'
  }
  bewegungsAbfrage = matchMedia('(prefers-reduced-motion: reduce)')
  bewegungAktualisieren()
  sichtbarkeitAktualisieren()
  zustand.webgl = webglVerfuegbar()
  bewegungsAbfrage.addEventListener('change', bewegungAktualisieren)
  document.addEventListener('visibilitychange', sichtbarkeitAktualisieren)
  zustand.bereit = true
  beobachtungBeenden = watch(
    () => anzeigeebeneAktiv.value && !zustand.heruntergestuft,
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
  return { zustand: lesbarerZustand, anzeigeebeneAktiv, modusWaehlen }
}

if (import.meta.hot) import.meta.hot.dispose(anzeigeebeneBeenden)
