import { nextTick } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import Heute from '../views/Heute.vue'

// Nur Heute ist im Startpaket; die anderen Seiten laden beim ersten Besuch
// und werden danach im Leerlauf vorgeholt (siehe unten).
const Training = () => import('../views/Training.vue')
const Rang = () => import('../views/Rang.vue')
const Profil = () => import('../views/Profil.vue')
const Onboarding = () => import('../views/Onboarding.vue')
const ProduktBestaetigen = () => import('../views/ProduktBestaetigen.vue')
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

// Nach dem ersten Bild die Hauptreiter vorholen, damit der Wechsel sofort geht.
router.isReady().then(() => {
  const vorholen = () => [Training, Rang, Profil].forEach((laden) => laden().catch(() => {}))
  if ('requestIdleCallback' in window) requestIdleCallback(vorholen, { timeout: 2500 })
  else setTimeout(vorholen, 1500)
})

export default router
