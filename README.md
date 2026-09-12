# ascend

Fitness-Webapp für das Modul **IPT 4.1 Webentwicklung II** am BBZW Luzern.

Barcode-Scan für Nährwerte, Kalorien- und Makroziel aus eigener Berechnung,
ein selbst entwickeltes Trainingsprogramm und ein Rang-System aus den
geloggten Sätzen — in einer Oberfläche.

## Stand

Das Ernährungs-MVP ist implementiert: Onboarding, nachvollziehbare Zielberechnung,
manuelle Produkte und eingetippte Barcodes, Gramm-Mengen, Tagesbilanz und Rückblick.
Die Kamera gehört in ein späteres Paket.

| Stufe | Inhalt                                                                | Stand                              |
| ----- | --------------------------------------------------------------------- | ---------------------------------- |
| 1     | Ernährung: Onboarding, Zielberechnung, manuelle Barcodes, Tagesbilanz | MVP umgesetzt; Kamera/Deploy offen |
| 2     | Training: Programmvarianten, Satz-Logging, Progression                | offen                              |
| 3     | Rang: 1RM je Übung, Stufen                                            | offen                              |

## Starten

```bash
npm install
npm run dev
```

| Befehl             | Wirkung                                   |
| ------------------ | ----------------------------------------- |
| `npm run dev`      | Entwicklungsserver                        |
| `npm run dev:host` | zusätzlich im lokalen Netzwerk erreichbar |
| `npm run lint`     | ESLint über das Projekt                   |
| `npm run format`   | Prettier schreibt Formatierung            |
| `npm run build`    | Produktionsbuild nach `dist/`             |

> **Die Kamera braucht HTTPS.** Über `http://192.168.x.x` bleibt sie am Handy
> stumm, auch wenn am Laptop alles läuft. Das ist eine Browser-Sicherheitsregel
> und kein Fehler im Code. Zum Testen am Handy die HTTPS-Deploy-Vorschau nehmen.

## Technik

|           |                                                                        |
| --------- | ---------------------------------------------------------------------- |
| Build     | Vite                                                                   |
| Framework | Vue 3, Composition API, `<script setup>`                               |
| Zustand   | eigene Composables, kein Store-Paket                                   |
| Routing   | vue-router                                                             |
| Daten     | `localStorage`, gekapselt in einem Modul — **kein Konto, kein Server** |
| Barcode   | `@zxing/browser`                                                       |

Profil und Tagebuch bleiben im Gerätespeicher. Nur ein ausdrücklich abgefragter
Barcode wird an Open Food Facts gesendet. Es gibt kein Konto und keine Cloud-Synchronisation.

## Ernährungs-MVP

Von Heute aus «Profil einrichten» wählen. Das Profil zeigt Formel, Eingabewerte,
Grund- und Gesamtumsatz, Änderungsrate und Makroaufteilung. «Produkt erfassen»
führt über manuelle Angaben oder einen eingetippten Barcode zur Gramm-Bestätigung.
Leere Nährwertfelder bedeuten unbekannt; Teilsummen werden als unvollständig benannt.
Die Datumsauswahl öffnet vergangene Tage. Bereits angelegte Ziele und Produktdaten
bleiben auch nach Profiländerungen und Neuladen unverändert.

Fachliche Zahlen mit Quellen und Evidenzeinstufung: `src/lib/ernaehrung.js`.
Die App hat keine feste Kalorienuntergrenze. Reicht der Kalorienrahmen nicht für
Protein und Fett, wird kein Makroziel ausgegeben; die höchste rechnerisch passende
Rate wird genannt. Diese Grenze bestätigt keine gesundheitlich ausreichende Zufuhr.
Unter 18 ist das Abnehmziel im Rechenkern gesperrt.

Schema bleibt Version 1. Ergänzungen: `profil.aenderungsrateProzent` (ohne Feld
gilt 0.5), `null` für unbekannte Nährwerte sowie Herleitung und Erfassungsdatum
am eingefrorenen Tagesziel. Intern wird ungerundet gerechnet und gespeichert;
die Ausgabe rundet Kalorien auf 50 und Makros auf ganze Gramm. Die daraus
entstehenden Rundungsabweichungen sind sichtbar erklärt.

Ein erstmals nachgetragener Tag friert das beim Erfassen gültige Ziel ein.
Es gibt keine vollständige historische Profilversion, aus der sich ein früheres
Ziel rekonstruieren liesse. Löschen aller Einträge entfernt das Tagesziel nicht.
Ein fachlich gültiges Profil mit rechnerisch unmöglichen Makros darf gespeichert
werden; für neue Tage muss zuerst ein berechenbares Ziel gewählt werden.

Ohne Netz bleiben der bereits geöffnete Verlauf, Datumswechsel und Erfassung von
Hand bedienbar. Offline-Neuladen der gesamten App ist ohne Service Worker kein
versprochener Funktionsumfang. Es wurden keine Abhängigkeiten hinzugefügt.

Wiederholbare Prüfseiten und Ausführung: [`pruefungen/README.md`](pruefungen/README.md).

## Datenquelle

Nährwerte von [Open Food Facts](https://world.openfoodfacts.org/),
lizenziert unter [ODbL](https://opendatacommons.org/licenses/odbl/).
Kein API-Schlüssel nötig.

## Hinweis

Diese App ersetzt keine medizinische oder Ernährungsberatung.

## Für Mitwirkende

Konventionen, Sicherheitsregeln und Arbeitsweise stehen in
[`CLAUDE.md`](./CLAUDE.md). Die vollständige Planung liegt ausserhalb dieses
Repositorys in den Projektnotizen.
