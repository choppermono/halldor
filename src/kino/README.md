# Anzeigeebene

K7 ergänzt ein einziges globales, rein atmosphärisches Sternenfeld. Es zeigt
keine Daten und bleibt bei Routenwechseln bestehen.

1. **Einbahnstrasse:** Die Anzeigeebene liest Kernzustand. Sie schreibt ihn nie,
   speichert nichts und trifft keine fachlichen Entscheidungen. Der Kern
   importiert kein Modul aus diesem Ordner statisch. Effekte werden nur nachgeladen.
2. **Löschtest:** `src/kino` vorübergehend verschieben. Lint, Build und alle
   vorhandenen Bedienabläufe müssen weiterhin funktionieren. Ausführbarer
   Ablauf: `pruefungen/av-loeschtest.ps1`.
3. **Fertige Ruhefassung:** Jede statische Darstellung ist vollständig, ohne
   Platzhalter für abgeschaltete Effekte. Alle Informationen bleiben erhalten.

Der Schalter liegt im Kern (`src/composables/useAnzeigeebene.js`), damit er
auch nach dem Löschtest verfügbar bleibt. `anzeigeebeneAktiv` erlaubt Effekte
aus CSS und JS; `webglAktiv` erlaubt zusätzlich 3D. K7 folgt ausschliesslich
`webglAktiv`, einschliesslich Live-Änderungen der Bewegungspräferenz,
Tab-Sichtbarkeit und Leistungsherunterstufung. Der Modus **An** übersteuert
reduzierte Bewegung gemäss AV; ein unsichtbarer Tab pausiert auch dann.

## Einhängepunkt und Laden

`src/components/KinoHintergrund.vue` verwendet
`import.meta.glob('../kino/*.vue')`. Das Register enthält verzögerte
Ladefunktionen und ist bei fehlendem Ordner leer. Anders als ein zur Laufzeit
zusammengesetzter URL-Import lässt sich dieser Weg von Vite für den
Produktionsbuild auflösen und in separate Chunks zerlegen. Erst bei
`webglAktiv` wird `AppSternenfeld.vue` geladen, darin erst dann Three.js.

Beide Imports liegen in einem `try`. Nach jedem `await` werden Lebenszyklus
und Freigabe erneut geprüft. Ein verspätetes Ergebnis nach Entfernen wird
verworfen. Nach der ersten erfolgreichen Montage bleibt die Szene für
Pausen erhalten; das Canvas wird unsichtbar und die RAF-Schleife beendet.
Grössenänderungen zeichnen auch in dieser Pause ein neues Bild.

## Gestaltung und Ressourcen

Die unveränderte CSS-Grundfläche des Kerns ist die vollständige Ruhefassung.
Das transparente Canvas liegt innerhalb der isolierten App-Hülle hinter dem
HTML, ist `aria-hidden` und nimmt keine Zeigerereignisse an.

Alle Gestaltungs- und Leistungswerte stehen als `--sterne-*` in `tokens.css`,
jeweils mit Begründung. 180 matte Punkte, Deckkraft 0.18, kein Leuchten,
keine Texturen, Schatten oder Nachbearbeitung. Die Bewegungskurve ist **linear**:
konstante Radiant pro Sekunde, ohne Beschleunigungsakzente. Der Y-Umlauf
dauert knapp 35 Minuten. Pausenzeiten werden nicht nachgeholt; Pixelratio
ist auf 1.5 begrenzt.

Entfernen, Kontextverlust oder ein Zeichenfehler beendet die Schleife und
den ResizeObserver und entsorgt Geometrie, Material und Renderer explizit.
Der WebGL-Kontext wird freigegeben, das Canvas entfernt. Es werden keine
Texturen angelegt, daher gibt es keine Texturressourcen zu entsorgen.
K7 setzt keine AV-Zustände und verwendet weder `matchMedia` noch einen
IntersectionObserver.
