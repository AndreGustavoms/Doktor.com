<#
.SYNOPSIS
  Testes automatizados dos INSTALADORES do comando "doktor" (PowerShell, CMD e Bash).

.DESCRIPTION
  Cobre, sem tocar no ambiente real do usuario (perfil, PATH e registro sao
  redirecionados por variaveis de ambiente proprias para teste):

    PowerShell (install-doktor-powershell.ps1):
      1. Instalar cria o bloco com a funcao "doktor" no $PROFILE (DOKTOR_PROFILE).
      2. Reinstalar e idempotente: o bloco aparece UMA unica vez.
      3. Desinstalar remove o bloco e preserva o restante do perfil.

    CMD (install-doktor-cmd.cmd):
      4. Instala doktor.cmd em %LOCALAPPDATA%\doktor e adiciona ao PATH (registro de teste).
      5. Reinstalar e idempotente: a pasta aparece UMA unica vez no PATH.
      6. Desinstalar remove doktor.cmd e tira a pasta do PATH.

    Bash (install-doktor-bash-zsh.sh) - pulado se nao houver bash no PATH:
      7. Instala/atualiza/desinstala o bloco no .bashrc de um HOME temporario.

  Nao depende de Pester nem de rede. Requer powershell e cmd (Windows); git e
  bash sao opcionais (casos que dependem deles sao pulados com aviso).

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File .\installers.tests.ps1
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$here       = Split-Path -Parent $MyInvocation.MyCommand.Path
$scriptsDir = Split-Path -Parent $here
$psInstaller  = Join-Path $scriptsDir 'powershell\install-doktor-powershell.ps1'
$cmdInstaller = Join-Path $scriptsDir 'cmd\install-doktor-cmd.cmd'
$cmdCommand   = Join-Path $scriptsDir 'cmd\doktor-command.cmd'
$shInstaller  = Join-Path $scriptsDir 'bash-zsh\install-doktor-bash-zsh.sh'

foreach ($f in @($psInstaller, $cmdInstaller, $cmdCommand, $shInstaller)) {
    if (-not (Test-Path -LiteralPath $f)) { throw "Arquivo sob teste nao encontrado: $f" }
}

$BlockBegin = '# >>> doktor command (managed by install-doktor.ps1) >>>'

# --- infra minima de teste (sem dependencias) --------------------------------
$script:Pass = 0
$script:Fail = 0
$script:Skip = 0

function Assert([string]$name, [bool]$cond, [string]$detail = '') {
    if ($cond) {
        $script:Pass++
        Write-Host "  [PASS] $name" -ForegroundColor Green
    } else {
        $script:Fail++
        Write-Host "  [FAIL] $name" -ForegroundColor Red
        if ($detail) { Write-Host "         $detail" -ForegroundColor DarkYellow }
    }
}

function Skip-Case([string]$title, [string]$reason) {
    $script:Skip++
    Write-Host ""
    Write-Host "== $title ==" -ForegroundColor Cyan
    Write-Host "  [SKIP] $reason" -ForegroundColor DarkGray
}

function New-TempDir {
    $root = Join-Path ([System.IO.Path]::GetTempPath()) ('doktor-inst-tests-' + [System.IO.Path]::GetRandomFileName())
    New-Item -ItemType Directory -Force -Path $root | Out-Null
    $root
}

function Test-Case([string]$title, [scriptblock]$body) {
    Write-Host ""
    Write-Host "== $title ==" -ForegroundColor Cyan
    $dir = New-TempDir
    try { & $body $dir }
    catch { $script:Fail++; Write-Host "  [ERRO] $($_.Exception.Message)" -ForegroundColor Red }
    finally { Remove-Item -LiteralPath $dir -Recurse -Force -ErrorAction SilentlyContinue }
}

$hasGit  = [bool](Get-Command git  -ErrorAction SilentlyContinue)
$hasCurl = [bool](Get-Command curl.exe -ErrorAction SilentlyContinue)

# Bash do GIT (o "bash" do PATH pode ser o do WSL, que nao serve para testar
# um HOME temporario do Windows). Procura ao lado do git.exe instalado.
$gitBash = $null
if ($hasGit) {
    $gitExe = (Get-Command git).Source
    foreach ($cand in @(
        (Join-Path (Split-Path -Parent (Split-Path -Parent $gitExe)) 'bin\bash.exe'),
        "$env:ProgramFiles\Git\bin\bash.exe"
    )) {
        if ($cand -and (Test-Path -LiteralPath $cand)) { $gitBash = $cand; break }
    }
}

