<#
.SYNOPSIS
  Valida a completude do docs/INDICE-GERAL.md.

.DESCRIPTION
  O INDICE-GERAL.md se descreve como indice completo do repositorio. Este script
  garante que todo arquivo versionado que deveria estar listado (docs, core,
  guias, templates e scripts principais) apareca no indice - impedindo que ele
  dessincronize quando um arquivo novo e adicionado. O IA.md lista "manter os
  documentos de indice sincronizados" como atencao recorrente; isto automatiza
  essa checagem.

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts/validate-index.ps1
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$RepoRoot   = Resolve-Path (Join-Path $PSScriptRoot '..')
$IndexPath  = Join-Path $RepoRoot 'docs/INDICE-GERAL.md'
$Failures = New-Object System.Collections.Generic.List[string]

function Add-Failure([string]$m) { $Failures.Add($m) | Out-Null; Write-Host "[FAIL] $m" -ForegroundColor Red }
function Write-Ok([string]$m)     { Write-Host "[OK] $m" -ForegroundColor Green }

$index = Get-Content -Raw -LiteralPath $IndexPath

# Arquivos que devem constar no indice, por area.
$patterns = @(
    @{ Label = 'core';      Path = 'core';      Include = @('*.md') },
    @{ Label = 'docs';      Path = 'docs';      Include = @('*.md') },
    @{ Label = 'guias';     Path = 'guias';     Include = @('*.md') },
    @{ Label = 'templates'; Path = 'templates'; Include = @('*.md') }
)

$missing = @()
foreach ($p in $patterns) {
    $dir = Join-Path $RepoRoot $p.Path
    Get-ChildItem -Path $dir -Recurse -File -Include $p.Include |
        Where-Object { $_.Name -ne 'INDICE-GERAL.md' } |
        ForEach-Object {
            if ($index -notmatch [regex]::Escape($_.Name)) {
                $missing += "$($p.Label): $($_.Name)"
            }
        }
}

# Scripts executaveis principais (ignora suites de teste, que sao detalhe interno).
Get-ChildItem -Path (Join-Path $RepoRoot 'scripts') -Recurse -File -Include '*.ps1','*.sh','*.cmd' |
    Where-Object { $_.DirectoryName -notmatch '\\tests$' } |
    ForEach-Object {
        if ($index -notmatch [regex]::Escape($_.Name)) {
            $missing += "scripts: $($_.Name)"
        }
    }

if ($missing.Count -gt 0) {
    $missing | Sort-Object -Unique | ForEach-Object { Add-Failure "Fora do INDICE-GERAL.md: $_" }
} else {
    Write-Ok 'Indice geral completo'
}

Write-Host ""
if ($Failures.Count -gt 0) {
    Write-Host "Index validation failed with $($Failures.Count) issue(s)." -ForegroundColor Red
    exit 1
}
Write-Host 'Index validation OK' -ForegroundColor Green
exit 0
