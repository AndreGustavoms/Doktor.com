<#
.SYNOPSIS
  Mede o custo de contexto (tokens aprox.) do acervo Doktor System-Design.

.DESCRIPTION
  Compara dois cenarios de leitura:
    A) ler todos os .md do acervo "por garantia";
    B) leitura roteada: AGENTS.md + os documentos-alvo de uma tarefa tipica.
  Usa a aproximacao de ~4 caracteres por token. Serve para manter o dado do
  guia core/DESIGN_SYSTEM_ECONOMIA_IA.md calibrado conforme o acervo cresce.

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts/measure-context.ps1
#>
[CmdletBinding()]
param(
    [int]$CharsPerToken = 4
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')

function Get-Tokens([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path)) { return 0 }
    $chars = (Get-Content -Raw -LiteralPath $Path).Length
    return [int][math]::Floor($chars / $CharsPerToken)
}

# Cenario A: todo o acervo .md
$allMd = Get-ChildItem -Path $RepoRoot -Recurse -File -Include *.md -Force |
    Where-Object { $_.FullName -notmatch '\\.git\\' }
$totalAll = ($allMd | ForEach-Object { Get-Tokens $_.FullName } | Measure-Object -Sum).Sum

# Cenario B: leitura roteada de uma tarefa tipica
$routed = @(
    (Join-Path $RepoRoot 'AGENTS.md'),
    (Join-Path $RepoRoot 'core/GUIA_MINIMO_QUALIDADE.md'),
    (Join-Path $RepoRoot 'docs/STACK-E-ARQUITETURA.md')
)
$totalRouted = ($routed | ForEach-Object { Get-Tokens $_ } | Measure-Object -Sum).Sum

$economy = if ($totalAll -gt 0) { 100 * (1 - ($totalRouted / $totalAll)) } else { 0 }
$factor  = if ($totalRouted -gt 0) { $totalAll / $totalRouted } else { 0 }

Write-Host ""
Write-Host "Medicao de contexto - Doktor System-Design" -ForegroundColor Cyan
Write-Host ("-" * 50)
Write-Host ("Acervo completo   : {0,4} arquivos  ~{1,8:N0} tokens" -f $allMd.Count, $totalAll)
Write-Host ("Leitura roteada   : {0,4} arquivos  ~{1,8:N0} tokens" -f $routed.Count, $totalRouted)
Write-Host ("-" * 50)
Write-Host ("Economia por tarefa : ~{0:N1}%" -f $economy) -ForegroundColor Green
Write-Host ("Fator de reducao    : ~{0:N1}x menos contexto" -f $factor) -ForegroundColor Green
Write-Host ""
