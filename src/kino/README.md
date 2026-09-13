# Anzeigeebene

Der Kern steht für sich. `KinoAuflage.vue` und `KinoHintergrund.vue` verwenden
nur ein optionales `import.meta.glob`-Register. Ohne diesen Ordner sind die
Register leer: kein direkter Import, kein Platzhalter, kein fehlender Messwert.

## Freigabe und Lebenszyklus

K1, K2 und K4 folgen `anzeigeebeneAktiv`. K7 braucht zusätzlich `webglAktiv`.
Die Einhängepunkte sperren **alle** Auflagen bei reduzierter Bewegung, auch im
Modus An. Das ist die strengere Vorgabe des Gestaltungsauftrags vom 12.09.2026;
der bestehende AV-Zustandsvertrag und seine 38 Modulprüfungen bleiben erhalten.
Die Profilanzeige erklärt die tatsächlich sichtbare Ruhefassung.

Bei Aus, Bewegungsreduktion oder unsichtbarem Tab werden Auflagen entfernt.
Timer, Watches und WAAPI-Animationen werden beendet; das Sternenfeld gibt
Geometrie, Material, Renderer und WebGL-Kontext frei. Späte Imports werden
verworfen. Die Kern-CSS zeigt bei Bewegungsreduktion den Endstand bereits vor
dem nächsten Vue-/MediaQuery-Ereignis.

Keine Auflage schreibt Fachzustand, ruft Speicherfunktionen auf oder entscheidet
über Daten. Der Sitzungsmarker `trackify-start` liegt in App.vue ausschließlich
in sessionStorage; er wird auch bei übersprungenem Start gesetzt. Ohne
verfügbaren Sitzungsmarker bleibt der Start ruhig.

## Pakete und Bewegungsgründe

| Paket | Darstellung                                     | Token / Grund                                                                                                                                                                    |
| ----- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| K1    | Linien, Systemzeilen, Wortmarke                 | `--dauer-start: 1100ms`, Eintritt für Linien, `--kurve-technisch` für Systemzeilen. Jede Eingabe beendet ohne Ereignissperre. Ein später Import holt den Start nicht nach.       |
| K2    | Tageszahl, Makrowerte, Produktname beim Treffer | `--dauer-glyphen: 420ms`, Takt 42ms, Auflösung nach den acht Stufen von `--kurve-technisch`. Der echte Wert steht sofort im Kern-DOM; die dekorative Kopie ist aria-hidden.      |
| K4    | Spur und Zeiger über dem fertigen SVG           | `--dauer-bogen: 760ms`, `--kurve-bogen` fährt zum Messwert. WAAPI verändert nur die SVG-Spur und den Zeiger. Fehler oder fehlendes WAAPI geben sofort den statischen Bogen frei. |
| K7    | Ein globales Sternenfeld                        | 520 Punkte, Deckkraft 0.2, lineare langsame Drift, Pixelratio höchstens 1.5. Keine Datenaussage, Textur oder Nachbearbeitung.                                                    |

K3 und K5 sind Kern-CSS. Die statische Körnung liegt als gekacheltes
feTurbulence-SVG über der App. Eine einzige Lichtquelle oben links begründet
Aufhellung und Vignette; beide Schichten nehmen keine Zeigerereignisse an.
Die View Transitions nutzen den vorhandenen Vue-Router-Link: Navigation startet
sofort, nur die Browserschnappschüsse bewegen sich. Eintritt und Austritt haben
verschiedene Kurven; Listen erscheinen im Abstand von 40ms. Snapshots sperren
keine Eingabe. Speichern wartet auf keinen Effekt.

## Ruhefassung und Tokens

TagesBogen.vue enthält den vollständigen Bogen einschließlich Endpunkt. Die
Bilanz begrenzt die Spur auf 100%; Überschreitung wechselt von gedämpftem zu
hellem Elfenbein. Rot bezeichnet keine Nährwertbewertung.
GlyphenText.vue enthält immer den vollständigen, zugänglichen Endwert. Nur eine
tatsächlich montierte Auflage blendet ihn optisch aus. Ihre Breite wird vom
Endwert vorgegeben, damit auch schmale Displayzeichen keinen Layoutsprung auslösen.

Alle Farben, Schriftgrößen, Abstände, Ebenen, Material-, Zeit- und Kurvenwerte
stehen in `src/styles/tokens.css`. SVG-Pfadkoordinaten beschreiben Geometrie,
keine Layoutabstände. Die lokalen Plex-Schriften unter `public/fonts` verwenden
die beigefügte SIL Open Font License; es kam keine npm-Abhängigkeit hinzu.

## Löschtest

`pruefungen/av-loeschtest.ps1 -Aktion auslagern` verschiebt diesen Ordner nach
Prüfung der absoluten Pfade und baut den Kern. Anschließend den gebauten Preview
im Browser prüfen. Mit `-Aktion wiederherstellen` wird der Ordner zurückgelegt.
Der tatsächliche Prüflauf steht in `pruefungen/visuell-ergebnis.md`.
