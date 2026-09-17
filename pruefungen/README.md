# Browserprüfungen

Seiten in diesem Ordner prüfen einzelne Module direkt im Browser. Sie sind
bewusst kein Testframework: die Planung hält fest, dass für dieses Projekt
keines nötig ist. Sie gehören trotzdem ins Repository — eine Prüfung, die nur
auf einem Rechner liegt, kann niemand nachvollziehen.

Die Seiten sind nicht Teil der App. Sie werden nicht importiert und landen in
keinem Produktionsbuild.

## mvp-ernaehrung.html — Rechenkern, API und Momentaufnahmen

Auf einem eigenen, leeren Browserursprung öffnen. Die Seite prüft echte Module
mit festen Stichtagen und injizierten API-Antworten. Sie bricht bei vorhandenem
App-Dokument ohne Änderung ab und räumt ausschliesslich eigene Testdaten auf.

Enthalten sind Geburtstage/Schalttage, Mifflin-St Jeor, Altersregel, Rate vor
Defizit, ungültige Makros ohne Deckelung, höchste einsetzbare Rate, NaN/Infinity,
180 kombinierte Eingaben, unbekannte Nährwerte, API-Fehler und leere Ergebnisse,
Gramm-Anteile, unveränderliche Produkt- und Zielmomentaufnahmen sowie Löschen.
Der Export `produkteSuchen` ist eine Schnittstelle ohne Suchoberfläche.

API-Tests prüfen `fields=`, HTTP 503/429/500/404, ungültiges JSON, fehlendes Netz,
fehlende/unplausible Werte und Portionsangaben. Ein echter Barcode und der
gesamte App-Ablauf werden zusätzlich im Browser geprüft; simulierte Antworten
belegen keine Erreichbarkeit von Open Food Facts.

Technische Eingabegrenzen (Alter 10–120, Gewicht 20–400 kg, Grösse 100–250 cm,
Erfassungsmenge 0.1–10000 g, Vorbelegung höchstens 2000 g) sind ausdrücklich
unbelegte Plausibilitätsgrenzen. Die 0.5–1-%-Rate ist für Gewichtsverlust belegt;
die gleiche Aufbau-Spanne ist eine unbelegte Produktannahme. Der rechnerische
Makroanker ist keine medizinische Mindestenergie und keine zusätzliche kcal-Konstante.

### App-Ablauf reproduzieren

1. Eigenen Browserkontext bei 375 px öffnen; die tatsächlich von Vite ausgegebene URL verwenden.
2. Profil: männlich, 12.09.1996, 180 cm, 80 kg, regelmässig aktiv, Halten.
   Hinweis bestätigen, Rechenweg lesen, speichern.
3. Von Hand «Haferflocken»: pro 100 g 380 kcal, 13 g Protein, 7 g Fett, 60 g
   Kohlenhydrate; 50 g bestätigen. Auf Heute erscheinen etwa 200 kcal.
4. Barcode `3017620422003` eintippen, Abfrage abwarten, 15 g bestätigen.
   Haferflocken löschen. Reload: gesamtes Dokument einschliesslich Revision unverändert.
5. Vorherigen Tag öffnen, Leerzustand prüfen, zurück zu heute. Produkt ohne
   Nährwerte erfassen: Teilsumme und Unvollständigkeit sichtbar, kein Restziel.
6. Im Browser Netzwerk auf offline stellen: gestern/heute, Löschen und manuelle
   Erfassung bleiben bedienbar. Eine Barcode-Abfrage meldet den Netzausfall.
7. Profil: weiblich, 12.09.1956, 140 cm, 40 kg, überwiegend sitzend, Abnehmen,
   Rate 1. Am Stichtag 12.09.2026 kein Makroziel, höchste Rate 0.847272 %.
8. 200 % Wurzelschrift bei 375 px: alle Formulare, Heute, Mengenbestätigung und
   Kino-Radiogruppe bedienen; kein horizontaler Überlauf. Eine Menge über dem
   Tagesziel prüfen: alle Skalen enden bei 100 %, Wortlaut bleibt neutral.
9. Löschtest unten ausführen und den Ablauf im gebauten Preview ohne `src/kino`
   wiederholen. Offline-Fehler separat von der normalen Browserkonsole bewerten.

## Ausführen

```bash
npm run dev
```

Dann die Seite unter dem ausgegebenen Port öffnen, zum Beispiel
`http://localhost:5173/pruefungen/a2-speicher.html`.

## a2-speicher.html — Speichermodul

Prüft `src/lib/speicher.js` in zwei Durchgängen. Der erste läuft beim Laden,
danach erscheint ein Knopf für einen echten Seitenneuaufbau; der zweite prüft,
dass der gespeicherte Stand das Neuladen unverändert übersteht.

Geprüft werden alle Ladefälle (leer, gültig, unbekannte Version, kaputtes JSON,
fremder Inhalt, Speicher nicht verfügbar), die Sperren beim Schreiben, der
veraltete Schreibzugriff aus einem zweiten Fenster, ein echt gesperrter
Ursprung in einem Sandbox-iframe und die tatsächliche Speicherquote des
Browsers. Wie gross diese Quote ist, entscheidet der Browser — sie wird
ertastet statt angenommen. Wird sie bis 64 Mi Zeichen nicht erreicht, meldet
die Seite diesen einen Punkt als übersprungen statt als Fehler.

