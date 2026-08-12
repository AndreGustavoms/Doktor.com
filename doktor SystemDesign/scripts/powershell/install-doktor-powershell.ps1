<#
.SYNOPSIS
  Instalador do comando global "doktor" para PowerShell.

.DESCRIPTION
  Adiciona a funcao "doktor" ao perfil do PowerShell. O comando sincroniza uma
  copia do Doktor System-Design na pasta atual.

.PARAMETER Uninstall
  Remove a funcao "doktor" do perfil.

.NOTES
  Variaveis de ambiente para automacao/teste (nao usadas em uso normal):
    DOKTOR_PROFILE    sobrescreve o caminho do $PROFILE alvo
    DOKTOR_NO_PAUSE   se definida, nao pausa no final (modo automatizado)
#>
[CmdletBinding()]
param(
    [switch]$Uninstall
)

$ErrorActionPreference = 'Stop'

$RepoUrl = 'https://github.com/AndreGustavoms/Doktor-SystemDesign.git'
$DestName = 'doktor SystemDesign'
$BlockBegin = '# >>> doktor command (managed by install-doktor.ps1) >>>'
$BlockEnd = '# <<< doktor command (managed by install-doktor.ps1) <<<'

function Write-Info($message) { Write-Host "[doktor-install] $message" -ForegroundColor Cyan }
function Write-Ok($message) { Write-Host "[doktor-install OK] $message" -ForegroundColor Green }
function Write-Warn2($message) { Write-Host "[doktor-install !] $message" -ForegroundColor Yellow }
function Write-Err2($message) { Write-Host "[doktor-install X] $message" -ForegroundColor Red }

$DoktorBlock = @"
$BlockBegin
function doktor {
    [CmdletBinding()]
    param([switch]`$Help)

    `$repoUrl = '$RepoUrl'
    `$dest = Join-Path (Get-Location) '$DestName'

    if (`$Help) {
        Write-Host '[doktor] Uso: doktor'
        Write-Host "[doktor] Sincroniza o Doktor System-Design em: `$dest"
        return
    }

    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Host '[doktor X] git nao encontrado no PATH. Instale o Git e tente novamente.' -ForegroundColor Red
        return
    }

    `$tmpDir = Join-Path ([System.IO.Path]::GetTempPath()) ([System.IO.Path]::GetRandomFileName())
    `$repoTmp = Join-Path `$tmpDir 'repo'

    try {
        New-Item -ItemType Directory -Force -Path `$tmpDir | Out-Null
        Write-Host "[doktor] Clonando `$repoUrl" -ForegroundColor Cyan
        git clone --depth 1 --quiet `$repoUrl `$repoTmp
        if (`$LASTEXITCODE -ne 0) {
            Write-Host '[doktor X] Falha ao clonar. Verifique a conexao e o acesso ao repositorio.' -ForegroundColor Red
            return
        }

        `$sha = (git -C `$repoTmp rev-parse --short HEAD 2>`$null)
        if (-not `$sha) { `$sha = '?' }

        Remove-Item -Recurse -Force (Join-Path `$repoTmp '.git') -ErrorAction SilentlyContinue
        New-Item -ItemType Directory -Force -Path `$dest | Out-Null

        function _relmap(`$root) {
            `$map = @{}
            if (Test-Path `$root) {
                Get-ChildItem -Path `$root -Recurse -File -Force | ForEach-Object {
                    `$rel = `$_.FullName.Substring(`$root.Length).TrimStart('\','/')
                    `$map[`$rel] = (Get-FileHash -Path `$_.FullName -Algorithm MD5).Hash
                }
            }
            return `$map
        }

        `$srcMap = _relmap `$repoTmp
        `$dstMap = _relmap `$dest
        `$new = @(); `$updated = @(); `$deleted = @()
        foreach (`$key in `$srcMap.Keys) {
            if (-not `$dstMap.ContainsKey(`$key)) { `$new += `$key }
            elseif (`$dstMap[`$key] -ne `$srcMap[`$key]) { `$updated += `$key }
        }
        foreach (`$key in `$dstMap.Keys) {
            if (-not `$srcMap.ContainsKey(`$key)) { `$deleted += `$key }
        }

        if (Get-Command robocopy -ErrorAction SilentlyContinue) {
            `$null = robocopy `$repoTmp `$dest /MIR /NFL /NDL /NJH /NJS /NP
            if (`$LASTEXITCODE -ge 8) {
                Write-Host '[doktor X] Falha ao sincronizar arquivos com robocopy.' -ForegroundColor Red
                return
            }
        } else {
            Get-ChildItem -Path `$dest -Force | Remove-Item -Recurse -Force
            Copy-Item -Path (Join-Path `$repoTmp '*') -Destination `$dest -Recurse -Force
        }

        `$total = `$new.Count + `$updated.Count + `$deleted.Count
        if (`$total -eq 0) {
            Write-Host "[doktor OK] Ja estava atualizado em `$sha." -ForegroundColor Green
        } else {
            Write-Host "[doktor OK] Atualizado para `$sha. Mudancas aplicadas:" -ForegroundColor Green
            foreach (`$f in `$new) { Write-Host "  + `$f" -ForegroundColor Green }
            foreach (`$f in `$updated) { Write-Host "  ~ `$f" -ForegroundColor Yellow }
            foreach (`$f in `$deleted) { Write-Host "  - `$f" -ForegroundColor Red }
        }
        Write-Host "[doktor OK] Concluido em `$dest" -ForegroundColor Green
    }
    finally {
        if (Test-Path `$tmpDir) { Remove-Item -Recurse -Force `$tmpDir -ErrorAction SilentlyContinue }
    }
}
$BlockEnd
"@

