<script setup>
import { useProfil } from '../composables/useProfil.js'
import ProfilFormular from '../components/ProfilFormular.vue'

defineOptions({ name: 'ProfilAnsicht' })
const { profilLaden } = useProfil()
profilLaden()
</script>

<template>
  <section class="ansicht profil" aria-labelledby="profil-titel">
    <p class="system-label seitenrubrik">Dein Dossier / Profil</p>
    <h1 id="profil-titel">Profil.</h1>
    <p class="profil-einleitung">Körperdaten und Rechenweg.</p>
    <ProfilFormular />
  </section>
</template>

<style scoped>
.profil h1 {
  margin-bottom: var(--a-3);
}
.profil-einleitung {
  margin: 0 0 var(--a-12);
  color: var(--farbe-text-leise);
  font-size: var(--t-basis);
  line-height: var(--t-basis-zh);
}
.kino-einstellung {
  margin-top: var(--a-12);
  border-top: var(--linien-breite) solid var(--farbe-linie-stark);
  scroll-margin-top: var(--a-6);
}
.kino-kopf {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--a-3);
  padding-block: var(--a-6);
}
h2 {
  margin: 0 0 var(--a-3);
  font: 500 var(--t-zahl-l) / var(--t-seitentitel-zh) var(--schrift-display);
}
.kino-beschreibung,
.profil-ausblick > p:last-child {
  margin: 0;
  color: var(--farbe-text-leise);
  font-size: var(--t-basis);
  line-height: var(--t-basis-zh);
}
.kino-auswahl {
  display: grid;
  min-width: 0;
  gap: var(--a-3);
  margin: var(--a-8) 0;
  padding: 0;
  border: 0;
}
legend {
  margin-bottom: var(--a-4);
  padding: 0;
  font-size: var(--t-klein);
  color: var(--farbe-text-leise);
}
.modus-option {
  display: flex;
  align-items: flex-start;
  gap: var(--profil-abstand);
  min-height: var(--treffer-min);
  padding: var(--profil-polster);
  border: var(--linien-breite) solid var(--farbe-linie-stark);
  background: var(--farbe-flaeche);
  cursor: pointer;
}
.modus-gewaehlt {
  border-color: var(--farbe-text);
  box-shadow: inset var(--markierungs-breite) 0 var(--farbe-akzent);
  background: var(--farbe-flaeche-hell);
}
.modus-option:has(input:focus-visible) {
  outline: var(--fokus-breite) solid var(--farbe-auf-akzent);
  outline-offset: var(--fokus-abstand);
}
input {
  flex-shrink: 0;
  width: var(--profil-radio);
  height: var(--profil-radio);
  margin: var(--a-1) 0 0;
  accent-color: var(--farbe-akzent);
}
.modus-inhalt {
  min-width: 0;
  flex: 1;
}
.modus-kopf {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--a-3);
  font-size: var(--t-basis);
  line-height: var(--t-basis-zh);
}
.modus-beschreibung {
  display: block;
  margin-top: var(--a-2);
  font-size: var(--t-klein);
  line-height: var(--t-klein-zh);
  color: var(--farbe-text-leise);
}
.kino-status {
  padding: var(--a-4) 0 var(--a-4) var(--a-4);
  border-left: var(--markierungs-breite) solid var(--farbe-text-leise);
}
.kino-status > p:last-child {
  margin: var(--a-2) 0 0;
  font-size: var(--t-klein);
  line-height: var(--t-klein-zh);
}
.speicher-hinweis {
  color: var(--farbe-text);
  font-size: var(--t-klein);
  line-height: var(--t-klein-zh);
}
.speicher-hinweis:not(:empty)::before {
  content: '! ';
  font-weight: 600;
}
.speicher-hinweis:empty {
  margin: 0;
}
.kino-fussnote {
  margin: var(--a-6) 0 0;
  padding-top: var(--a-6);
  border-top: var(--linien-breite) solid var(--farbe-linie);
  color: var(--farbe-text-leise);
  font-size: var(--t-klein);
  line-height: var(--t-klein-zh);
}
.profil-ausblick {
  margin-top: var(--a-12);
  padding-top: var(--a-6);
  border-top: var(--linien-breite) solid var(--farbe-linie);
}
.profil-ausblick h2 {
  margin-top: var(--a-4);
  font-size: var(--t-zahl-m);
}
</style>
