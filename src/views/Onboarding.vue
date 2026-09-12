<script setup>
import { useRouter } from 'vue-router'
import ProfilFormular from '../components/ProfilFormular.vue'
import { useProfil } from '../composables/useProfil.js'
defineOptions({ name: 'OnboardingAnsicht' })
const router = useRouter()
const { profilLaden } = useProfil()
profilLaden()
</script>
<template>
  <section class="ansicht">
    <p class="system-label seitenrubrik">Ernährung / Einrichtung</p>
    <h1>Deine Basis.</h1>
    <p class="einleitung">Körperdaten eingeben. Schätzung prüfen. Tagesziel festhalten.</p>
    <ProfilFormular onboarding @gespeichert="router.push('/')" />
  </section>
</template>
