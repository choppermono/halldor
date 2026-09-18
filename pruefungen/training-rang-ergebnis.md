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

---

## Nachtrag 18.09.2026 — Review und Korrekturen

Durchsicht durch Claude. Die Grundlage hielt jeder Prüfung stand: alle
fünfzig Schwellen exakt gegen `Quellen-Fachlogik.md`, Epley und Brzycki
korrekt, kein Gesamtrang, Schichtgrenze intakt, 19 Übungen ehrlich ohne Stufe.

Drei Fehler lagen in der Progression. Alle drei wurden **gegen den echten
Code ausgeführt**, nicht nur aus dem Lesen behauptet — und zwei davon waren
durch Prüfpunkte festgeschrieben, weshalb 265 von 265 grün waren, obwohl das
Verhalten falsch war.

| Fall                                                               | vorher                                                 | nachher                       |
| ------------------------------------------------------------------ | ------------------------------------------------------ | ----------------------------- |
| 72.5 kg sauber, dann Übung dreimal ausgelassen                     | Deload auf 65.3 kg, Meldung «drei verfehlte Einheiten» | Last bleibt 72.5 kg           |
| Ziel abnehmen, alle Sätze am oberen Rand                           | Steigerung verweigert                                  | Steigerung auf 62.5 kg        |
| Ziel abnehmen, Last gehalten, Wiederholungen unter der Untergrenze | Deload auf 54 kg                                       | gehalten, als Erfolg gewertet |
| 72.5 kg, dreimal verfehlt                                          | Deload auf 65.3 kg                                     | Deload auf 65.0 kg            |

### A — Eine ausgelassene Übung ist kein Fehlversuch (E-123)

Die Verlaufsauswertung behielt Einheiten, in denen eine Übung nur
_vorgesehen_, aber nicht gemacht war. Null Sätze galten als unvollständig und
damit als verfehlt; dreimal ausgelassen löste einen Deload auf eine Last aus,
an der die Person nie gescheitert war — mit einer Meldung, die das Gegenteil
behauptete. Jetzt zählen nur Einheiten, in denen die Übung gemacht wurde.

### B — F14 war verkehrt herum umgesetzt (E-124)

F14 soll verhindern, dass jemand im Defizit «an einer falschen Erwartung
scheitert». Der Code tat das Gegenteil: er **verweigerte** eine verdiente
Steigerung, die niemand verboten hatte, und **bestrafte** eine gehaltene Last
mit einem Deload. Die Oberseite war blockiert, die Unterseite ungeschützt.

Jetzt schützt F14 die Unterseite: im Defizit ist eine gehaltene Last ein
Erfolg, auch wenn die Wiederholungen sinken, und löst keinen Deload aus. Eine
verdiente Steigerung kommt auch im Defizit. Wird die Last nicht gehalten,
greift der Deload wie sonst. `leistungImDefizitBewerten` bleibt die benannte
Funktion; sie sitzt jetzt an der Stelle, an der sie wirkt.

### C — Deload auf ladbare Lasten (E-125)

Der Deload rundete auf 0.1 kg: 72.5 × 0.9 → 65.3 kg, mit üblichen Scheiben
nicht auflegbar. Die Steigerung ist 2.5 / 5 kg gerade _weil_ es kleinere
Scheiben meist nicht gibt; der Deload rundet jetzt auf dieselbe Schrittweite
ab. 72.5 → 65.0 kg, 107.5 → 95 kg.

### Prüfpunkte

Zwei wurden **bewusst umgestellt**, jeweils mit Kommentar und Verweis ins
Entscheidungslog — denn ein Prüfpunkt, der zusammen mit dem geprüften Verhalten
kippt, sichert sonst nichts mehr ab:

- «Dreimal vollständig ausgelassen zählt als drei Fehlversuche»
  → «Ausgelassene Übung ist kein Fehlversuch und löst keinen Deload aus»
- «Abnehmen wertet Halten als Erfolg» (prüfte die verweigerte Steigerung)
  → «Im Defizit bleibt eine verdiente Steigerung erlaubt»

Vier kamen dazu: gehaltene Last im Defizit schützt vor dem Deload; nicht
gehaltene Last im Defizit löst ihn aus; Deload rundet auf 2.5 kg
(Oberkörper) und auf 5 kg (Unterkörper).

### Nach den Korrekturen

| Prüfung                                                   | Ergebnis                                                             |
| --------------------------------------------------------- | -------------------------------------------------------------------- |
| `pruefungen/training-rang.html`                           | **269 bestanden**, Speicher danach leer, keine Konsolenfehler        |
| `pruefungen/av-anzeigeebene.html`                         | 33 bestanden, Speicher danach leer                                   |
| Alle fünf Routen bei 375 px, kopflos                      | rendern, Canvas auf jeder Route, kein Überlauf, keine Konsolenfehler |
| `npm run lint`, `npm run build`, `npx prettier --check .` | bestanden                                                            |

### Nicht korrigiert, aber zu wissen

- **T-Bar-Rudern hängt an Bankdrücken.** Eine Zugübung an einer Druckübung
  gemessen. Die Quelle trägt das Verhältnis; der Grund für die Wahl ist, dass
  unter den fünf Ankern keine Langhantel-Zugübung ist und Klimmzüge mit
  Gesamtlast rechnen. Im Gespräch parat haben.
- Die Übungs-ID `rumänisches-kreuzheben` enthält als einzige von 30 einen
  Umlaut; alle anderen schreiben `ae`, `oe`, `ue`. Gespeicherte Sätze
  verweisen auf diese ID, deshalb nicht nebenbei umbenannt.
