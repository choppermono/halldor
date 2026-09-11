<script setup>
import { ref } from 'vue'
import { RouterView } from 'vue-router'
import Navigationsleiste from './components/Navigationsleiste.vue'

const navigationHoehe = ref()
</script>

<template>
  <div class="app-huelle" :style="{ '--navigation-hoehe': navigationHoehe }">
    <a class="sprunglink" href="#inhalt">Zum Inhalt</a>
    <header class="app-kopf">
      <span class="wortmarke">Trackify<span aria-hidden="true">.</span></span>
      <span class="system-label">Dein Dossier</span>
    </header>
    <main id="inhalt" class="seiteninhalt" tabindex="-1">
      <RouterView />
    </main>
    <Navigationsleiste @hoehe="navigationHoehe = $event" />
  </div>
</template>
