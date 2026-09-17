# Schriften

Alle Schriften werden **selbst ausgeliefert**, nicht von einem CDN geladen.
Grund: kein zusätzliches Laufzeit-Netzwerkziel und keine Anfrage an einen
Dritten beim Aufruf der App.

Format ist durchgehend **woff2** mit `unicode-range`-Aufteilung in `latin` und
`latin-ext`. Der Browser lädt nur die Teilmenge, die der angezeigte Text
braucht. Vorher lagen hier TTF-Dateien: 2.4 MB, ohne Aufteilung.

| Familie                               | Schnitte      | Lizenz                            | Copyright        |
| ------------------------------------- | ------------- | --------------------------------- | ---------------- |
| Cormorant Garamond                    | 300, 400, 500 | SIL OFL 1.1 → `OFL-Cormorant.txt` | Catharsis Fonts  |
| Barlow                                | 300, 400, 500 | SIL OFL 1.1                       | Jeremy Tribby    |
| JetBrains Mono                        | 400, 500      | SIL OFL 1.1                       | JetBrains s.r.o. |
| IBM Plex Mono / Sans / Sans Condensed | 400–600       | SIL OFL 1.1 → `OFL.txt`           | IBM Corp.        |

Bezogen über Google Fonts (`fonts.googleapis.com/css2`), die woff2-Dateien
stammen von `fonts.gstatic.com`. Die Zuordnung Familie → Datei steht in
`fonts.css`.

> [!note] Zwei Schriftsysteme, vorübergehend
> Cormorant, Barlow und JetBrains Mono gehören zur Kunstrichtung vom
> 17.09.2026 und hängen an den Tokens `--display`, `--body`, `--mono`.
> IBM Plex hängt am älteren `--schrift-*`-Satz und trägt heute noch den
> grössten Teil der Oberfläche.
>
> Die Umstellung passiert in **P-C**, weil sie jeden Bildschirm betrifft und
> visuell abgenommen werden muss — Cormorant ist deutlich schmaler und
> leichter als Plex Sans Condensed, Titelgrössen stimmen danach nicht mehr.
> Erst dann fallen die Plex-Dateien weg.
