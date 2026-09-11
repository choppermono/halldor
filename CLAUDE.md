# ascend — Regeln für dieses Repository

Schulprojekt IPT 4.1, BBZW Luzern. Zwei Entwickler: Florian und sein
Klassenkamerad. Die vollständige Planung liegt ausserhalb dieses Repos im
Obsidian-Vault unter `Projekt/Projekt-1_Webapp/`.

**Antworte auf Deutsch. Keine Emojis.**

---

## Die Regel, die über allen anderen steht

> Das Projekt bekommt zwei Noten: eine auf das Produkt und eine auf eine
> **mündliche Prüfung, in der auf einzelne Zeilen dieses Codes gezeigt wird.**

Daraus folgt für jeden Auftrag in diesem Repo:

1. **Ein Arbeitspaket pro Auftrag. Niemals «bau die App».**
2. **Kein Merge, bevor der Diff gelesen wurde.**
3. **Pro Paket tippt einer von beiden eine Kernfunktion selbst neu, aus einer
   leeren Datei.** Lesen fühlt sich nach Verstehen an und ist es nicht.
4. **Jedes Paket erzeugt am selben Tag einen Eintrag in
   `Pruefung/01-Code-Erklaeren.md`** im Vault — Was · Warum so · Alternative · Stand.

Wenn ein Auftrag grösser wirkt als ein Arbeitspaket: nachfragen, nicht bauen.

---

## Wie hier Code aussieht

| Thema           | Regel                                                                         |
| --------------- | ----------------------------------------------------------------------------- |
| Framework       | Vue 3, **Composition API mit `<script setup>`**. Options API kommt nicht vor  |
| Zustand         | **Eigene Composables**, kein Pinia. `useProfil`, `useTagebuch`, `useTraining` |
| Routing         | `vue-router`, eine Route pro Bildschirm                                       |
| Persistenz      | **Nur** über `src/lib/speicher.js`. Sonst fasst niemand `localStorage` an     |
| Sprache im Code | Bezeichner und Kommentare auf Deutsch, passend zur Doku und zur Prüfung       |
| Kommentare      | Sparsam, und sie erklären **warum**, nicht was                                |

### Composable-Konvention

Ein Composable ist ein Modul mit einem `reactive`-Objekt und benannten
Funktionen darauf. Der Zustand wird auf Modulebene angelegt, nicht in der
Funktion — sonst bekommt jede Komponente ihre eigene Kopie.

Kein Composable importiert ein anderes Composable. Wo etwas beides braucht,
rechnet es die Komponente oder eine reine Funktion aus `src/lib/`.

### Ordner

```
src/
  lib/          reine Funktionen ohne Vue: rechnen, formatieren, speichern
  composables/  geteilter Zustand
  components/   wiederverwendbare Bausteine
  views/        ein Bildschirm pro Datei, an eine Route gehängt
  daten/        Übungskatalog, Programmvarianten, Kraftstandards als JSON
  styles/       tokens.css
```

Die Rechenlogik gehört nach `src/lib/` und ist dort **ohne Vue testbar**.
Grundumsatz, Makroverteilung, Progression, 1RM und Rang sind reine Funktionen:
Eingabe rein, Ergebnis raus, kein Zustand.

---

## Sicherheit — nicht verhandelbar

| Regel                                                   | Grund                                                                                        |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Kein `v-html`.** ESLint bricht darauf ab              | Produktnamen bei Open Food Facts sind von Nutzern eingetragen. Jeder kann jeden Namen ändern |
| Barcode vor dem Absenden prüfen: `/^\d{8,14}$/`         | sonst wandert beliebiger Text in die URL                                                     |
| Kamera-Stream beim Verlassen des Scanners beenden       | `stream.getTracks().forEach((t) => t.stop())` — sonst bleibt die Kamera-Leuchte an           |
| Kamera-Erlaubnis erst beim Öffnen des Scanners erfragen | nicht beim Laden der Seite                                                                   |
| Kein Bild wird gespeichert oder verschickt              | nur der erkannte Zahlencode                                                                  |
| Formularwerte haben `min`/`max`, `NaN` wird abgefangen  | sonst rechnet die App mit Müll                                                               |
| Kein API-Key im Repo                                    | es gibt keinen. Open Food Facts braucht keinen                                               |

---

## Die API

`https://world.openfoodfacts.org/api/v2/product/{barcode}.json`

Immer mit `fields=` einschränken. Ohne das kommen hunderte Felder zurück.

**Kein Proxy nötig** — CORS wurde am 2026-08-21 aus fremder Herkunft geprüft:
Status 200, `response.type === "cors"`. Der von der Doku geforderte
User-Agent lässt sich im Browser nicht setzen, wird aber auch nicht erzwungen.

Namensnennung nach ODbL gehört in die App und in die Doku.

### Fehlerfälle, die jeder API-Zugriff behandeln muss

