# Scanner-Prüfergebnis

Stand: 17.09.2026  
Branch: `feature/scanner`  
Geprüfter Implementierungscommit: `3304ec444fc1586f291bf0239668fb5bdf37cac4`

## Ergebnis

Der Scanner ist implementiert. Kamera, EAN-13/EAN-8-Erkennung, manueller
Rückfallweg, Produktabfrage, Fehlerzustände, Anzeigeebene und der vollständige
Erfassungsablauf funktionieren lokal. Die Schichtgrenze zu `src/kino/` hält auch
im gebauten Preview ohne dieses Verzeichnis.

Der geforderte Nachweis mit einem echten Barcode auf einem Handy ist nicht
erbracht. Die Vercel-Vorschau wurde erfolgreich gebaut, ist aber durch Vercel
Authentication geschützt. Ohne Anmeldung oder Bypass gelangt ein fremdes Gerät
nicht zur App. Deshalb konnten weder die SPA-Umleitung noch die Handykamera auf
der bereitgestellten HTTPS-Vorschau abschliessend geprüft werden.

## Implementierung

- Route `/scan`, vierter Eintrag in der unteren Navigation
- Rückkamera bevorzugt über `facingMode: { ideal: 'environment' }`
- `BrowserMultiFormatOneDReader` aus `@zxing/browser`; akzeptiert werden nur
  Resultate mit Format EAN-13 oder EAN-8
- Stream, Decoder und Zeitgeber werden bei Treffer, Abbruch, Fehler, Zeitlimit
  und Verlassen der Ansicht beendet
- Der erkannte Code wird an `suchen()` in der bestehenden
  `ProduktBestaetigen.vue` weitergereicht. `openfoodfacts.js` blieb unverändert.
- Das bestehende Barcode-Eingabefeld bleibt sichtbar und bedienbar.
- Produktname und Fehlermeldungen werden als Text gerendert; kein `v-html`
- Keine Speicherung oder Übertragung von Kamerabildern
- Selbst gehostete Cormorant-Garamond-Schrift, damit kein neues Laufzeit-
  Netzwerkziel entsteht
- Aufwendige Scanner-Effekte liegen ausschliesslich in
  `src/kino/ScannerInszenierung.vue` und werden über `KinoAuflage` geladen.

## Ausgeführte Prüfungen

### Kernablauf

| Prüfung                 | Ergebnis  | Tatsächliche Beobachtung                                                                                                                         |
| ----------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dev-Server              | Bestanden | Vite wählte wegen belegtem Port 5173 den Port 5174; der Port wurde aus der Ausgabe übernommen.                                                   |
| Manuelle Produktabfrage | Bestanden | `3017620422003` lieferte über die echte Open-Food-Facts-Abfrage `Nutella`.                                                                       |
| Erfassung auf Heute     | Bestanden | 15 g wurden als `Nutella`, `15 g · etwa 100 kcal` auf Heute eingetragen.                                                                         |
| Kamera lokal            | Bestanden | Der reale Kamerastrom öffnete sich im Browser; das Livebild war sichtbar.                                                                        |
| Verlassen der Ansicht   | Bestanden | Beim Wechsel zu Training verschwanden Video und Scanner; die Aufräumroutine stoppt Decoder und alle Tracks.                                      |
| Echter Barcode          | Ungeprüft | Weder am Desktop noch am Handy wurde ein physischer Barcode vor die Kamera gehalten. Eine simulierte Erkennung wird nicht als Nachweis gewertet. |

### Fehlerfälle

| Fehlerfall                       | Ergebnis                   | Auslösung                                                                                                                                            |
| -------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Erlaubnis verweigert             | Visuell geprüft, simuliert | Entwicklungs-Prüfzustand; Anleitung zu Schloss-/Kamerasymbol und Verweis auf Eingabefeld sichtbar.                                                   |
| Keine Kamera                     | Visuell geprüft, simuliert | Entwicklungs-Prüfzustand; eigener Text und Verweis auf Eingabefeld sichtbar.                                                                         |
| Kein HTTPS                       | Bestanden                  | Aufruf über die ausgegebene HTTP-LAN-Adresse; eigener Hinweis auf HTTPS statt allgemeinem Kamerafehler.                                              |
| Open Food Facts kennt Code nicht | Bestanden                  | Entwicklungs-Erkennung von `00000000`, danach echte Open-Food-Facts-Abfrage; visueller `glitchSlice`, Fehlermeldung blieb in der Live-Region im DOM. |
| Nach 15 Sekunden nichts erkannt  | Bestanden                  | Reale Kamera 15 Sekunden ohne Barcode laufen gelassen; Stream endete und erneuter Start, Abbruch sowie Eingabefeld wurden angeboten.                 |

