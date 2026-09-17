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

> [!note] Der Kino-Modus ist inzwischen auch aus `main` verschwunden
> Er flog hier zuerst raus, weil er ohne `src/kino/` nichts mehr steuerte.
> Kurz darauf fiel er auch in der Vollversion: **die soll immer gut
> aussehen, und ein Schalter, der sie schlechter macht, hat darin nichts zu
> suchen.** Der Unterschied zwischen den beiden Fassungen ist damit der
> Branch, nicht eine Einstellung.

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

## Was übrig ist

`KinoAuflage.vue`, `KinoHintergrund.vue`, `useAnzeigeebene.js` und
`anzeigebedingungen.js` stehen noch. Seit `main` den Schalter losgeworden ist,
ist das Composable allerdings ein anderes Tier: **90 Zeilen statt 150**, ohne
Modus, ohne Persistenz, ohne Speicherhinweise.

Und es ist hier nicht ganz wirkungslos: `SeitenLink.vue` liest daraus
`reduzierteBewegung` und schaltet danach die Seitenübergänge ab. Die
Übergänge sind Kern, nicht Kino — sie bleiben also auch in dieser Fassung.

Ohne Wirkung sind nur noch die Bildratenmessung und die WebGL-Probe: sie
messen für Szenen, die es auf diesem Branch nicht gibt.

Zwei vertretbare Wege:

1. **Drinlassen.** Es ist eigene Logik und im Gespräch brauchbar — du musst
   erklären können, warum gemessen wird, wo nichts zu schützen ist.
2. **Auf das Nötige eindampfen.** `SeitenLink.vue` liest
   `prefers-reduced-motion` direkt, danach fallen Composable und
   Einhängepunkte weg. Dann ist der Branch vollständig konsistent.

## Pflege

Der Branch wird **nicht** weiterentwickelt. Wenn sich am Kern etwas ändert,
wird `main` hierher gemergt und der Schnitt wiederholt — nicht umgekehrt.
Nichts auf diesem Branch geht je zurück nach `main`.

## Geprüft

`npm run lint`, `npm run build` und `npx prettier --check .` bestanden.
Kein `three`-Bündel mehr, keine Verweise auf Training, Rang oder `src/kino/`
im Quelltext.

Kopflos durchgeklickt bei 375 px, alle Routen:

|                          |                                             |
| ------------------------ | ------------------------------------------- |
| Navigation               | Heute · Scan · Profil                       |
| `canvas` je Route        | 0 — kein Sternenfeld                        |
| Kino-Abschnitt im Profil | nicht vorhanden                             |
| `/training`, `/rang`     | fallen auf Heute zurück, keine toten Routen |
| Waagrechter Überlauf     | keiner                                      |
| Konsolenfehler           | keine                                       |

Die AV-Prüfseite läuft auch hier: **33 Prüfpunkte bestanden**, Speicher danach
leer.
