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
  <section class="ansicht onboarding">
    <!-- Die grosse Schrift gehört der Frage im Schritt, nicht dem Seitentitel. -->
    <h1 class="system-label seitenrubrik">Deine Basis</h1>
    <ProfilFormular onboarding @gespeichert="router.push('/')" />
  </section>
</template>
