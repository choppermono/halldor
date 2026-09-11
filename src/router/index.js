import { createRouter, createWebHistory } from 'vue-router'
import Heute from '../views/Heute.vue'
import Training from '../views/Training.vue'
import Rang from '../views/Rang.vue'
import Profil from '../views/Profil.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'Heute', component: Heute, meta: { titel: 'Heute' } },
    { path: '/training', name: 'Training', component: Training, meta: { titel: 'Training' } },
    { path: '/rang', name: 'Rang', component: Rang, meta: { titel: 'Rang' } },
    { path: '/profil', name: 'Profil', component: Profil, meta: { titel: 'Profil' } },
    { path: '/:pfad(.*)*', redirect: '/' },
  ],
  scrollBehavior(ziel, ursprung, gespeichertePosition) {
    if (gespeichertePosition) return gespeichertePosition
    // Ein Anker im Ziel schlaegt den Seitenanfang, sonst beginnt jede Seite oben.
    if (ziel.hash) return { el: ziel.hash }
    return { top: 0 }
  },
})

// Der Titel haengt bewusst an meta.titel und nicht am Routennamen: eine
// spaetere Route ohne Namen wuerde sonst still «undefined · Trackify» zeigen.
router.afterEach((ziel) => {
  document.title = ziel.meta.titel ? `${ziel.meta.titel} · Trackify` : 'Trackify'
})

export default router
