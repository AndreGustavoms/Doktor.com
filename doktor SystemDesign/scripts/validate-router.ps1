<#
.SYNOPSIS
  Valida o roteador de guias do AGENTS.md.

.DESCRIPTION
  Garante duas propriedades que o guia de economia de contexto exige
  (core/DESIGN_SYSTEM_ECONOMIA_IA.md, secao 3.1):
    1. Cobertura: todo guia em guias/ esta indexado no AGENTS.md - guia fora
       do roteador e invisivel para a IA. E todo link de guia no roteador
       aponta para um arquivo que existe (sem link orfao).
    2. Sem colisao de palavra-chave: nenhuma palavra-chave da tabela de guias
       aparece em mais de um guia - colisao faz a IA abrir varios guias "para
       conferir qual serve", gastando contexto a toa.

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts/validate-router.ps1
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$RepoRoot  = Resolve-Path (Join-Path $PSScriptRoot '..')
$AgentsPath = Join-Path $RepoRoot 'AGENTS.md'
$Failures = New-Object System.Collections.Generic.List[string]

function Add-Failure([string]$m) { $Failures.Add($m) | Out-Null; Write-Host "[FAIL] $m" -ForegroundColor Red }
function Write-Ok([string]$m)     { Write-Host "[OK] $m" -ForegroundColor Green }

$agents = Get-Content -Raw -LiteralPath $AgentsPath

# Guias no disco (relativo, com barra normal)
$disk = Get-ChildItem -Path (Join-Path $RepoRoot 'guias') -Recurse -File -Include *.md |
    ForEach-Object { $_.FullName.Substring($RepoRoot.Path.Length + 1).Replace('\','/') }

# Guias citados no roteador
$routed = [regex]::Matches($agents, 'guias/[\w/-]+\.md') |
    ForEach-Object { $_.Value } | Select-Object -Unique

# 1. Cobertura
$missing = $disk | Where-Object { $routed -notcontains $_ }
$orphan  = $routed | Where-Object { $disk -notcontains $_ }

if ($missing) { $missing | ForEach-Object { Add-Failure "Guia fora do roteador (invisivel): $_" } }
if ($orphan)  { $orphan  | ForEach-Object { Add-Failure "Link orfao no roteador: $_" } }
if (-not $missing -and -not $orphan) { Write-Ok "Cobertura do roteador ($($disk.Count) guias)" }

# 2. Colisao de palavras-chave (tabela da secao 3: | [`guia`] | descricao | kw1, kw2 |)
$kwMap = @{}
foreach ($line in ($agents -split "`n")) {
    $m = [regex]::Match($line, '^\|\s*\[`(guias/[\w/-]+\.md)`\].*\|\s*.+?\s*\|\s*(.+?)\s*\|\s*$')
    if ($m.Success) {
        $guide = Split-Path $m.Groups[1].Value -Leaf
        foreach ($kw in ($m.Groups[2].Value -split ',')) {
            $key = $kw.Trim().ToLowerInvariant()
            if ($key) {
                if (-not $kwMap.ContainsKey($key)) { $kwMap[$key] = @() }
                $kwMap[$key] += $guide
            }
        }
    }
}
$collisions = $kwMap.GetEnumerator() | Where-Object { $_.Value.Count -gt 1 }
if ($collisions) {
    foreach ($c in $collisions) { Add-Failure ("Palavra-chave '{0}' colide entre: {1}" -f $c.Key, ($c.Value -join ', ')) }
} else {
    Write-Ok "Palavras-chave sem colisao"
}

Write-Host ""
if ($Failures.Count -gt 0) {
    Write-Host "Router validation failed with $($Failures.Count) issue(s)." -ForegroundColor Red
    exit 1
}
Write-Host 'Router validation OK' -ForegroundColor Green
exit 0
