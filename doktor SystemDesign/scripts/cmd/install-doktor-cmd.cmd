@echo off
setlocal EnableDelayedExpansion
rem ============================================================================
rem  install-doktor-cmd.cmd - registra o comando "doktor" no CMD.
rem
rem  >>> PARA QUAL TERMINAL <<<
rem    Shell:    CMD (Prompt de Comando classico)
rem    Sistemas: Windows
rem    Use os outros instaladores se o seu terminal for:
rem      - Bash ou Zsh (Linux, macOS, Git Bash, WSL) -> bash-zsh/install-doktor-bash-zsh.sh
rem      - PowerShell (qualquer SO)                  -> powershell/install-doktor-powershell.ps1
rem
rem  O que faz: copia doktor-command.cmd (ao lado deste arquivo) para
rem  %LOCALAPPDATA%\doktor como "doktor.cmd" e adiciona a pasta ao PATH do
rem  usuario. Depois, abra um novo terminal e use "doktor".
rem
rem  >>> O CMD USA DOIS ARQUIVOS <<<
rem    install-doktor-cmd.cmd (este) -> o INSTALADOR; voce roda uma vez.
rem    doktor-command.cmd            -> o COMANDO "doktor" em si, que este
rem                                     instalador copia para o PATH (como
rem                                     doktor.cmd). Voce nao roda direto.
rem    (No Bash/Zsh e PowerShell o instalador escreve a funcao dentro do arquivo
rem     de config, entao basta um arquivo. No CMD, um comando precisa ser um
rem     arquivo proprio no PATH -- por isso sao dois.)
rem
rem  Uso:
rem    install-doktor-cmd.cmd              instala
rem    install-doktor-cmd.cmd --uninstall  remove
rem
rem  Variaveis de ambiente (avancado/testes):
rem    DOKTOR_PATH_REG   chave de registro do PATH (padrao: HKCU:\Environment)
rem    DOKTOR_NO_PAUSE   se definida, nao pausa no final (modo automatizado)
rem ============================================================================

set "SRC=%~dp0doktor-command.cmd"
set "TARGET_DIR=%LOCALAPPDATA%\doktor"
set "TARGET=%TARGET_DIR%\doktor.cmd"
set "DOKTOR_TARGET_DIR=%TARGET_DIR%"

if /I "%~1"=="--uninstall" goto :uninstall
if /I "%~1"=="-u" goto :uninstall

if not exist "%SRC%" (
  echo [doktor-install X] Nao encontrei doktor-command.cmd ao lado deste instalador.
  set "RC=1" & goto :end
)

where git >nul 2>nul
if errorlevel 1 echo [doktor-install !] Aviso: git nao esta no PATH. Instale o Git antes de usar "doktor".

if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"
copy /y "%SRC%" "%TARGET%" >nul
if errorlevel 1 (
  echo [doktor-install X] Falha ao copiar doktor.cmd para %TARGET_DIR%.
  set "RC=1" & goto :end
)

rem --- adiciona ao PATH do usuario (via registro, preservando o tipo do valor) ---
rem  NAO usa "setx": o setx trunca o PATH em 1024 caracteres (podendo APAGAR
rem  entradas do usuario) e converte REG_EXPAND_SZ em REG_SZ (quebrando entradas
rem  com %VARIAVEIS%). O PowerShell le o valor bruto, anexa e regrava com o
rem  mesmo tipo, de forma idempotente.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $reg=$env:DOKTOR_PATH_REG; if(-not $reg){$reg='HKCU:\Environment'}; $dir=$env:DOKTOR_TARGET_DIR; if(-not (Test-Path -LiteralPath $reg)){New-Item -Path $reg -Force | Out-Null}; $key=Get-Item -LiteralPath $reg; $cur=[string]$key.GetValue('Path','',[Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames); $kind='ExpandString'; if($key.GetValueNames() -contains 'Path'){$kind=[string]$key.GetValueKind('Path')}; $parts=@($cur -split ';' | Where-Object { $_ -ne '' }); if($parts -contains $dir){ exit 0 }; $new=(@($parts)+$dir) -join ';'; Set-ItemProperty -Path $reg -Name 'Path' -Value $new -Type $kind; exit 10"
if errorlevel 10 (
  echo [doktor-install OK] Pasta adicionada ao PATH do usuario: %TARGET_DIR%
) else if errorlevel 1 (
  echo [doktor-install !] Nao consegui adicionar a pasta ao PATH automaticamente.
  echo [doktor-install !] Adicione manualmente "%TARGET_DIR%" ao PATH do usuario em:
  echo [doktor-install !]   Configuracoes ^> Sistema ^> Variaveis de Ambiente.
) else (
  echo [doktor-install] Pasta ja estava no PATH: %TARGET_DIR%
)

echo [doktor-install OK] Comando "doktor" instalado.
echo [doktor-install] Abra um NOVO terminal (o PATH so vale para novas janelas) e rode: doktor
echo [doktor-install]   doktor                  -^> sincroniza o Doktor System-Design
set "RC=0" & goto :end

:uninstall
if exist "%TARGET%" del /q "%TARGET%"
if exist "%TARGET_DIR%" rmdir "%TARGET_DIR%" 2>nul
rem --- remove a pasta do PATH do usuario (mesma tecnica do install) ---
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $reg=$env:DOKTOR_PATH_REG; if(-not $reg){$reg='HKCU:\Environment'}; $dir=$env:DOKTOR_TARGET_DIR; if(-not (Test-Path -LiteralPath $reg)){ exit 0 }; $key=Get-Item -LiteralPath $reg; if(-not ($key.GetValueNames() -contains 'Path')){ exit 0 }; $cur=[string]$key.GetValue('Path','',[Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames); $kind=[string]$key.GetValueKind('Path'); $parts=@($cur -split ';' | Where-Object { $_ -ne '' }); if(-not ($parts -contains $dir)){ exit 0 }; $new=@($parts | Where-Object { $_ -ne $dir }) -join ';'; Set-ItemProperty -Path $reg -Name 'Path' -Value $new -Type $kind; exit 10"
if errorlevel 10 (
  echo [doktor-install OK] Pasta removida do PATH do usuario.
) else if errorlevel 1 (
  echo [doktor-install !] Nao consegui remover a pasta do PATH automaticamente.
  echo [doktor-install !] Remova "%TARGET_DIR%" do PATH em Variaveis de Ambiente, se desejar.
)
echo [doktor-install OK] doktor.cmd removido de %TARGET_DIR%.
set "RC=0" & goto :end

:end
echo.
if "%RC%"=="0" (
  echo [doktor-install OK] Script finalizado com sucesso.
) else (
  echo [doktor-install X] Script finalizado com erro (codigo %RC%^).
)
if not defined DOKTOR_NO_PAUSE pause
exit /b %RC%
