<script setup>
import { computed } from 'vue'
import { useAnzeigeebene } from '../composables/useAnzeigeebene.js'

defineOptions({ name: 'ProfilAnsicht' })
const { zustand, anzeigeebeneAktiv, webglAktiv, modusWaehlen } = useAnzeigeebene()
const auswahl = [
  {
    wert: 'automatisch',
    titel: 'Automatisch',
    text: 'Passt sich deinem Gerät und deiner Bewegungseinstellung an.',
    nummer: '01',
  },
  {
    wert: 'an',
    titel: 'An',
    text: 'Erlaubt Bewegung auch bei reduzierter Bewegung oder geringer Leistung.',
    nummer: '02',
  },
  {
    wert: 'aus',
    titel: 'Aus',
    text: 'Die ruhige Darstellung. Alle Informationen bleiben erhalten.',
    nummer: '03',
  },
]
const erklaerung = computed(() => {
  if (!zustand.bereit) return 'Die Darstellung wird vorbereitet.'
  if (zustand.modus === 'aus') return 'Die ruhige Darstellung ist von dir gewählt.'
  if (!zustand.tabSichtbar) return 'Pausiert, solange dieser Tab im Hintergrund ist.'
  if (zustand.modus === 'an') return 'Die Anzeigeebene ist ausdrücklich eingeschaltet.'
  if (zustand.reduzierteBewegung)
    return 'Automatisch ausgeschaltet: Du hast reduzierte Bewegung eingestellt.'
  if (zustand.heruntergestuft)
    return 'Automatisch ausgeschaltet: Die Bildrate war zu niedrig. Wähle erneut, um es noch einmal zu versuchen.'
  return 'Dein Gerät und deine Bewegungseinstellung erlauben die Anzeigeebene.'
})
// Fehlendes WebGL nimmt nur die 3D-Szenen, nicht die Effekte aus CSS und JS.
const dreidHinweis = computed(() =>
  zustand.bereit && !zustand.webgl
    ? 'Dein Browser stellt keine 3D-Grafik bereit. Effekte ohne 3D bleiben verfügbar.'
    : ''
)
</script>

<template>
  <section class="ansicht profil" aria-labelledby="profil-titel">
    <p class="system-label seitenrubrik">Dein Dossier / Profil</p>
    <h1 id="profil-titel">Profil.</h1>
    <p class="profil-einleitung">Du entscheidest, wie ruhig Trackify bleibt.</p>

    <section id="kino" class="kino-einstellung" aria-labelledby="kino-titel">
      <div class="kino-kopf">
        <p class="system-label">Darstellung</p>
        <span class="system-label">01 / Präferenzen</span>
      </div>
      <h2 id="kino-titel">Kino-Modus</h2>
      <p id="kino-beschreibung" class="kino-beschreibung">
        Mehr Bewegung oder volle Ruhe. Deine Inhalte bleiben dieselben.
      </p>
      <fieldset class="kino-auswahl" aria-describedby="kino-beschreibung">
        <legend>Darstellung wählen</legend>
        <label
          v-for="option in auswahl"
          :key="option.wert"
          class="modus-option"
          :class="{ 'modus-gewaehlt': zustand.modus === option.wert }"
        >
          <input
            type="radio"
            name="kino-modus"
            :value="option.wert"
            :checked="zustand.modus === option.wert"
            :aria-labelledby="`modus-${option.wert}`"
            :aria-describedby="`beschreibung-${option.wert}`"
            @change="modusWaehlen(option.wert)"
          />
          <span class="modus-inhalt">
            <span class="modus-kopf">
              <strong :id="`modus-${option.wert}`">{{ option.titel }}</strong>
              <span class="modus-nummer" aria-hidden="true">{{ option.nummer }}</span>
            </span>
            <span :id="`beschreibung-${option.wert}`" class="modus-beschreibung">{{
              option.text
            }}</span>
          </span>
        </label>
      </fieldset>
      <div class="kino-status" role="status" aria-live="polite" aria-atomic="true">
        <p class="system-label">
          {{ anzeigeebeneAktiv ? 'Anzeigeebene aktiv' : 'Ruhefassung aktiv'
          }}<span v-if="anzeigeebeneAktiv"> · {{ webglAktiv ? '3D bereit' : 'ohne 3D' }}</span>
        </p>
        <p>{{ erklaerung }}</p>
        <p v-if="dreidHinweis">{{ dreidHinweis }}</p>
      </div>
      <p class="speicher-hinweis" role="status" aria-live="polite">{{ zustand.speicherHinweis }}</p>
      <p class="kino-fussnote">
        Bewegte Hintergründe sind optional. Die ruhige Darstellung bleibt vollständig.
      </p>
    </section>

    <div class="profil-ausblick">
      <p class="system-label">Als Nächstes</p>
      <h2>Persönliche Angaben</h2>
      <p>Profildaten und Ziele können noch nicht eingegeben oder gespeichert werden.</p>
    </div>
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
.modus-nummer {
  flex-shrink: 0;
  color: var(--farbe-text-leise);
  font: 400 var(--t-label) / var(--t-label-zh) var(--schrift-zahl);
  font-variant-numeric: tabular-nums;
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