function Get-ProfilePath {
    if ($env:DOKTOR_PROFILE) { return $env:DOKTOR_PROFILE }
    if ($PROFILE -and $PROFILE.CurrentUserAllHosts) { return $PROFILE.CurrentUserAllHosts }
    return $PROFILE
}

function Confirm-ExecutionPolicy {
    # No Windows, a ExecutionPolicy padrao (Restricted) impede o PowerShell de
    # carregar o $PROFILE -- o comando "doktor" ficaria instalado mas nunca
    # apareceria. Ajusta para RemoteSigned no escopo do usuario, se preciso.
    if ($env:OS -ne 'Windows_NT') { return }
    $effective = Get-ExecutionPolicy
    if ($effective -notin @('Restricted', 'AllSigned')) { return }
    try {
        Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force -ErrorAction Stop
        Write-Ok "ExecutionPolicy ajustada de '$effective' para 'RemoteSigned' (escopo do usuario) - sem isso o PowerShell nao carrega o `$PROFILE e o comando `"doktor`" nao funcionaria."
    }
    catch {
        Write-Warn2 "A ExecutionPolicy atual ('$effective') impede o PowerShell de carregar o `$PROFILE - o comando `"doktor`" NAO vai funcionar ate voce ajustar."
        Write-Warn2 'Rode em um PowerShell e depois abra um novo terminal:'
        Write-Warn2 '  Set-ExecutionPolicy -Scope CurrentUser RemoteSigned'
    }
}

function Remove-DoktorBlock([string]$Path) {
    if (-not (Test-Path $Path)) { return }
    $content = Get-Content -Path $Path -Raw
    $pattern = [regex]::Escape($BlockBegin) + '.*?' + [regex]::Escape($BlockEnd)
    $cleaned = [regex]::Replace($content, $pattern, '', 'Singleline')
    Set-Content -Path $Path -Value ($cleaned.TrimEnd() + "`r`n") -NoNewline
}

function Invoke-Install {
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Err2 'git nao encontrado no PATH. Instale o Git e rode novamente.'
        exit 1
    }

    Confirm-ExecutionPolicy
    $profilePath = Get-ProfilePath
    $profileDir = Split-Path -Parent $profilePath
    if ($profileDir -and -not (Test-Path $profileDir)) { New-Item -ItemType Directory -Force -Path $profileDir | Out-Null }
    if (-not (Test-Path $profilePath)) { New-Item -ItemType File -Force -Path $profilePath | Out-Null }

    $action = 'instalado'
    if ((Get-Content -Path $profilePath -Raw -ErrorAction SilentlyContinue) -match [regex]::Escape($BlockBegin)) {
        $action = 'atualizado'
        Remove-DoktorBlock $profilePath
    }

    Add-Content -Path $profilePath -Value ("`r`n" + $DoktorBlock)
    Write-Ok "Comando `"doktor`" $action em: $profilePath"
    Write-Info "Abra um novo terminal ou rode: . `"$profilePath`""
}

function Invoke-Uninstall {
    $profilePath = Get-ProfilePath
    if ((Test-Path $profilePath) -and ((Get-Content -Path $profilePath -Raw) -match [regex]::Escape($BlockBegin))) {
        Remove-DoktorBlock $profilePath
        Write-Ok "Comando `"doktor`" removido de: $profilePath"
    } else {
        Write-Warn2 "Nenhuma instalacao do comando `"doktor`" encontrada em: $profilePath"
    }
}

$exitCode = 0
try {
    if ($Uninstall) { Invoke-Uninstall } else { Invoke-Install }
}
catch {
    Write-Err2 "Erro inesperado: $($_.Exception.Message)"
    $exitCode = 1
}

Write-Host ''
if ($exitCode -eq 0) {
    Write-Ok 'Script finalizado com sucesso.'
} else {
    Write-Err2 "Script finalizado com erro (codigo $exitCode)."
}
# Quando rodado como ARQUIVO (clique duplo / .\script.ps1), pausa e sai com o
# codigo. Quando rodado via "irm ... | iex" nao ha arquivo ($PSCommandPath
# vazio) - nesse caso nao chama "exit", que fecharia o terminal do usuario.
$runAsFile = -not [string]::IsNullOrEmpty($PSCommandPath)
if ($runAsFile -and -not $env:DOKTOR_NO_PAUSE) {
    Read-Host 'Pressione Enter para sair' | Out-Null
}
if ($runAsFile) { exit $exitCode }
