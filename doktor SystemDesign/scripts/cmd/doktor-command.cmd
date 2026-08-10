@echo off
setlocal EnableDelayedExpansion
rem ============================================================================
rem  doktor-command.cmd - comando "doktor" para CMD.
rem  Sincroniza uma copia do Doktor System-Design na pasta atual.
rem ============================================================================

for /f %%E in ('echo prompt $E ^| cmd') do set "ESC=%%E"
set "C_INFO=%ESC%[1;36m"
set "C_OK=%ESC%[1;32m"
set "C_ERR=%ESC%[1;31m"
set "C_RESET=%ESC%[0m"

set "REPO_URL=https://github.com/AndreGustavoms/Doktor-SystemDesign.git"
set "DEST_NAME=doktor SystemDesign"

if /I "%~1"=="-h" goto :help
if /I "%~1"=="--help" goto :help
if /I "%~1"=="--ensure-gitignore" goto :ensure_gitignore_entry

where git >nul 2>nul
if errorlevel 1 (
  echo %C_ERR%[doktor X]%C_RESET% git nao encontrado no PATH. Instale o Git e tente novamente.
  exit /b 1
)

set "TMP_DIR=%TEMP%\doktor-%RANDOM%%RANDOM%"
set "REPO_TMP=%TMP_DIR%\repo"
mkdir "%TMP_DIR%" 2>nul

echo %C_INFO%[doktor]%C_RESET% Clonando %REPO_URL%
git clone --depth 1 --quiet "%REPO_URL%" "%REPO_TMP%"
if errorlevel 1 (
  echo %C_ERR%[doktor X]%C_RESET% Falha ao clonar. Verifique a conexao e o acesso ao repositorio.
  rmdir /s /q "%TMP_DIR%" 2>nul
  exit /b 1
)

set "SHA="
for /f %%S in ('git -C "%REPO_TMP%" rev-parse --short HEAD 2^>nul') do set "SHA=%%S"
if not defined SHA set "SHA=?"

if exist "%REPO_TMP%\.git" rmdir /s /q "%REPO_TMP%\.git"
if not exist "%DEST_NAME%" mkdir "%DEST_NAME%"

robocopy "%REPO_TMP%" "%DEST_NAME%" /MIR /NFL /NDL /NJH /NJS /NP >nul
set RC=%ERRORLEVEL%

rmdir /s /q "%TMP_DIR%" 2>nul

if %RC% GEQ 8 (
  echo %C_ERR%[doktor X]%C_RESET% Falha ao copiar os arquivos.
  exit /b 1
)
if %RC% EQU 0 (
  echo %C_OK%[doktor OK]%C_RESET% Ja estava atualizado em %SHA%.
) else (
  echo %C_OK%[doktor OK]%C_RESET% Atualizado para %SHA%.
)

rem --- se estiver dentro de um repositorio git, garante a pasta no .gitignore ---
call :ensure_gitignore

echo %C_OK%[doktor OK]%C_RESET% Concluido em .\%DEST_NAME%
exit /b 0

:help
echo Uso: doktor
echo Sincroniza o Doktor System-Design em ".\%DEST_NAME%".
exit /b 0

:ensure_gitignore_entry
rem ============================================================================
rem  Entrada interna (nao documentada ao usuario) para os testes automatizados.
rem  Executa SOMENTE o passo do .gitignore, sem clonar nada, no repositorio git
rem  do diretorio atual. Uso:
rem     doktor-command.cmd --ensure-gitignore ["<NOME_DA_PASTA>"]
rem  O segundo argumento (opcional) sobrescreve o nome da pasta de destino, para
rem  os testes exercitarem nomes acentuados/variados.
rem ============================================================================
if not "%~2"=="" set "DEST_NAME=%~2"
call :ensure_gitignore
exit /b 0

:ensure_gitignore
rem ============================================================================
rem  Garante que "<DEST_NAME>/" apareca UMA UNICA VEZ no .gitignore da raiz do
rem  repositorio git atual (se houver). Fora de um repositorio git, nao faz nada.
rem
rem  Por que delegar ao PowerShell: sob UTF-8 (chcp 65001) o findstr do CMD nao
rem  casa nomes ACENTUADOS -- o .gitignore e gravado em UTF-8 (ex.: "a" com til =
rem  bytes C3 A3), mas o findstr procura em OEM, entao nunca encontra a linha e a
rem  entrada seria DUPLICADA a cada execucao. Alem disso, e preciso garantir a
rem  quebra de linha final, para nao colar a entrada na linha anterior e fazer o
rem  git NAO ignorar a pasta. O PowerShell compara (case-sensitive, linha exata)
rem  e grava em UTF-8 SEM BOM, de forma idempotente e preservando o conteudo.
rem ============================================================================
git rev-parse --is-inside-work-tree >nul 2>nul
if errorlevel 1 goto :eof
set "GIT_ROOT="
for /f "delims=" %%R in ('git rev-parse --show-toplevel 2^>nul') do set "GIT_ROOT=%%R"
if not defined GIT_ROOT goto :eof
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $f=Join-Path $env:GIT_ROOT '.gitignore'; $e=$env:DEST_NAME+'/'; $u=New-Object System.Text.UTF8Encoding($false); $exists=Test-Path -LiteralPath $f; $lines=if($exists){[System.IO.File]::ReadAllLines($f,$u)}else{@()}; if($lines -ccontains $e){exit 0}; $cur=if($exists){[System.IO.File]::ReadAllText($f,$u)}else{''}; if($cur.Length -gt 0 -and $cur[-1] -ne \"`n\"){$cur+=\"`r`n\"}; [System.IO.File]::WriteAllText($f,$cur+$e+\"`r`n\",$u); exit 10"
if errorlevel 10 echo %C_OK%[doktor OK]%C_RESET% Pasta adicionada ao .gitignore do repositorio: %DEST_NAME%/
goto :eof
