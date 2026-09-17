import { nextTick } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import Heute from '../views/Heute.vue'
import Training from '../views/Training.vue'
import Rang from '../views/Rang.vue'
import Profil from '../views/Profil.vue'
import Onboarding from '../views/Onboarding.vue'
import ProduktBestaetigen from '../views/ProduktBestaetigen.vue'

const Scan = () => import('../views/Scan.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'Heute', component: Heute, meta: { titel: 'Heute' } },
    { path: '/training', name: 'Training', component: Training, meta: { titel: 'Training' } },
    { path: '/rang', name: 'Rang', component: Rang, meta: { titel: 'Rang' } },
    { path: '/profil', name: 'Profil', component: Profil, meta: { titel: 'Profil' } },
    { path: '/scan', name: 'Scan', component: Scan, meta: { titel: 'Barcode scannen' } },
    {
      path: '/onboarding',
      name: 'Onboarding',
      component: Onboarding,
      meta: { titel: 'Einrichtung' },
    },
    {
      path: '/produkt',
      name: 'ProduktBestaetigen',
      component: ProduktBestaetigen,
      meta: { titel: 'Produkt erfassen' },
    },
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
const reihenfolge = ['/', '/produkt', '/training', '/rang', '/scan', '/profil', '/onboarding']
router.beforeEach((ziel, ursprung) => {
  document.documentElement.style.setProperty(
    '--seitenrichtung',
    reihenfolge.indexOf(ziel.path) < reihenfolge.indexOf(ursprung.path) ? '-1' : '1'
  )
})
router.afterEach((ziel, ursprung, fehler) => {
  if (fehler) return
  document.title = ziel.meta.titel ? `${ziel.meta.titel} · Trackify` : 'Trackify'
  // Kein Fokusverlust beim Wechsel per Tastatur; Datumsaenderungen bleiben am Register.
  if (ursprung.matched.length && ziel.path !== ursprung.path)
    nextTick(() => {
      const titel = document.querySelector('main h1')
      titel?.setAttribute('tabindex', '-1')
      titel?.focus({ preventScroll: true })
    })
})

export default router