| Fall                  | Verhalten                                                               |
| --------------------- | ----------------------------------------------------------------------- |
| `status: 0`           | «Produkt unbekannt — von Hand eintragen». **Kein Fehler, ein Ergebnis** |
| HTTP 503              | Hinweis plus Wiederholen-Knopf. Kommt real vor                          |
| Antwort ist kein JSON | abfangen. Eine HTML-Fehlerseite wurde beobachtet                        |
| kein Netz             | Verlauf bleibt bedienbar, nur der Scan meldet sich ab                   |
| Nährwerte fehlen      | erfassbar bleiben, fehlende Werte als «unbekannt», **nicht als 0**      |

Rate Limit: 15 Produktabfragen pro Minute und IP.

---

## Zwei Prinzipien im Datenmodell

1. **Momentaufnahme statt Verweis.** Ein Tageseintrag speichert Name, Marke und
   Nährwerte so, wie sie beim Erfassen waren. Open Food Facts ist ein Wiki —
   ein vergangener Tag darf sich nicht rückwirkend ändern.
2. **Der Tag hält sein Ziel fest.** Beim ersten Eintrag wird das damals gültige
   Kalorien- und Makroziel in den Tag geschrieben. Profiländerungen wirken nur
   nach vorn.

Das vollständige Schema steht im Vault in `01-Planungsergebnisse.md`, P3.

---

## Design

Alle Werte kommen aus `src/styles/tokens.css`. **In einer Komponente steht nie
ein Farbwert, eine Schriftgrösse oder ein Abstand direkt.**

- Dark only. Ein Light-Theme ist eine Erweiterung für Stufe 3
- Designrichtung seit 2026-09-10: dunkles Terminal/Dossier, Elfenbein, dünne Linien, roter Akzent. Nier:Automata dient nur als Stilinspiration; keine fremden Assets oder Fonts übernehmen.
- V0 ist ein unbestätigter Mock. Three.js und Rang-Relikte sind keine Voraussetzung für das Ernährungs-MVP. Ranglogik bleibt Stufe 3.
- Eine Akzentfarbe. Wer eine zweite braucht, hat ein Hierarchieproblem
- Text auf der roten Akzentfläche verwendet `--farbe-auf-akzent`.
  V0: helles Elfenbein erreicht 5.09:1; der frühere dunkle Text nur 3.65:1.
- `--farbe-text-schwach` nur ab 24 px oder fett ab 19 px — darunter zu wenig Kontrast
- Jede Stelle mit einer sich ändernden Zahl bekommt
  `font-variant-numeric: tabular-nums`, sonst springt die Anzeige
- Trefferflächen mindestens `--treffer-min`, mindestens `--a-2` Abstand
- Fehler nie über Farbe allein: Farbe **plus** Symbol **plus** Satz
- Keine Emojis als Symbole. Ein einziges SVG-Set, gleiche Strichstärke
- Untere Leiste: `padding-bottom: env(safe-area-inset-bottom)`, Inhalt darüber
  bekommt denselben Betrag als Polster
- Geprüft wird bei 375 px Breite

---

## Verantwortung gegenüber jungen Nutzer:innen

Die App zeigt Kalorienziele und richtet sich an junge Leute. Diese Punkte sind
Produktentscheidungen, keine Nettigkeiten:

- **Keine Serien, Abzeichen oder Belohnungen fürs Tracken.** Nichts, was ein
  Defizit belohnt
- Kein Zielgewicht, kein Countdown, kein Fortschrittsbalken zum Abnehmen
- Die Kalorien-Untergrenze (1500 kcal männlich, 1200 kcal weiblich) wird nie
  unterschritten, und **wenn sie greift, sagt die App das sichtbar**
- Keine bewertende Sprache. Ein Tag über dem Ziel ist ein Tag über dem Ziel,
  kein Misserfolg
- Beim Onboarding steht, dass die App keine medizinische oder
  Ernährungsberatung ersetzt

---

## Ausbaustufen

Die Reihenfolge steht fest. Was in einer späteren Stufe liegt, wird nicht
«schon mal mitgebaut».

| Stufe | Inhalt                                                                                                                                                  |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | Ernährung vollständig: Onboarding, Zielberechnung, Scan, manuelle Eingabe, Tageseinträge in Gramm, Bilanz gegen das Ziel, Rückblick auf vergangene Tage |
| **2** | Training: Programmvarianten, Führung durch die Einheit, Satz-Logging, Progression, Deload                                                               |
| **3** | Rang: 1RM je Übung, Normierung auf Körpergewicht, Stufen                                                                                                |

---

## Git

- `main` bleibt jederzeit lauffähig
- Ein Zweig pro Arbeitspaket: `feature/<paket>`
- Merge nur über Pull Request, den der jeweils andere liest
- Beide arbeiten auf **eigenen Zweigen**, auch mit Claude Code — sonst laufen
  zwei Sitzungen in dieselbe Datei

## Befehle

```bash
npm run dev       # Entwicklungsserver
npm run dev:host  # zusaetzlich im Netzwerk erreichbar
npm run lint      # ESLint
npm run format    # Prettier schreibt
npm run build     # Produktionsbuild
```

> Die Kamera braucht einen sicheren Kontext. Über `http://192.168.x.x` bleibt
> sie am Handy stumm — das ist kein Bug. Zum Testen am Handy die
> HTTPS-Deploy-Vorschau verwenden.
