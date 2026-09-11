<script setup>
import { ref } from 'vue'
import { RouterView } from 'vue-router'
import Navigationsleiste from './components/Navigationsleiste.vue'

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
    <a class="sprunglink" href="#inhalt" @click.prevent="zumInhalt">Zum Inhalt</a>
    <header class="app-kopf">
      <span class="wortmarke">Trackify<span aria-hidden="true">.</span></span>
      <span class="system-label">Dein Dossier</span>
    </header>
    <main id="inhalt" ref="inhalt" class="seiteninhalt" tabindex="-1">
      <RouterView />
    </main>
    <Navigationsleiste @hoehe="navigationHoehe = $event" />
  </div>
</template>