# O instalador exige rsync (dependencia real do comando "doktor"); o Git Bash
# do Windows nao inclui rsync por padrao (ver docs/VALIDACAO-SCRIPTS.md).
$bashHasRsync = $false
if ($gitBash) {
    & cmd.exe /c "`"$gitBash`" -lc `"command -v rsync`"" *> $null
    $bashHasRsync = ($LASTEXITCODE -eq 0)
}

# =============================================================================
#  PowerShell installer
# =============================================================================

function Invoke-PsInstaller([string]$profileFile, [switch]$Uninstall) {
    $old = $env:DOKTOR_PROFILE
    $env:DOKTOR_PROFILE = $profileFile
    $env:DOKTOR_NO_PAUSE = '1'
    try {
        $args = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $psInstaller)
        if ($Uninstall) { $args += '-Uninstall' }
        & powershell @args *> $null
        return $LASTEXITCODE
    } finally {
        $env:DOKTOR_PROFILE = $old
    }
}

function Get-BlockCount([string]$file) {
    if (-not (Test-Path -LiteralPath $file)) { return 0 }
    @((Get-Content -LiteralPath $file) | Where-Object { $_ -eq $BlockBegin }).Count
}

if ($hasGit) {
    Test-Case 'PS 1. Instalar cria o bloco da funcao "doktor" no perfil' {
        param($dir)
        $prof = Join-Path $dir 'profile.ps1'
        $rc = Invoke-PsInstaller $prof
        Assert 'instalador saiu com codigo 0' ($rc -eq 0) "codigo=$rc"
        Assert 'perfil foi criado' (Test-Path -LiteralPath $prof)
        Assert 'bloco presente no perfil' ((Get-BlockCount $prof) -eq 1)
        Assert 'funcao doktor definida no bloco' ((Get-Content -LiteralPath $prof -Raw) -match 'function doktor')
    }

    Test-Case 'PS 2. Reinstalar e idempotente (bloco aparece 1x)' {
        param($dir)
        $prof = Join-Path $dir 'profile.ps1'
        Invoke-PsInstaller $prof | Out-Null
        Invoke-PsInstaller $prof | Out-Null
        $n = Get-BlockCount $prof
        Assert 'bloco aparece exatamente 1x apos 2 instalacoes' ($n -eq 1) "apareceu $n vez(es)"
    }

    Test-Case 'PS 3. Desinstalar remove o bloco e preserva o resto do perfil' {
        param($dir)
        $prof = Join-Path $dir 'profile.ps1'
        Set-Content -LiteralPath $prof -Value '# minha config pessoal'
        Invoke-PsInstaller $prof | Out-Null
        $rc = Invoke-PsInstaller $prof -Uninstall
        Assert 'desinstalador saiu com codigo 0' ($rc -eq 0) "codigo=$rc"
        Assert 'bloco removido' ((Get-BlockCount $prof) -eq 0)
        Assert 'conteudo pessoal preservado' ((Get-Content -LiteralPath $prof -Raw) -match 'minha config pessoal')
    }
} else {
    Skip-Case 'PS 1-3. Instalador PowerShell' 'git nao esta no PATH (o instalador exige git).'
}

# =============================================================================
#  CMD installer  (registro e LOCALAPPDATA redirecionados para area de teste)
# =============================================================================

$regBase = 'HKCU:\Software\DoktorInstallTests\' + [System.IO.Path]::GetRandomFileName()