Die Entwicklungs-Prüfzustände werden in `Scan.vue` nur unter
`import.meta.env.DEV` aus Query-Parametern übernommen und sind im Produktionsbau
nicht erreichbar.

### Anzeigeebene und Zugänglichkeit

| Prüfung                  | Ergebnis  | Tatsächliche Beobachtung                                                                                      |
| ------------------------ | --------- | ------------------------------------------------------------------------------------------------------------- |
| Kino-Modus Aus           | Bestanden | Ruhefassung sichtbar, Scanner-Kino nicht im DOM, Produkt und Code vollständig lesbar.                         |
| Reduzierte Bewegung      | Bestanden | Reduzierte Bewegung setzt sich auch gegen Modus An durch; keine laufende Inszenierung und kein Canvas im DOM. |
| Kino-Modus An            | Bestanden | Scanner-Kino und bestehender Hintergrund aktiv; Endwerte für Code und Produkt bleiben Text im DOM.            |
| AV-Browserprüfung        | Bestanden | Alle 38 Prüfpunkte in `pruefungen/av-anzeigeebene.html` bestanden.                                            |
| 375 px bei 200 % Schrift | Bestanden | `clientWidth` und `scrollWidth` beide 360 px; kein horizontaler Überlauf.                                     |
| Bedienziele              | Bestanden | Scanner-Tasten und Quellenlinks mindestens 44 px; sichtbare Fokusstile bleiben bestehen.                      |
| Dekoration               | Bestanden | Raster, Eckmarken, Scanlinie und Effektglyphen sind `aria-hidden`.                                            |
| Live-Region              | Bestanden | Erkannter Code, Treffer und alle Fehlertexte stehen in einer `aria-live`-Region.                              |

### Löschtest

Ausgeführt:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File pruefungen/av-loeschtest.ps1 -Aktion auslagern
```

Ergebnis: `BESTANDEN: Lint und Build ohne src/kino.`

Im danach gebauten Preview ohne `src/kino/` wurde der vollständige Ablauf erneut
ausgeführt: Testprofil anlegen, `3017620422003` abfragen, Nutella finden, 15 g
bestätigen und den Eintrag auf Heute sehen. Danach wurde ausgeführt:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File pruefungen/av-loeschtest.ps1 -Aktion wiederherstellen
```

`src/kino/README.md` war wieder vorhanden und die temporäre Ablage entfernt.

### Statische Prüfungen

| Befehl                   | Ergebnis               |
| ------------------------ | ---------------------- |
| `npm run lint`           | Bestanden, 0 Warnungen |
| `npm run build`          | Bestanden              |
| `npx prettier --check .` | Bestanden              |

Vite meldet weiterhin die bereits vorhandene Grössenwarnung für den separaten
Three.js-Chunk. Der Scanner selbst ist lazy geladen und liegt in einem eigenen
Chunk.

## Screenshots bei 375 px

- `scanner-screenshots/scanner-ruhe-375.png`
- `scanner-screenshots/scanner-suche-375.png`
- `scanner-screenshots/scanner-treffer-375.png`
- `scanner-screenshots/scanner-fehler-erlaubnis-375.png`
- `scanner-screenshots/scanner-fehler-keine-kamera-375.png`
- `scanner-screenshots/scanner-fehler-kein-https-375.png`
- `scanner-screenshots/scanner-fehler-unbekannt-375.png`
- `scanner-screenshots/scanner-fehler-zeitlimit-375.png`
- `scanner-screenshots/scanner-schrift-200-375.png`

## Deploy

Entscheidung: Vercel bleibt die Hosting-Plattform. GitHub weist eine aktive
Vercel-Integration mit erfolgreichen Production- und Preview-Deployments aus;
eine Netlify-Verbindung existiert nicht. Die vorhandene `vercel.json` bleibt für
die SPA-Umleitung auf `index.html` zuständig. Die widersprüchlichen aktiven
Projektnotizen wurden auf Vercel korrigiert.

- Stabiler Branch-Alias:
  `https://halldor-q2zo-git-feature-scanner-dori13.vercel.app`
