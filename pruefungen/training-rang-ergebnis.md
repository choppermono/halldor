# Training und Rang – Prüfergebnis

Datum: 18.09.2026  
Branch: `feature/training-rang`  
Dev-Server: Vite meldete `http://127.0.0.1:5173/` (Port nicht geraten)

## Ergebnis

Stufe 2 und 3 sind als durchgehender Ablauf umgesetzt: Profil laden,
Programmvariante wählen, Einheit starten, Sätze erfassen, Fortschritt und
Gesamtlast sehen, Einheit abschliessen, nächste Vorgabe berechnen und pro Übung
einen Rang mit Herleitung anzeigen.

## Automatisierte Prüfung

| Prüfung                         | Ergebnis  | Tatsächlicher Befund                                                                                                                                                                                                |
| ------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pruefungen/training-rang.html` | bestanden | 265 Prüfpunkte; Epley, Brzycki, 12er-Grenze, Progression, genau drei Fehlversuche inklusive vollständig ausgelassener Übung, 10-%-Deload, F14, alle Tabellen und jede Schwelle direkt an und knapp unter der Grenze |
| Geschlechtstabellen             | bestanden | jede vorhandene Skala für `m` und `w` vollständig durchlaufen; fehlendes Geschlecht liefert Vielfaches ohne Rang                                                                                                    |
| Datenkonsistenz                 | bestanden | 30 eindeutige Übungen; alle Programmverweise gültig; jede Übung hat eine Skala oder eine erklärte Lücke; jede Verhältniszahl hat Messpunkt und Quelle                                                               |
| `npm run lint`                  | bestanden | 0 Fehler, 0 Warnungen                                                                                                                                                                                               |
| `npm run build`                 | bestanden | 314 Module; Haupt-Chunk 123.31 kB, Three.js eigener Chunk 524.17 kB; nicht fehlschlagende Grössenwarnung für Three.js                                                                                               |
| `npx prettier --check .`        | bestanden | alle Dateien entsprechen Prettier                                                                                                                                                                                   |
| `pruefungen/av-loeschtest.ps1`  | bestanden | Lint und Build ohne `src/kino/`; Verzeichnis danach automatisch wiederhergestellt                                                                                                                                   |
| Schichtgrenze                   | bestanden | ausserhalb der Einhängepunkte kein direkter Import aus `src/kino/`; Training und Rang liegen vollständig im Kern                                                                                                    |
| `v-html`                        | bestanden | kein Vorkommen; ESLint-Regel bleibt fehlerwirksam                                                                                                                                                                   |

Beim ersten Build fehlte die bereits in `package.json` und Lockfile deklarierte
Abhängigkeit `three` im lokalen `node_modules`. `npm install` ergänzte genau
dieses Paket; danach bestand der Build. `package-lock.json` änderte sich nicht.

## Browserablauf

Der Ablauf wurde im laufenden Vite-Build bei 375 px Breite durchgeführt.

1. Testprofil angelegt: männliche Formelvariante, 80 kg, 180 cm, Ziel
   `halten`.
2. Zweitageprogramm gewählt und Einheit A gestartet.
3. Drei Bankdrück-Sätze mit 60 kg × 8 erfasst.
4. Fortschritt zeigte 3/18 Sätze, Gesamtlast 1440 kg.
5. Einheit abgeschlossen; Rang geöffnet.
6. Bankdrücken zeigte Epley 76.0 kg, Brzycki 74.5 kg, 0.95 × Körpergewicht,
   Rang `Geübt` und 4.0 kg Abstand zu `Fortgeschritten`.
7. Herleitung aufgeklappt; Formel, verwendeter Satz, beide Schätzwerte und die
   Körpergewichts-Momentaufnahme standen als Text im DOM.
8. Reloadprüfung: der rohe `trackify`-Wert blieb mit 2614 Zeichen bytegleich;
   Dokumentversion 1 und zwei Trainingseinheiten blieben lesbar.
9. Ziel im Profil auf `abnehmen` geändert, Einheit B abgeschlossen und zur
   nächsten Einheit A gewechselt. Die Bankdrück-Vorgabe blieb bei 60 kg und
   zeigte sichtbar: «Beim Ziel Abnehmen gilt eine gehaltene Last als Erfolg;
   eine Steigerung wird nicht verlangt.»
10. Browserkonsole nach Reload: keine Fehler und keine Warnungen.

Bei 375 px hatten Training und Rang jeweils `scrollWidth === clientWidth`
(360/360 px innerhalb des Browserrahmens). Übungsnamen und Rangzahlen wurden
mit 28 px Cormorant Garamond gerendert. Die verlangten Zustände wurden als
Screenshots erfasst: Training leer, Training mit Sätzen, Rang ohne Daten, Rang
mit Daten, geöffnete Herleitung und 200-%-Schriftansicht.

Die 200-%-Prüfung läuft reproduzierbar über
`pruefungen/training-rang-schrift-200.html`: dieselbe App wird bei 375 px in
einem gleichursprünglichen Rahmen geladen und die Wurzelschrift auf 200 %
gesetzt. Ergebnis: kein horizontaler Überlauf (360/360 px). Das prüft die
Layoutanforderung, ist aber keine Messung eines herstellerspezifischen
Browser-Zoom-Menüs.

## Selbst getroffene Entscheidungen

- Der Katalog enthält 30 Übungen. Die Programme sind feste JSON-Daten für
  zwei, drei oder vier Trainingstage.
- Grundübungen verwenden 5–8 Wiederholungen, weitere Mehrgelenksübungen 6–10,
  übrige Übungen 8–12. Diese Fenster sind Produktsetzungen, keine
  Gesundheits- oder Personenempfehlungen.
- Eine Einheit gilt für eine Übung als verfehlt, wenn weniger als die
  vorgegebenen Sätze erfasst wurden oder mindestens einer der vorgesehenen
  Sätze die Untergrenze unterschreitet. Erst drei solche abgeschlossenen
  Einheiten in Folge lösen den Deload aus.
- Bei wechselnden Lasten innerhalb einer Übung verwendet die Progression die
  kleinste Last der vorgesehenen Arbeitssätze. Dadurch wird eine Steigerung
  nicht aus einem einzelnen schwereren Satz abgeleitet.
- Der 10-%-Deload wird auf 0.1 kg gerundet, weil keine kleinere Genauigkeit im
  Datenmodell sinnvoll dargestellt wird. Die Steigerung bleibt exakt +2.5 kg
  beziehungsweise +5.0 kg.
- Die gewählte Programmvariante liegt im bereits vorhandenen offenen Objekt
  `einstellungen`. Das Dokument bleibt Version 1; es gibt kein neues Schema.
- Jede Einheit und jeder Satz tragen Momentaufnahmen. Für den Rang wird das
  beim Satz gespeicherte Körpergewicht und Geschlecht verwendet, nie der
  heutige Profilwert.
- Sechs weitere Skalen sind am Intermediate-Messpunkt aus öffentlich
  sichtbaren Vergleichstabellen abgeleitet: Frontkniebeuge, rumänisches
  Kreuzheben, Schrägbankdrücken, enges Bankdrücken, T-Bar-Rudern und Push
  Press. Die Verhältnisse sind je Geschlecht dokumentiert. Für 19 Übungen
  blieb die Stufe bewusst leer.

## Offene Grenzen

- Die fünf Ankertabellen und die daraus abgeleiteten Skalen sind eigene
  Produktsetzungen. Die externen Vergleichswerte stammen aus
  Nutzererhebungen, nicht aus Studien.
- Maschinenlasten und einseitige Übungen sind zwischen Geräten und
  Ausführungen nicht sauber vergleichbar. Deshalb wurde dafür keine Skala
  erfunden.
- Bei Klimmzügen und Dips muss als Gewicht die Gesamtlast aus Körpergewicht
  plus Zusatzgewicht erfasst werden. Der Hinweis steht direkt am Feld; eine
  automatische Umrechnung ist nicht Teil dieses Datenmodells.
- Relikt-Silhouetten je Rangstufe wurden als nachrangiges Kino-Feature nicht
  ergänzt. Training und Rang sind ohne `src/kino/` vollständig bedienbar.
- Die Browser-Screenshots wurden im Prüfwerkzeug aufgenommen und nicht als
  Binärdateien in den Branch geschrieben.
- Der Build meldet den separat geladenen Three.js-Chunk mit 524.17 kB als
  grösser als 500 kB. Der Kern-Chunk bleibt deutlich darunter; die Meldung ist
  trotzdem ein offener Punkt des Leistungsbudgets für einen späteren
  Gestaltungsdurchgang.
