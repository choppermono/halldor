# Barebones — die Fassung fürs mündliche Gespräch

Dieser Branch ist Trackify auf **Scanner und Tracker** reduziert. Er ist kein
zweites Projekt: gleicher Code, gleiche Geschichte, nur ohne alles, was im
Gespräch erklärt werden müsste, ohne zur Sache zu gehören.

Geschnitten von `main` bei `ec1cfc5`, direkt nachdem P-A fertig war und
**bevor** Training und Rang dazukommen. Später wäre der Schnitt eine
Operation gewesen; hier ist er ein Löschen.

## Was drin ist

|                       |                                                                              |
| --------------------- | ---------------------------------------------------------------------------- |
| Onboarding und Profil | Körperdaten, Ziel, Rechenweg                                                 |
| Rechenkern            | Mifflin-St Jeor, Aktivitätsfaktor, Makroverteilung — `src/lib/ernaehrung.js` |
| Speicher              | `localStorage` mit Versionierung, Kollisionserkennung, bewusstem Reset       |
| Open Food Facts       | Produktabfrage inklusive Fehlerfällen                                        |
| Scanner               | Kamera über `@zxing/browser`, Rückfall über das Eingabefeld                  |
| Heute und Tagebuch    | Tagesbilanz, vergangene Tage, Eintrag löschen                                |

## Was raus ist

- `src/kino/` — alle Effektszenen
- `three` als Abhängigkeit; ohne `src/kino/` importiert sie niemand mehr
- Training und Rang samt Routen und Navigationseinträgen
- der Kino-Modus im Profil

> [!note] Warum der Kino-Modus mit rausgeflogen ist
> Er stand nicht auf der Streichliste. Aber ohne `src/kino/` steuert der
> Schalter nichts mehr: die Auswahl wird gespeichert, der Text ändert sich,
> sichtbar passiert nichts. **Ein Bedienelement ohne Wirkung ist in der
> Prüfungsfassung schlimmer als Komplexität** — die erste Frage wäre «und was
> macht das?», und die ehrliche Antwort wäre «nichts».

## Was das bringt

|                            | `main`         | `barebones`               |
| -------------------------- | -------------- | ------------------------- |
| Dateien in `src/`          | 37             | 32                        |
| Ausgelieferte Bündel       | 9              | 5                         |
| Grösster Brocken           | `three` 524 kB | keiner ausser dem Scanner |
| Hauptbündel                | 145 kB         | 145 kB                    |
| Scanner, verzögert geladen | 483 kB         | 483 kB                    |

Der Scanner bleibt der grösste Einzelposten. Er wird erst geladen, wenn
jemand `/scan` öffnet, und er ist der Grund, warum es die App gibt — der
bleibt.

## Was übrig ist und du entscheiden solltest

`KinoAuflage.vue`, `KinoHintergrund.vue`, `useAnzeigeebene.js` und
`anzeigebedingungen.js` sind noch da. Das ist die Maschinerie der
Anzeigeebene: Bildratenmessung, WebGL-Probe, Herunterstufung, Tab-Sichtbarkeit,
reduzierte Bewegung.

Sie schadet nichts — die Einhängepunkte finden kein Modul und rendern nichts,
genau wie im Löschtest. Aber sie steuert auf diesem Branch auch nichts mehr.

Zwei vertretbare Wege, und es ist deine Wahl:

1. **Drinlassen.** Es ist die anspruchsvollste eigene Logik im Projekt und
   damit gutes Gesprächsmaterial — aber du musst erklären können, warum sie
   in einer Fassung steht, in der sie nichts bewirkt.
2. **Rausnehmen.** Dann ist der Branch vollständig konsistent: keine
   Anzeigeebene, kein Begriff davon, nichts zu erklären. Kostet Änderungen in
   `App.vue`, `GlyphenText.vue`, `KameraScanner.vue`, `TagesBogen.vue` und
   `SeitenLink.vue`.

## Pflege

Der Branch wird **nicht** weiterentwickelt. Wenn sich am Kern etwas ändert,
wird `main` hierher gemergt und der Schnitt wiederholt — nicht umgekehrt.
Nichts auf diesem Branch geht je zurück nach `main`.

## Geprüft

`npm run lint`, `npm run build` und `npx prettier --check .` bestanden.
Kein `three`-Bündel mehr, keine Verweise auf Training, Rang oder `src/kino/`
im Quelltext.

==Ein Durchklicken im Browser steht noch aus.== Es ist derselbe Code wie auf
`main`, nur mit weniger Dateien, aber gesehen hat diesen Branch noch niemand.