- Geprüfter Deployment-Stand von Commit `3304ec4`:
  `https://halldor-q2zo-f5k52r23r-dori13.vercel.app`
- Vercel-/GitHub-Status: erfolgreich
- Direkter HTTP-Aufruf von `/scan`: `302` zur Vercel-Anmeldung, bevor die
  Anwendung oder deren Rewrite erreicht wird

Damit ist die Branch-Vorschau eingerichtet, aber nicht öffentlich nutzbar. Für
den ausstehenden Nachweis muss der Projekteigentümer Vercel Authentication für
Preview-Deployments deaktivieren oder einen Bypass-/Share-Link bereitstellen.
Danach sind direkt auf einem Handy der Aufruf von `/scan`, die Kameraerlaubnis
und ein physischer EAN-Scan zu prüfen.

## Entscheidungen

1. Der tatsächlich vorhandenen Vercel-GitHub-Integration wurde gegenüber den
   veralteten Netlify-Planungsnotizen Vorrang gegeben.
2. Reduzierte Bewegung setzt sich auch bei ausdrücklich eingeschaltetem
   Kino-Modus durch, weil dies im Auftrag als unveränderliche Regel genannt ist.
3. Für EAN wird der eindimensionale ZXing-Leser verwendet. Der allgemeine Leser
   erzeugte bei jedem erfolglosen Bild Warnungen aus seinen nicht benötigten
   2D-Lesern.
4. Cormorant Garamond wird lokal ausgeliefert statt von einem CDN geladen.
5. Der im Auftrag angegebene Vault-Pfad enthielt einen abweichenden Unterstrich.
   Verwendet wurde der tatsächlich vorhandene Modulordner
   `IPT-4.1_Webentwicklung-II`.

## Offene Grenzen

- Physischer Barcode-Scan auf einem Handy über HTTPS: ungeprüft
- Tatsächlicher Berechtigungsentzug in den Einstellungen eines realen
  Zielbrowsers: ungeprüft; Zustand und Anleitung wurden simuliert geprüft
- Gerät ohne Kamera: ungeprüft; Zustand wurde simuliert geprüft
- SPA-Direktaufruf auf der Vercel-Vorschau: wegen vorgeschalteter Vercel-
  Anmeldung ungeprüft; im lokalen Produktions-Preview funktioniert `/scan`

---

## Nachtrag 17.09.2026 — Review und Korrekturen

Durchsicht des Branches durch Claude. Drei Befunde, zwei davon behoben.

### Behoben: Schriften fielen still zurück

`tokens.css` erklärte `--display`, `--body` und `--mono` nach der
Kunstrichtung, aber `fonts.css` lieferte nur Cormorant Garamond aus. **Barlow
und JetBrains Mono fehlten.** `--mono` wird an drei Stellen benutzt, unter
anderem für die Code-Anzeige des Scanners — die rendete damit auf Windows in
Consolas statt in JetBrains Mono, ohne jede Fehlermeldung.

Beide Familien sind jetzt vorhanden. Im Browser nachgemessen:
`document.fonts` meldet `JetBrains Mono 500` als geladen, die Scanner-Anzeige
bekommt die vorgesehene Schrift.

### Behoben: 2.4 MB Schriften als TTF

Alle Schriftdateien lagen als TTF ohne Teilmengen vor, Cormorant Garamond
allein mit **1.17 MB**. Ersetzt durch woff2 mit `unicode-range`-Aufteilung in
`latin` und `latin-ext`.

|                    | vorher  | nachher            |
| ------------------ | ------- | ------------------ |
| Dateien            | 9 TTF   | 32 woff2           |
| Auf der Platte     | 2.4 MB  | 844 kB             |
| Cormorant Garamond | 1.17 MB | 3 × ~37 kB (latin) |

Tatsächlich geladen wird weniger: der Browser holt nur die Teilmengen, die der
angezeigte Text braucht, und eine Familie wird überhaupt erst geladen, wenn
sie verwendet wird. Auf `/scan` lädt die App heute Plex plus JetBrains Mono —
Cormorant und Barlow kosten nichts, bis P-C sie bindet.

Zuordnung und Lizenzen: `public/fonts/SCHRIFTEN.md`.

### Festgehalten statt stillschweigend: E-88 ist umgedreht

