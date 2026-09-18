# Entwürfe P-C — die Vorgabe für den Gestaltungsdurchgang

Florian hat diese Bildschirme am 18.09.2026 angesehen und freigegeben. Sie
sind die **Vorgabe** für P-C, nicht eine Anregung. Abweichen nur mit Grund,
und der Grund gehört ins Prüfergebnis.

| Datei                   | Bildschirm                                                                     |
| ----------------------- | ------------------------------------------------------------------------------ |
| `1-einheit-starten.png` | Training vor dem Start: der Plan auf einen Blick, ein Knopf                    |
| `2-satz-erfassen.png`   | **Der Kern.** Eine Übung im Fokus, Vorgabe steht da, ein Tipp erfasst den Satz |
| `3-satz-anpassen.png`   | Nur bei Abweichung: Plus/Minus in der Schrittweite der Übung                   |
| `4-rang.png`            | Rang nach Kilogramm, Stufenleiter Bronze bis Diamant                           |
| `5-desktop.png`         | Ab 1024 px: Seitenleiste statt unterer Leiste, zwei Spalten                    |
| `ref-heute.png`         | Heute in der Kunstrichtung (Entwurf vom 17.09.2026)                            |
| `ref-scan.png`          | Scan in der Kunstrichtung (Entwurf vom 17.09.2026)                             |

`quelle/` enthält das HTML der Entwürfe. Daraus lassen sich exakte Werte
ablesen — Abstände, Grössen, Farben. Es ist **kein** Anwendungscode und wird
nicht übernommen: die Dateien stammen aus einem Entwurfswerkzeug und laden
dessen Laufzeit (`support.js`), die es hier nicht gibt.

Bei den Referenzen `ref-heute` und `ref-scan` gilt die **Navigation aus den
P-C-Entwürfen** (Symbol plus Beschriftung), nicht die ältere reine
Textleiste.

## Entschieden

- **Kantig.** Keine Rundungen ausser Kreisen, wie die Referenz halldor.ch
  (E-130). Eine Variante mit 10 px lag vor und wurde verworfen.
- Die Zahlen im Rang-Entwurf sind **Beispielwerte**. Die echten Schwellen
  sind noch nicht festgelegt.
