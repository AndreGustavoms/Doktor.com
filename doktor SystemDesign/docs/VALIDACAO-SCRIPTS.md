# Validacao dos Scripts

Este documento registra como validar os scripts do comando global `doktor` sem confundir teste de parser com instalacao real.

## Estado atual

Validacao completa realizada em Windows (Git Bash + PowerShell 5.1 + CMD), em 2026-06-23:

| Script | Validacao | Resultado |
|--------|-----------|-----------|
| `scripts/powershell/install-doktor-powershell.ps1` | Instalacao real, `doktor -Help`, `doktor` em pasta temp, desinstalacao, perfil limpo | OK |
| `scripts/cmd/install-doktor-cmd.cmd` | Instalacao real em `%LOCALAPPDATA%\doktor`, PATH atualizado, reinstalacao | OK |
| `scripts/cmd/doktor-command.cmd` | `doktor` em pasta temp (58 arquivos sincronizados), segunda rodada | OK |
| `scripts/bash-zsh/install-doktor-bash-zsh.sh` | `bash -n` (sintaxe), instalacao e desinstalacao com rsync fake no Git Bash (Windows) | OK |

**Notas:**

- PowerShell: `doktor` detecta "Ja estava atualizado" corretamente via comparacao MD5.
- CMD: `doktor` sempre aplica o sync (robocopy compara por timestamp, nao hash); idempotente em conteudo, mas nao exibe "ja atualizado". Comportamento documentado e esperado.
- Bash/Zsh: requer `rsync` instalado. Git Bash para Windows nao inclui `rsync` por padrao; instale via MSYS2 (`pacman -S rsync`) ou use no Linux/macOS/WSL onde `rsync` ja esta disponivel.
- `doktor-command.cmd` corrigido: removida exibicao de caminhos completos da pasta temporaria no output (flag `/FP` e secao de preview removidos; output usa exit code do robocopy).

## O que ainda pode ser validado em ambiente adicional

- Testar Bash/Zsh nativo no Linux, macOS ou WSL com `rsync` disponivel.
- Confirmar que `doktor` em Zsh detecta corretamente o `.zshrc`.

## Suite de testes automatizados dos instaladores

Alem da validacao manual acima, o repositorio tem testes automatizados que exercitam os
tres instaladores sem tocar no ambiente real do usuario (perfil, PATH e registro sao
redirecionados por variaveis de ambiente proprias para teste: `DOKTOR_PROFILE`,
`DOKTOR_NO_PAUSE`, `DOKTOR_PATH_REG`, `DOKTOR_REPO_URL`).

Rodar tudo de uma vez:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/tests/run-tests.ps1
```

Essa suite tambem roda na GitHub Actions (`.github/workflows/validate.yml`) em
push e pull request, junto do `validate-repo.ps1` - casos que dependem de
`rsync` (Bash) sao pulados no runner Windows sem falhar o CI.

Isso executa:

| Suite | O que cobre |
|-------|-------------|
| [`scripts/tests/installers.tests.ps1`](../scripts/tests/installers.tests.ps1) | Instalar/reinstalar/desinstalar nos tres terminais (PowerShell, CMD, Bash quando disponivel com `rsync`) |
| [`scripts/cmd/tests/ensure-gitignore.tests.ps1`](../scripts/cmd/tests/ensure-gitignore.tests.ps1) | Passo de `.gitignore` automatico do `doktor-command.cmd`: idempotencia, nomes acentuados, preservacao de conteudo existente |

No Linux/macOS/WSL, ha tambem uma suite bash nativa equivalente para o instalador Bash/Zsh:

```bash
bash scripts/bash-zsh/tests/installers.tests.sh
```

Casos que dependem de `rsync` (Bash) sao pulados com aviso quando a dependencia nao esta
disponivel no ambiente - o Git Bash do Windows nao inclui `rsync` por padrao (ver nota
acima); isso e esperado e nao indica falha do instalador.

## Validacao segura automatizada

Rode:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/validate-repo.ps1
```

Ou, se tiver PowerShell 7:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/validate-repo.ps1
```

Essa validacao cobre:

- ASCII em arquivos de texto;
- links Markdown relativos;
- imagens locais referenciadas em Markdown (capa, badges, `![]()` e `<img src>`);
- texto quebrado conhecido;
- roteador de guias do `AGENTS.md` (cobertura e palavras-chave, via `scripts/validate-router.ps1`);
- completude do `docs/INDICE-GERAL.md` (via `scripts/validate-index.ps1`);
- consistencia dos tipos de commit entre o hook e os docs (via `scripts/validate-commit-types.ps1`);
- parser do instalador PowerShell;
- help do comando CMD;
- presenca dos scripts esperados.

## Validacao do roteador de guias

O `AGENTS.md` e o roteador que diz a IA qual guia abrir por tarefa. Um guia fora do
roteador fica invisivel; palavras-chave repetidas entre guias fazem a IA abrir mais
de um "para conferir", gastando contexto. Este script garante as duas propriedades:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/validate-router.ps1
```

Ele ja roda dentro do `validate-repo.ps1`, mas pode ser chamado sozinho ao editar guias.

## Validacao do indice geral

O `docs/INDICE-GERAL.md` se descreve como indice completo do repositorio. Este
script garante que todo doc, guia, template e script principal esteja listado
la - impedindo que o indice dessincronize quando um arquivo novo e adicionado:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/validate-index.ps1
```

Ele tambem roda dentro do `validate-repo.ps1`.

## Validacao dos tipos de commit

O hook `scripts/hooks/commit-msg` e a fonte da verdade dos tipos de Conventional
Commits aceitos. Varios documentos repetem essa lista (guia minimo, CONTRIBUTING,
AGENTS, politica de versionamento); este script garante que nenhum divergiu do
hook - nem faltando um tipo aceito, nem citando um tipo rejeitado:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/validate-commit-types.ps1
```

Ele tambem roda dentro do `validate-repo.ps1`.

## Medicao de custo de contexto

Recalcula quanto contexto a leitura roteada economiza frente a ler o acervo inteiro
(alimenta o dado de `core/DESIGN_SYSTEM_ECONOMIA_IA.md`):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/measure-context.ps1
```

## Validacao manual recomendada

Use uma pasta temporaria fora de qualquer projeto importante:

```powershell
$tmp = Join-Path $env:TEMP ("doktor-real-test-" + [guid]::NewGuid())
New-Item -ItemType Directory -Force -Path $tmp | Out-Null
Set-Location $tmp
```

Depois teste o terminal desejado.

### PowerShell

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\caminho\Doktor-System-Design\scripts\powershell\install-doktor-powershell.ps1
```

Abra um novo terminal e rode:

```powershell
doktor -Help
doktor
```

### CMD

```cmd
C:\caminho\Doktor-System-Design\scripts\cmd\install-doktor-cmd.cmd
```

Abra um novo CMD e rode:

```cmd
doktor --help
doktor
```

### Bash/Zsh

```bash
sh /caminho/Doktor-System-Design/scripts/bash-zsh/install-doktor-bash-zsh.sh
```

Abra um novo terminal ou rode `source ~/.bashrc`/`source ~/.zshrc`, depois:

```bash
doktor --help
doktor
```

## Criterio de aceite

O teste real passa quando:

- o comando `doktor --help` ou `doktor -Help` responde;
- `doktor` cria ou atualiza somente a pasta destino;
- arquivos fora da pasta destino nao sao removidos;
- uma segunda execucao informa que ja estava atualizado ou nao aplica mudancas inesperadas.
