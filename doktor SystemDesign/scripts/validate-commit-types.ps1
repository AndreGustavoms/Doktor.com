<#
.SYNOPSIS
  Valida a consistencia dos tipos de Conventional Commits entre o hook e os docs.

.DESCRIPTION
  O hook scripts/hooks/commit-msg e a fonte da verdade: define quais tipos de
  commit sao aceitos. Varios documentos repetem essa lista (guia minimo,
  CONTRIBUTING, AGENTS, politica de versionamento). Este script garante que:
    1. cada documento-chave lista exatamente os tipos que o hook aceita
       (sem faltar nenhum e sem citar tipo que o hook rejeita);
    2. nenhum documento divergiu silenciosamente do hook.
  Impede o drift que ja ocorreu (o guia minimo listava 5 dos 7 tipos).

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts/validate-commit-types.ps1
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$Failures = New-Object System.Collections.Generic.List[string]

function Add-Failure([string]$m) { $Failures.Add($m) | Out-Null; Write-Host "[FAIL] $m" -ForegroundColor Red }
function Write-Ok([string]$m)     { Write-Host "[OK] $m" -ForegroundColor Green }

# 1. Fonte da verdade: extrai os tipos do regex do hook.
$hookPath = Join-Path $RepoRoot 'scripts/hooks/commit-msg'
$hookText = Get-Content -Raw -LiteralPath $hookPath
$m = [regex]::Match($hookText, "pattern='\^\(([^)]+)\)")
if (-not $m.Success) {
    Add-Failure "Nao encontrei o padrao de tipos no hook (scripts/hooks/commit-msg)"
    Write-Host ""; Write-Host "Commit-types validation failed." -ForegroundColor Red; exit 1
}
$hookTypes = $m.Groups[1].Value -split '\|' | ForEach-Object { $_.Trim() }
$hookSet = [System.Collections.Generic.HashSet[string]]::new([string[]]$hookTypes)
Write-Host "Tipos do hook (fonte da verdade): $($hookTypes -join ' ')" -ForegroundColor Cyan

# Documentos que devem listar a lista completa de tipos.
$docs = @(
    'core/GUIA_MINIMO_QUALIDADE.md',
    'CONTRIBUTING.md',
    'AGENTS.md',
    'docs/GIT-POLITICA-DE-VERSIONAMENTO.md'
)

foreach ($rel in $docs) {
    $path = Join-Path $RepoRoot $rel
    if (-not (Test-Path -LiteralPath $path)) { Add-Failure "Documento ausente: $rel"; continue }
    $text = Get-Content -Raw -LiteralPath $path

    # Tipos citados como `token` (crase), restrito ao vocabulario de tipos conhecido,
    # para nao capturar `feat` dentro de "feature" nem palavras comuns.
    $known = 'feat','fix','docs','style','refactor','test','chore','perf','build','ci','revert'
    $cited = [System.Collections.Generic.HashSet[string]]::new()
    foreach ($t in $known) {
        if ($text -match ('`' + [regex]::Escape($t) + '`')) { [void]$cited.Add($t) }
    }

    if ($cited.Count -eq 0) { continue }  # doc nao lista tipos - fora de escopo

    $missing = $hookTypes | Where-Object { -not $cited.Contains($_) }
    $extra   = $cited | Where-Object { -not $hookSet.Contains($_) }

    if ($missing) { Add-Failure "$rel nao cita tipo(s) aceito(s) pelo hook: $($missing -join ', ')" }
    if ($extra)   { Add-Failure "$rel cita tipo(s) que o hook rejeita: $($extra -join ', ')" }
    if (-not $missing -and -not $extra) { Write-Ok $rel }
}

Write-Host ""
if ($Failures.Count -gt 0) {
    Write-Host "Commit-types validation failed with $($Failures.Count) issue(s)." -ForegroundColor Red
    exit 1
}
Write-Host 'Commit-types validation OK' -ForegroundColor Green
exit 0