function Invoke-CmdInstaller([string]$installer, [string]$localAppData, [string]$regPath, [string]$flag = '') {
    $saved = @{}
    foreach ($n in 'LOCALAPPDATA', 'DOKTOR_PATH_REG', 'DOKTOR_NO_PAUSE') { $saved[$n] = [Environment]::GetEnvironmentVariable($n) }
    try {
        $env:LOCALAPPDATA    = $localAppData
        $env:DOKTOR_PATH_REG = $regPath
        $env:DOKTOR_NO_PAUSE = '1'
        & cmd.exe /c "`"$installer`" $flag" *> $null
        return $LASTEXITCODE
    } finally {
        foreach ($n in $saved.Keys) { [Environment]::SetEnvironmentVariable($n, $saved[$n]) }
    }
}

function Get-TestPathValue([string]$regPath) {
    if (-not (Test-Path -LiteralPath $regPath)) { return $null }
    $key = Get-Item -LiteralPath $regPath
    if ($key.GetValueNames() -notcontains 'Path') { return $null }
    [string]$key.GetValue('Path', '', [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames)
}

Test-Case 'CMD 4. Instala doktor.cmd e adiciona a pasta ao PATH' {
    param($dir)
    $reg = "$regBase\t4"
    $rc = Invoke-CmdInstaller $cmdInstaller $dir $reg
    Assert 'instalador saiu com codigo 0' ($rc -eq 0) "codigo=$rc"
    Assert 'doktor.cmd instalado' (Test-Path -LiteralPath (Join-Path $dir 'doktor\doktor.cmd'))
    $path = Get-TestPathValue $reg
    Assert 'pasta no PATH do usuario (registro)' ($path -like "*$dir\doktor*") "Path=$path"
}

Test-Case 'CMD 5. Reinstalar e idempotente (pasta aparece 1x no PATH)' {
    param($dir)
    $reg = "$regBase\t5"
    Invoke-CmdInstaller $cmdInstaller $dir $reg | Out-Null
    Invoke-CmdInstaller $cmdInstaller $dir $reg | Out-Null
    $path = Get-TestPathValue $reg
    $target = Join-Path $dir 'doktor'
    $n = @(($path -split ';') | Where-Object { $_ -eq $target }).Count
    Assert 'pasta aparece exatamente 1x no PATH' ($n -eq 1) "apareceu $n vez(es); Path=$path"
}

Test-Case 'CMD 6. Desinstalar remove doktor.cmd e tira a pasta do PATH' {
    param($dir)
    $reg = "$regBase\t6"
    Invoke-CmdInstaller $cmdInstaller $dir $reg | Out-Null
    $rc = Invoke-CmdInstaller $cmdInstaller $dir $reg '--uninstall'
    Assert 'desinstalador saiu com codigo 0' ($rc -eq 0) "codigo=$rc"
    Assert 'doktor.cmd removido' (-not (Test-Path -LiteralPath (Join-Path $dir 'doktor\doktor.cmd')))
    $path = Get-TestPathValue $reg
    $target = Join-Path $dir 'doktor'
    Assert 'pasta fora do PATH' (-not (@(($path -split ';') | Where-Object { $_ -eq $target }).Count)) "Path=$path"
}

# =============================================================================
#  Bash installer (via Git Bash, se disponivel)
# =============================================================================

if ($gitBash -and $hasGit -and $bashHasRsync) {
    Test-Case 'BASH 7. Instala, atualiza e desinstala o bloco no .bashrc' {
        param($dir)
        $bashrc = Join-Path $dir '.bashrc'
        Set-Content -LiteralPath $bashrc -Value '# minha config pessoal' -Encoding Ascii
        $saved = @{ HOME = $env:HOME; SHELL = $env:SHELL }
        try {
            $env:HOME = $dir; $env:SHELL = 'bash'
            & cmd.exe /c "`"$gitBash`" `"$shInstaller`" < NUL > NUL 2>&1"
            $rc1 = $LASTEXITCODE
            & cmd.exe /c "`"$gitBash`" `"$shInstaller`" < NUL > NUL 2>&1"
            $raw = Get-Content -LiteralPath $bashrc -Raw
            $n = @((Get-Content -LiteralPath $bashrc) | Where-Object { $_ -like '# >>> doktor command*' }).Count
            Assert 'instalador saiu com codigo 0' ($rc1 -eq 0) "codigo=$rc1"
            Assert 'funcao doktor no .bashrc' ($raw -match 'doktor\(\)')
            Assert 'bloco aparece 1x apos 2 instalacoes' ($n -eq 1) "apareceu $n vez(es)"
            & cmd.exe /c "`"$gitBash`" `"$shInstaller`" --uninstall < NUL > NUL 2>&1"
            $raw = Get-Content -LiteralPath $bashrc -Raw
            Assert 'bloco removido no uninstall' ($raw -notmatch 'doktor\(\)')
            Assert 'config pessoal preservada' ($raw -match 'minha config pessoal')
        } finally {
            $env:HOME = $saved.HOME; $env:SHELL = $saved.SHELL
        }
    }
} else {
    Skip-Case 'BASH 7. Instalador Bash/Zsh' 'bash, git e/ou rsync nao estao disponiveis (o Git Bash do Windows nao inclui rsync por padrao - ver docs/VALIDACAO-SCRIPTS.md).'
}

# --- limpeza do registro de teste --------------------------------------------
Remove-Item -Path 'HKCU:\Software\DoktorInstallTests' -Recurse -Force -ErrorAction SilentlyContinue

# ---------------------------------------------------------------------------
Write-Host ""
$color = 'Green'; if ($script:Fail -gt 0) { $color = 'Red' }
Write-Host ("Resultado: {0} passou, {1} falhou, {2} pulado(s)." -f $script:Pass, $script:Fail, $script:Skip) -ForegroundColor $color
if ($script:Fail -gt 0) { exit 1 } else { exit 0 }
