# V0 – archivierter visueller Entwurf

Unveränderter Stand vom 10.09.2026 vor A1. Die fünf Dateien unter `src/`
stammen vollständig aus dem von Florian bestätigten KI-Spike. Beim Kopieren
wurden die SHA-256-Prüfsummen aller fünf Originale und Kopien verglichen.

Enthalten sind die Mock-Startansicht, beide Three.js-Komponenten, sämtliche
globalen Spike-Styles und die damaligen Design-Tokens. Relative Importe der
App bleiben innerhalb dieser Kopie auflösbar. Abhängigkeit: Three.js 0.186.0;
Vue 3.5.41 und Vite 8.2.2 waren installiert.

Dies ist ein Quellarchiv ohne eigenen Startpunkt. Nicht aus der regulären App
importieren und nicht in deren Navigation aufnehmen. Bei späteren Änderungen
an den produktiven Tokens bleibt diese V0-Fassung erhalten.

A1 ersetzt die reguläre Startansicht durch vier leere Seiten. Dieses Archiv ist nicht in deren Importpfad eingebunden. Keine Ranglogik,
keine gespeicherten Daten und keine technische Freigabe: Fallback,
Ladeabbruch und Ressourcenfreigabe bleiben gemäss V0-Review offen.

Ausgangszweig: `feature/v0-pruefung`, HEAD:
`7fc812d934d3fd90d7bda0a1c3e7790d0fbccf2d`. Vorher bereits uncommittiert:
`CLAUDE.md`, `package.json`, `package-lock.json`, `src/main.js` sowie die fünf
archivierten Dateien (beide Komponenten waren untracked). Die Herkunft von
main.js und Paketänderungen ist separat zu klären.

A1 beginnt auf `feature/a1-grundgeruest` mit diesen übernommenen Änderungen.
Es wurde nichts zurückgesetzt oder committed; main bleibt unverändert.
