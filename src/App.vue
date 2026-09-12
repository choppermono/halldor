<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import Navigationsleiste from './components/Navigationsleiste.vue'
import KinoHintergrund from './components/KinoHintergrund.vue'

import {
  anzeigeebeneStarten,
  anzeigeebeneBeenden,
  useAnzeigeebene,
} from './composables/useAnzeigeebene.js'

const { zustand } = useAnzeigeebene()
onMounted(anzeigeebeneStarten)
onUnmounted(anzeigeebeneBeenden)

const navigationHoehe = ref()
const inhalt = ref(null)

// Der Sprunglink bleibt ein echter Anker, setzt den Fokus aber selbst.
// Sonst haengt der Browser #inhalt an die URL und legt einen History-Eintrag
// an; das naechste Browser-Zurueck fuehrt dann auf dieselbe Seite.
function zumInhalt() {
  inhalt.value?.focus()
}
</script>

<template>
  <div class="app-huelle" :style="{ '--navigation-hoehe': navigationHoehe }">
    <KinoHintergrund />
    <a class="sprunglink" href="#inhalt" @click.prevent="zumInhalt">Zum Inhalt</a>
    <header class="app-kopf">
      <span class="wortmarke">Trackify<span aria-hidden="true">.</span></span>
      <span class="system-label">Dein Dossier</span>
    </header>
    <main id="inhalt" ref="inhalt" class="seiteninhalt" tabindex="-1">
      <div role="status" aria-live="polite" aria-atomic="true">
        <p v-if="zustand.heruntergestuft && zustand.modus === 'automatisch'" class="routenhinweis">
          Wegen niedriger Bildrate auf die ruhige Darstellung gewechselt.
          <RouterLink to="/profil#kino">Im Profil kannst du es erneut versuchen.</RouterLink>
        </p>
      </div>
      <RouterView />
    </main>
    <Navigationsleiste @hoehe="navigationHoehe = $event" />
  </div>
</template>
