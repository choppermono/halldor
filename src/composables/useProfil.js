import { reactive, readonly } from 'vue'
import { dokumentLaden, dokumentSpeichern, Speicherstatus } from '../lib/speicher.js'
import { profilPruefen } from '../lib/ernaehrung.js'
import { speicherLesbar, speicherhinweis } from '../lib/speicherhinweis.js'

const zustand = reactive({ profil: null, hinweis: '' })
const lesbar = readonly(zustand)
let geladenerProfiltext = 'null'
function profilLaden() {
  const bestand = dokumentLaden()
  zustand.profil = bestand.dokument.profil
  geladenerProfiltext = JSON.stringify(zustand.profil)
  zustand.hinweis = speicherhinweis(bestand.status)
}
function profilSpeichern(profil, stichtag) {
  const pruefung = profilPruefen(profil, stichtag)
  if (pruefung.status !== 'ok') return pruefung
  const bestand = dokumentLaden()
  if (!speicherLesbar(bestand.status))
    return { status: bestand.status, meldung: speicherhinweis(bestand.status) }
  if (JSON.stringify(bestand.dokument.profil) !== geladenerProfiltext)
    return {
      status: Speicherstatus.veralteterStand,
      meldung: speicherhinweis(Speicherstatus.veralteterStand),
    }
  const ergebnis = dokumentSpeichern({
    ...bestand.dokument,
    profil: JSON.parse(JSON.stringify(profil)),
  })
  zustand.hinweis = speicherhinweis(ergebnis.status)
  if (ergebnis.status !== Speicherstatus.gespeichert)
    return { status: ergebnis.status, meldung: zustand.hinweis }
  zustand.profil = ergebnis.dokument.profil
  geladenerProfiltext = JSON.stringify(zustand.profil)
  return { status: 'ok' }
}
profilLaden()
export function useProfil() {
  return { zustand: lesbar, profilLaden, profilSpeichern }
}
