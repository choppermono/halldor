import { createRouter, createWebHistory } from 'vue-router'
import Heute from '../views/Heute.vue'
import Training from '../views/Training.vue'
import Rang from '../views/Rang.vue'
import Profil from '../views/Profil.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'Heute', component: Heute },
    { path: '/training', name: 'Training', component: Training },
    { path: '/rang', name: 'Rang', component: Rang },
    { path: '/profil', name: 'Profil', component: Profil },
    { path: '/:pfad(.*)*', redirect: '/' },
  ],
  scrollBehavior(ziel, ursprung, gespeichertePosition) {
    return gespeichertePosition ?? { top: 0 }
  },
})

router.afterEach((ziel) => {
  document.title = `${ziel.name} · Trackify`
})

export default router
