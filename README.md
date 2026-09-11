# ascend

Fitness-Webapp für das Modul **IPT 4.1 Webentwicklung II** am BBZW Luzern.

Barcode-Scan für Nährwerte, Kalorien- und Makroziel aus eigener Berechnung,
ein selbst entwickeltes Trainingsprogramm und ein Rang-System aus den
geloggten Sätzen — in einer Oberfläche.

## Stand

Projektgerüst. Die Planung ist abgeschlossen, gebaut wird in Arbeitspaketen.

| Stufe | Inhalt                                                   | Stand     |
| ----- | -------------------------------------------------------- | --------- |
| 1     | Ernährung: Onboarding, Zielberechnung, Scan, Tagesbilanz | in Arbeit |
| 2     | Training: Programmvarianten, Satz-Logging, Progression   | offen     |
| 3     | Rang: 1RM je Übung, Stufen                               | offen     |

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

Die Daten bleiben auf dem Gerät. Das ist keine Sparmassnahme, sondern eine
Entscheidung: Die App verarbeitet Körpergewicht, Grösse, Alter und
Essverhalten — nach revDSG besonders schützenswerte Personendaten. Was das
Gerät nie verlässt, kann auch nirgends abfliessen.

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
