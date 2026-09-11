# Browserprüfungen

Seiten in diesem Ordner prüfen einzelne Module direkt im Browser. Sie sind
bewusst kein Testframework: die Planung hält fest, dass für dieses Projekt
keines nötig ist. Sie gehören trotzdem ins Repository — eine Prüfung, die nur
auf einem Rechner liegt, kann niemand nachvollziehen.

Die Seiten sind nicht Teil der App. Sie werden nicht importiert und landen in
keinem Produktionsbuild.

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
  reagiert ohne Neuladen; An übersteuert diese Einstellung.
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
