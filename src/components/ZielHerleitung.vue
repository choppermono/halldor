<script setup>
import { REGELN } from '../lib/ernaehrung.js'
import { kalorien, zahl } from '../lib/darstellung.js'
defineProps({ ergebnis: { type: Object, required: true } })
</script>

<template>
  <section class="ziel-herleitung abschnitt" aria-labelledby="ziel-titel">
    <p class="system-label">Schätzung / pro Tag</p>
    <h2 id="ziel-titel">Dein Rechenweg</h2>
    <template v-if="ergebnis.status === 'ok'">
      <p class="ziel-zahl">Etwa {{ kalorien(ergebnis.wert.kcal) }} <span>kcal</span></p>
      <dl class="messwerte">
        <div>
          <dt>Protein</dt>
          <dd>{{ zahl(ergebnis.wert.proteinG) }} g</dd>
        </div>
        <div>
          <dt>Fett</dt>
          <dd>{{ zahl(ergebnis.wert.fettG) }} g</dd>
        </div>
        <div>
          <dt>Kohlenhydrate</dt>
          <dd>{{ zahl(ergebnis.wert.kohlenhydrateG) }} g</dd>
        </div>
      </dl>
      <p class="klein">
        Das Kalorienziel ist führend. Makros sind auf ganze Gramm gerundet; ihre zurückgerechnete
        Energie stimmt deshalb nicht exakt mit dem auf {{ REGELN.kcalRundung }} kcal gerundeten Ziel
        überein.
      </p>
    </template>
    <div v-else class="meldung" role="status">
      <p>{{ ergebnis.meldung }}</p>
      <p v-if="ergebnis.hoechsteRateProzent !== undefined">
        <template v-if="ergebnis.hoechsteRateProzent !== null"
          >Rechnerisch höchste Rate: {{ zahl(ergebnis.hoechsteRateProzent, 6) }} % pro
          Woche.</template
        >
        <template v-else>Auch ohne Defizit passen die Makros nicht in den Kalorienrahmen.</template>
        <template v-if="!ergebnis.rateInSpanne">
          In der auswählbaren Spanne gibt es keine gültige Abnehmrate. Prüfe deine Angaben oder
          wähle ein anderes Ziel.</template
        >
      </p>
    </div>
    <template
      v-if="ergebnis.herleitung?.bmrKcal !== null && ergebnis.herleitung?.bmrKcal !== undefined"
    >
      <dl class="rechenweg">
        <div>
          <dt>Grundlage</dt>
          <dd>
            {{ zahl(ergebnis.herleitung.gewichtKg, 1) }} kg ·
            {{ zahl(ergebnis.herleitung.groesseCm, 1) }} cm · {{ ergebnis.herleitung.alter }} Jahre
            · {{ ergebnis.herleitung.stichtag }}
          </dd>
        </div>
        <div>
          <dt>Mifflin-St Jeor · belegt</dt>
          <dd>
            {{ ergebnis.herleitung.rechnung }}<br />Grundumsatz: etwa
            {{ kalorien(ergebnis.herleitung.bmrKcal) }} kcal
          </dd>
        </div>
        <div>
          <dt>Gesamtumsatz · Faustregel</dt>
          <dd>
            Grundumsatz × {{ ergebnis.herleitung.aktivitaet }} = etwa
            {{ kalorien(ergebnis.herleitung.tdeeKcal) }} kcal. Primärquelle des Aktivitätsfaktors
            offen.
          </dd>
        </div>
        <div>
          <dt>Tempo zuerst</dt>
          <dd>
            {{ zahl(ergebnis.herleitung.rateProzent, 6) }} % ×
            {{ zahl(ergebnis.herleitung.gewichtKg, 1) }} kg / 100 =
            {{ zahl(ergebnis.herleitung.kgJeWoche, 3) }} kg pro Woche.<br />×
            {{ REGELN.kcalJeKg }} kcal/kg / {{ REGELN.tageJeWoche }} = etwa
            {{ kalorien(ergebnis.herleitung.aenderungKcal) }} kcal
            {{ ergebnis.herleitung.ziel === 'abnehmen' ? 'Defizit' : 'Zuschlag' }} pro Tag.
          </dd>
        </div>
        <div>
          <dt>Umrechnung · Faustregel</dt>
          <dd>
            {{ REGELN.kcalJeKg }} kcal je kg ist eine vereinfachte Annahme, Primärquelle offen. Die
            Rate ist für Gewichtsverlust belegt; ihre Übertragung auf Aufbau ist unbelegt.
          </dd>
        </div>
        <div>
          <dt>Aufteilung</dt>
          <dd>
            Protein: {{ REGELN.proteinJeKg }} g/kg (Morton et al., Erwachsene mit Krafttraining;
            obere Intervallgrenze {{ REGELN.proteinMaximumJeKg }} g/kg). Fett:
            {{ REGELN.fettJeKg }} g/kg (Faustregel). Verbleibende Energie /
            {{ REGELN.energie.kohlenhydrate }} ergibt Kohlenhydrate.
          </dd>
        </div>
      </dl>
    </template>
    <p class="klein">
      Eine Schätzung, keine Messung. Die rechnerische Makrogrenze prüft nur, ob Protein und Fett
      hineinpassen; sie bestätigt keine medizinisch ausreichende Energiezufuhr. Für Jugendliche ist
      die Erwachsenenformel besonders eingeschränkt.
    </p>
    <p class="klein quellen">
      Quellen:
      <a href="https://pubmed.ncbi.nlm.nih.gov/2305711/" target="_blank" rel="noreferrer"
        >Mifflin-St Jeor</a
      >,
      <a href="https://pubmed.ncbi.nlm.nih.gov/28698222/" target="_blank" rel="noreferrer"
        >Morton 2018</a
      >,
      <a href="https://pubmed.ncbi.nlm.nih.gov/24864135/" target="_blank" rel="noreferrer"
        >Helms 2014</a
      >.
    </p>
  </section>
</template>