`useAnzeigeebene.js` lässt reduzierte Bewegung jetzt jeden Modus sperren, auch
`an`. Das kehrt **E-88** vom 11.09.2026 um, und der zugehörige Prüfpunkt in
`av-anzeigeebene.html` wurde mit umgedreht — im selben Branch wie das geprüfte
Verhalten. Der Bericht oben nennt «38 Prüfpunkte bestanden», ohne zu sagen,
dass einer davon jetzt das Gegenteil prüft.

Die Änderung selbst ist gewollt und bleibt: eine Betriebssystem-Einstellung
schlägt einen App-Schalter. Sie ist als **R-09** im Entscheidungslog
festgehalten, mit der Reichweite — `webglAktiv` hängt an `anzeigeebeneAktiv`,
also hält jetzt auch das Sternenfeld bei reduzierter Bewegung an. Der
Prüfpunkt trägt einen Kommentar, der auf R-09 verweist.

### Nebenbefund

Der Fehlerfall «Erlaubnis verweigert» war oben als _simuliert geprüft_
geführt. Er ist jetzt **echt ausgelöst** worden: der Browser der Prüfumgebung
blockierte den Kamerazugriff, die Ansicht zeigte die vorgesehene Erklärung und
den Verweis aufs Eingabefeld.

### Weiterhin offen

Physischer Barcode-Scan am Handy über HTTPS und der SPA-Direktaufruf auf der
Vorschau. Beides hängt an Vercel Authentication vor den Preview-Deployments
und ist ohne Eingriff im Vercel-Projekt nicht prüfbar.

Nach den Korrekturen: `npm run lint`, `npm run build` und
`npx prettier --check .` bestanden.

---

## Abschluss 17.09.2026 — die offenen Nachweise sind erbracht

Nachdem Vercel Authentication auf dem Projekt abgeschaltet wurde (Konto des
Projektpartners), war die Branch-Vorschau erreichbar.

### Auf der Vorschau geprüft

| Prüfung                                    | Ergebnis                                               |
| ------------------------------------------ | ------------------------------------------------------ |
| `/scan` direkt aufgerufen                  | `200`, echtes `index.html` (622 Bytes)                 |
| `/rang`, `/tief/er/gibtsnicht`             | `200` — die SPA-Umleitung greift auch verschachtelt    |
| `fonts/jetbrains-mono-500-latin.woff2`     | `200`, `font/woff2`, 31 432 Bytes                      |
| `fonts/cormorant-garamond-300-latin.woff2` | `200`, `font/woff2`, 37 640 Bytes                      |
| `fonts/plex-1.ttf`                         | fällt in die Umleitung — die TTF-Dateien sind entfernt |

Das ausgelieferte Stylesheet heisst `index-DRNpyiOB.css` und trägt damit
denselben Inhalts-Hash wie der lokale Build desselben Commits. Vite benennt
nach Inhalt, gleiche Prüfsumme heisst byteweise gleiche Datei: die Vorschau
führt genau den Stand aus, der lokal geprüft wurde.

### Auf einem echten Gerät geprüft

**Physischer Barcode-Scan bestanden.** Florian hat ein reales Produkt
gescannt, die Erkennung lief durch bis zum Produkt. Zusätzlich **auf Safari**
bestanden — das war die Plattform mit dem grössten Restrisiko, weil
`getUserMedia` dort anders behandelt wird als in Chrome und lokal nicht
prüfbar war.

Damit sind die beiden zuvor offenen Nachweise erbracht:

- ~~Physischer Barcode-Scan auf einem Handy über HTTPS~~ — bestanden
- ~~SPA-Direktaufruf auf der Vercel-Vorschau~~ — bestanden

### Weiterhin ungeprüft

- Tatsächlicher Berechtigungsentzug in den Einstellungen eines realen
  Zielbrowsers. Der verweigerte Zustand wurde echt ausgelöst (die
  Prüfumgebung blockierte den Kamerazugriff), der Weg über die
  Browsereinstellungen nicht.
- Gerät ohne Kamera — simuliert geprüft, nicht real.
- Ob der Kamerastrom beim Verlassen der Ansicht **auf dem Handy** endet.
  Lokal geprüft und bestanden; auf dem Gerät nicht ausdrücklich bestätigt.
  Sichtbar am Kamerasymbol in der Statusleiste.

## Stand des Pakets

P-A ist fachlich abgeschlossen: Kamera, Erkennung, Rückfallweg, Produktabfrage,
Fehlerfälle, Inszenierung, Schichtgrenze, Deploy und Vorschau stehen und sind
geprüft.
