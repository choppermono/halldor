# Ernährungs-MVP: ausgeführte Prüfung

Stand: 12.09.2026. Basis `main` / `origin/main`: `2efb295`.
Branch: `feature/mvp-ernaehrung`. Kein Push, Pull Request oder Deploy.

## Ergebnis

Der Ablauf vom Onboarding bis zur persistenten Tagesbilanz ist im Browser
bedienbar, einschliesslich manueller Produkte, eingetippter Barcodes,
Gramm-Bestätigung, Löschen und Rückblick. Keine neuen Abhängigkeiten.

| Ausgeführte Prüfung                                 | Ergebnis                                                                                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint`                                      | Bestanden, keine Befunde                                                                                                                  |
| `npm run build`                                     | Bestanden; vorhandener Three.js-Chunk erzeugt eine Grössenwarnung                                                                         |
| `npm run format:check` / `prettier --check .`       | Bestanden                                                                                                                                 |
| `git diff --check`                                  | Bestanden                                                                                                                                 |
| `pruefungen/av-anzeigeebene.html`                   | 38 Punkte bestanden                                                                                                                       |
| `pruefungen/a2-speicher.html`                       | 158 Punkte bestanden, inklusive echtem Reload und Aufräumen                                                                               |
| `pruefungen/mvp-ernaehrung.html`                    | 145 Punkte bestanden; darunter 180 kombinierte Rechenkern-Eingaben                                                                        |
| Löschtest mit `av-loeschtest.ps1 -Aktion auslagern` | Lint und Build ohne `src/kino` bestanden                                                                                                  |
| Browser im gebauten Stand ohne Kino                 | Onboarding, manuelle Erfassung, echter Barcode, Löschen, Reload, gestern, vier Navigationsziele und alle Kino-Modi bedienbar; kein Canvas |
| Wiederherstellen                                    | `src/kino` zurück, keine ausgelagerte Kopie übrig                                                                                         |

Dev-Server selbst gestartet: `npm run dev -- --host 127.0.0.1`.
Vite meldete 5173 belegt und **http://127.0.0.1:5174/** als verwendete URL.
Der Preview-Server für den Löschtest meldete **http://127.0.0.1:4173/**.

## Tatsächlich im Browser durchgegangen

- Profil ausgefüllt und Hinweis bestätigt. Formel, Grundumsatz, Gesamtumsatz,
  Rate und Makroaufteilung gelesen; Ziel auf Heute sichtbar.
- Haferflocken manuell mit 380 kcal, 13 g Protein, 7 g Fett und 60 g
  Kohlenhydraten pro 100 g angelegt; 50 g bestätigt, etwa 200 kcal angezeigt.
- `3017620422003` von Hand eingegeben. Echte Open-Food-Facts-Antwort HTTP 200,
  Produkt Nutella. 15 g bestätigt und im Tagebuch wiedergefunden. Das aktuelle
  Produkt hatte keine verwendbare Portionsvorbelegung; es wurde nichts erfunden.
- Haferflocken gelöscht; Bilanz aktualisiert. Echtes Neuladen erhielt das
  gesamte gespeicherte Dokument einschliesslich Revision unverändert.
- Gestern geöffnet, fertiger Leerzustand sichtbar; zurück zu heute.
- Produkt ohne Nährwerte erfasst: bekannte Teilsumme und Unvollständigkeit
  sichtbar; kein scheinbar vollständiges Restziel. HTML-Zeichen im Namen
  blieben Text, kein Bild oder ausführbarer Inhalt entstand.
- Netzwerk im Browser getrennt: Verlauf, gestern/heute und Löschen bedienbar.
  Barcode-Abfrage zeigte den Netzhinweis. Im Build ohne Kino zusätzlich ein
  manuelles Produkt offline gespeichert und wieder gelöscht.
- Ungültige Makros provoziert: weiblich, 70 Jahre, 140 cm, 40 kg, Faktor 1.2,
  Abnehmen mit 1 %. Sichtbarer Fehler, höchste rechnerisch passende Rate
  0.847272 %, keine erfundene Zielzahl. Profil anschliessend zurückgestellt.
- Über dem Tagesziel: Energie- und drei Makroskalen hatten jeweils genau
  100 % Breite; keine bewertende Sprache.
- Bei 375 px und 200 % Wurzelschrift Profil, Heute, Produktformular,
  Mengenbestätigung und Kino-Auswahl bedient. Kein horizontaler Überlauf.
- Frischer normaler Browserdurchlauf: keine Konsolen- oder JavaScript-Fehler.
  Absichtlich offline durchgeführte Läufe erzeugten erwartete Browsermeldungen
  `ERR_INTERNET_DISCONNECTED` für Netzressourcen; keine JavaScript-Ausnahmen.

Die erste Lint-Prüfung meldete den einteiligen Vue-Komponentennamen
«Makrobalken». Der explizite Komponentenname `MakroBalken` behebt das;
anschliessende Lint-Läufe bestanden. Keine Prüfpunktzahl wurde angepasst.

## Dateien und Entscheidungen

- `src/lib/ernaehrung.js`: reine, datumsparametrisierte Berechnungen und alle
  fachlichen Konstanten samt Evidenzeinstufung. `darstellung.js` rundet die
  Ausgabe; `lebensmittel.js` prüft Produkte und summiert bekannte Anteile.
- `src/lib/openfoodfacts.js`: Barcode und Suchschnittstelle, eingeschränkte
  Felder, benannte Netz-/Antwortfehler; unbekanntes Produkt und leere Suche
  sind Ergebnisse. Quellen: offizielle API-Dokumentation und die vorgegebene
  Fachlogik-Quellennotiz. Keine Suchoberfläche und kein Kamera-Scanner.
- `useProfil.js`, `useTagebuch.js`: geteilter Zustand, Schreibschutz und
  Momentaufnahmen über das unveränderte `speicher.js`.
- `Onboarding.vue`, `Profil.vue`, `ProduktBestaetigen.vue`, `Heute.vue` plus
  `ProfilFormular.vue`, `ZielHerleitung.vue`, `Makrobalken.vue`, Router und Styles.
- Version 1 bleibt. Gewählte Rate ergänzt das Profil; ohne Feld gilt 0.5 %.
  Unbekannte Pflichtnährwerte sind explizit `null`. Tagesziele speichern zusätzlich
  Herleitung und Erfassungsdatum. Keine Änderung bestehender Dokumentbereiche.
- Keine feste Kalorienuntergrenze. Als berechenbare Grenze dient ausschliesslich
  die Energie von Protein und Fett. Sie ist ausdrücklich keine medizinische
  Mindestzufuhr. Eine zusätzliche persönliche Plausibilitätsformel wäre unbelegt.
- Fachlich gültige Körperdaten können trotz unmöglicher Makros gespeichert
  werden. Ein neuer Tag benötigt ein berechenbares Ziel; vorhandene Tage bleiben
  mit ihrem bereits eingefrorenen Ziel verwendbar.
- Ein erstmals nachgetragener Tag verwendet das aktuell gültige Profil.
  Ohne vollständige Profilhistorie wird kein historischer Rechenstand erfunden.
  Löschen des letzten Eintrags behält das Tagesziel.
- Technische Eingabegrenzen sind ausdrücklich unbelegt dokumentiert. Die
  Übertragung der Gewichtsverlustrate auf Aufbau ist ebenfalls als unbelegt
  gekennzeichnet. Sämtliche Berechnungen bleiben intern ungerundet.
- Cormorant entfällt; Titel verwenden IBM Plex Sans. Neue Tokens begründen
  dichte Eingaben, Platz bei vergrösserter Schrift und die bis zum Rand
  verlängerte Energieskala. Keine neuen Kino-Effekte.
- Die alte Untergrenzen-Regel in `CLAUDE.md` wurde an den aktuellen Auftrag
  angepasst. Git benötigte anfangs eine aufgehobene Windows-Sandbox-Sperre;
  nach der Freigabe wurde nur für einzelne Git-Aufrufe `safe.directory` auf
  dieses Repository beschränkt, ohne globale Git-Einstellungen zu ändern.

## Grenzen

Keine Prüfung auf physischen Mobilgeräten. Offline-Neuladen der gesamten App
ist ohne Service Worker nicht zugesichert; der geöffnete Verlauf ist offline
bedienbar. Primärquellen für Aktivitätsfaktoren und kcal je kg Körpermasse bleiben
wie vorgegeben offen. Kamera, Manifest, Deploy, Training und Rang sind ausserhalb
dieses Pakets. Push und Pull Request bleiben unaufgefordert aus.