> [!] Die Seite bricht ohne Änderung ab, wenn der Ursprung schon Daten enthält.
> Sie räumt am Ende alles auf, was sie selbst angelegt hat.

## av-anzeigeebene.html — Bedingungen und Lebenszyklus

Auf einem leeren Testursprung `/pruefungen/av-anzeigeebene.html` öffnen.
Erwartet: 38 Zeilen `BESTANDEN`, anschliessend `ABSCHLUSS`, kein `FEHLER`.
Die Seite prüft echte Projektmodule mit kontrollierten Browserbedingungen:
30/44/45/60/120 fps, Erholung, Moduswahl, geteilten Zustand, Live-Änderung der
Bewegungspräferenz, Sichtbarkeit, Sitzungsgrenze, Messungsende, fehlendes WebGL
und Speicherschutz. Sie stellt Browserfunktionen wieder her und entfernt nur
selbst angelegte App-Daten. Vorhandene Daten führen zum Abbruch ohne Änderung.

## AV in der App prüfen

`npm run dev` starten und die tatsächlich ausgegebene URL verwenden. In einem
separaten Browser-Testprofil `/profil` öffnen:

- Automatisch: mit WebGL, sichtbarem Tab und ohne Bewegungsreduktion aktiv.
- Aus: Ruhefassung. Neu laden: Aus bleibt gewählt.
- In den Browser-Entwicklerwerkzeugen unter Rendering die Medienfunktion
  `prefers-reduced-motion` auf `reduce` setzen, dann zurück. Automatisch
  reagiert ohne Neuladen; auch An respektiert diese Einstellung.
- Ohne verfügbaren WebGL-Kontext bleibt auch An ruhig. AV prüft dies durch eine
  kurzlebige `OffscreenCanvas`-Kontextprobe im Speicher; kein Canvas im DOM,
  keine Zeichnung. Fehlt OffscreenCanvas, gilt ebenfalls die Ruhefassung.
- Anderen Tab in den Vordergrund holen: `document.visibilityState` muss
  tatsächlich `hidden` melden. Die Messung pausiert; Rückkehr beginnt ein neues
  Messfenster. Ein Prüfbrowser, der alle Tabs sichtbar hält, bestätigt diesen
  echten Wechsel nicht. Die Prüfseite deckt denselben Ereignisweg simuliert ab.
- Für schwache Leistung `requestAnimationFrame` im isolierten Prüflauf auf
  etwa 30 Aufrufe pro Sekunde begrenzen. Nach drei langsamen Sekundenfenstern
  erscheint auch auf Heute die Meldung mit Link zum Profil; keine weiteren
  Messaufträge. An übersteuert, zurück auf Automatisch bleibt ruhig.
- Die Herunterstufung gilt bis zum Neuladen dieses Tabs, auch über Routenwechsel.
  Nur `einstellungen.kinoModus` wird gespeichert. Drei aufeinanderfolgende
  Messfenster von jeweils mindestens einer Sekunde müssen unter 45 fps liegen.
- Bei 375 px und 200% Schrift: mit Tab in die Radiogruppe, Pfeiltasten zur
  Auswahl, Leertaste zum Setzen, Tab wieder hinaus. Fokus, Beschriftungen und
  alle Inhalte bleiben erreichbar; kein horizontales Scrollen.

Keine Animation ist Teil von AV. «Aktiv» ist die Freigabe für spätere Effekte.
Die Funktionen werden von App.vue einmal gestartet und beim Entfernen beendet.

## AV-Löschtest unter Windows

Aus dem Repository in PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File pruefungen/av-loeschtest.ps1 -Aktion auslagern
```

Das Skript prüft beide absoluten Pfade und verschiebt `src/kino` innerhalb des
Repositorys nach `pruefungen/.av-kino-ausgelagert`. Es führt `npm run lint` und
`npm run build` aus. Erwartet: beide Exitcodes 0 und `BESTANDEN`. Bei einem
Prüffehler stellt es den Ordner sofort wieder her.

Während der Ordner fehlt, den gerade gebauten Stand prüfen:

```powershell
npm run preview -- --host 127.0.0.1
```

Die ausgegebene URL öffnen. Heute, Training, Rang und Profil müssen über die
Navigation und direkte URLs erreichbar bleiben. Im Profil alle drei Modi,
Tastaturbedienung und Neuladen prüfen. Der vorhandene Umfang von A1 bleibt
vollständig bedienbar; noch nicht implementierte Fachfunktionen bleiben offen.
Anschliessend immer wiederherstellen:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File pruefungen/av-loeschtest.ps1 -Aktion wiederherstellen
```

Erwartet: `WIEDERHERGESTELLT`, `src/kino/README.md` wieder vorhanden und keine
Ablage mehr in `pruefungen/`. Ohne `-Aktion` führt das Skript nur Lint/Build aus
und stellt automatisch wieder her; das ersetzt keine Browserprüfung.
