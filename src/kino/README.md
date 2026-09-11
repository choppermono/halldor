# Anzeigeebene

AV legt die Grenze an. Hier gibt es noch keinen Effekt und keinen Import.

1. **Einbahnstrasse:** Die Anzeigeebene liest Kernzustand. Sie schreibt ihn nie,
   speichert nichts und trifft keine fachlichen Entscheidungen. Der Kern
   importiert nichts aus diesem Ordner. Spätere Effekte werden nur nachgeladen.
2. **Löschtest:** `src/kino` vorübergehend verschieben. Lint, Build und alle
   vorhandenen Bedienabläufe müssen weiterhin funktionieren. Ausführbarer
   Ablauf: `pruefungen/av-loeschtest.ps1`.
3. **Fertige Ruhefassung:** Jede statische Darstellung ist vollständig, ohne
   Platzhalter für abgeschaltete Effekte. Alle Informationen bleiben erhalten.

Der Schalter liegt im Kern (`src/composables/useAnzeigeebene.js`), damit er
auch nach dem Löschtest verfügbar bleibt. Er liefert `anzeigeebeneAktiv`.
