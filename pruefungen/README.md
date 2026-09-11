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
