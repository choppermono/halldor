param(
  [ValidateSet('pruefen', 'auslagern', 'wiederherstellen')]
  [string]$Aktion = 'pruefen'
)

$ErrorActionPreference = 'Stop'
$repoWurzel = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$kinoPfad = [System.IO.Path]::GetFullPath((Join-Path $repoWurzel 'src\kino'))
$ablagePfad = [System.IO.Path]::GetFullPath((Join-Path $repoWurzel 'pruefungen\.av-kino-ausgelagert'))
foreach ($pfad in @($kinoPfad, $ablagePfad)) {
  if (-not $pfad.StartsWith($repoWurzel + '\', [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Pfad liegt ausserhalb des Repositorys: $pfad"
  }
  if ((Test-Path -LiteralPath $pfad) -and ((Get-Item -LiteralPath $pfad).Attributes -band [System.IO.FileAttributes]::ReparsePoint)) {
    throw "Keine Verknuepfungen verschieben: $pfad"
  }
}

function Kino-Wiederherstellen {
  if (Test-Path -LiteralPath $kinoPfad) { throw 'src/kino existiert bereits; nichts wird ueberschrieben.' }
  if (-not (Test-Path -LiteralPath $ablagePfad)) { throw 'Keine ausgelagerte Fassung vorhanden.' }
  Move-Item -LiteralPath $ablagePfad -Destination $kinoPfad
  Write-Output 'WIEDERHERGESTELLT: src/kino ist wieder vorhanden.'
}

if ($Aktion -eq 'wiederherstellen') {
  Kino-Wiederherstellen
  exit 0
}
if (-not (Test-Path -LiteralPath $kinoPfad)) { throw 'src/kino fehlt bereits.' }
if (Test-Path -LiteralPath $ablagePfad) { throw 'Ablage belegt; zuerst wiederherstellen.' }

$ausgelagert = $false
$pruefungBestanden = $false
Push-Location -LiteralPath $repoWurzel
try {
  Move-Item -LiteralPath $kinoPfad -Destination $ablagePfad
  $ausgelagert = $true
  npm run lint
  if ($LASTEXITCODE -ne 0) { throw 'Lint ohne src/kino fehlgeschlagen.' }
  npm run build
  if ($LASTEXITCODE -ne 0) { throw 'Build ohne src/kino fehlgeschlagen.' }
  $pruefungBestanden = $true
  Write-Output 'BESTANDEN: Lint und Build ohne src/kino.'
  if ($Aktion -eq 'auslagern') {
    Write-Output 'src/kino bleibt fuer die Browserpruefung ausgelagert. Danach -Aktion wiederherstellen ausfuehren.'
  }
} finally {
  if ($ausgelagert -and ($Aktion -ne 'auslagern' -or -not $pruefungBestanden)) {
    Kino-Wiederherstellen
  }
  Pop-Location
}
