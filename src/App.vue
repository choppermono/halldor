<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterView } from 'vue-router'
import Navigationsleiste from './components/Navigationsleiste.vue'
import KinoHintergrund from './components/KinoHintergrund.vue'
import KinoAuflage from './components/KinoAuflage.vue'

import {
  anzeigeebeneStarten,
  anzeigeebeneBeenden,
  useAnzeigeebene,
} from './composables/useAnzeigeebene.js'

const { zustand } = useAnzeigeebene()
onMounted(anzeigeebeneStarten)
onUnmounted(anzeigeebeneBeenden)

const startBeginn = performance.now()
const startZeigen = ref(false)
const eingaben = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'input', 'focusin']
function startBeenden() {
  startZeigen.value = false
}
onMounted(() => {
  try {
    if (!sessionStorage.getItem('trackify-start')) {
      sessionStorage.setItem('trackify-start', 'gesehen')
      startZeigen.value = true
    }
  } catch {
    /* Ohne Sitzungsmarker bleibt der Start ruhig. */
  }
  eingaben.forEach((art) =>
    window.addEventListener(art, startBeenden, { capture: true, passive: true })
  )
})
onUnmounted(() => eingaben.forEach((art) => window.removeEventListener(art, startBeenden, true)))

const navigationHoehe = ref()
function navigationAnpassen(hoehe) {
  navigationHoehe.value = hoehe
  // Auch der Browserfokus muss die feste Leiste als verdeckten Bereich kennen.
  document.documentElement.style.setProperty('--navigation-hoehe', hoehe)
}
onUnmounted(() => document.documentElement.style.removeProperty('--navigation-hoehe'))
const inhalt = ref(null)

// Der Sprunglink bleibt ein echter Anker, setzt den Fokus aber selbst.
// Sonst haengt der Browser #inhalt an die URL und legt einen History-Eintrag
// an; das naechste Browser-Zurueck fuehrt dann auf dieselbe Seite.
function zumInhalt() {
  inhalt.value?.focus()
}
</script>

<template>
  <div
    class="app-huelle"
    :data-ruhe="zustand.reduzierteBewegung"
    :style="{ '--navigation-hoehe': navigationHoehe }"
  >
    <KinoHintergrund />
    <KinoAuflage v-if="startZeigen" name="StartSequenz" :beginn="startBeginn" />
    <a class="sprunglink" href="#inhalt" @click.prevent="zumInhalt">Zum Inhalt</a>
    <header class="app-kopf">
      <span class="wortmarke">Trackify<span aria-hidden="true">.</span></span>
      <span class="system-label kopf-register">Ernährung &amp; Training</span>
    </header>
    <main id="inhalt" ref="inhalt" class="seiteninhalt" tabindex="-1">
      <div role="status" aria-live="polite" aria-atomic="true">
        <p v-if="zustand.heruntergestuft" class="routenhinweis">
          Wegen niedriger Bildrate auf die ruhige Darstellung gewechselt. Beim nächsten Wechsel
          zurück in dieses Fenster wird es erneut versucht.
        </p>
      </div>
      <RouterView />
    </main>
    <Navigationsleiste @hoehe="navigationAnpassen" />
  </div>
</template>
