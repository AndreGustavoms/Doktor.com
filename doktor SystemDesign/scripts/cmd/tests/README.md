# Testes automatizados - `.gitignore` automatico (CMD/Windows)

Testa o passo que adiciona a pasta baixada ao `.gitignore` da raiz do repositorio,
implementado na sub-rotina `:ensure_gitignore` de `../doktor-command.cmd`.

## Por que estes testes existem

No Windows/CMD o passo do `.gitignore` e propenso a um bug conhecido nesse tipo de
script:

1. **`findstr` nao casa nomes acentuados sob `chcp 65001`.** O `.gitignore` e gravado
   em UTF-8 (nomes de pasta podem ter acento - `a` com til = bytes `C3 A3`), mas o
   `findstr` procura em OEM e nunca encontra a linha -> a entrada seria **duplicada**
   a cada execucao.
2. **Falta garantir a quebra de linha final**, entao a entrada pode **colar** na
   ultima linha do `.gitignore`, fazendo o git **nao** ignorar a pasta.

As variantes **bash** (`grep -qxF`) e **PowerShell** (`-cnotcontains`) nao tem esse
problema; so a do CMD precisa de cuidado extra. A solucao delega a
verificacao/gravacao ao PowerShell (UTF-8 sem BOM, idempotente).

## Como rodar

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\ensure-gitignore.tests.ps1
```

Sai com codigo `0` se tudo passar, `1` se algo falhar. Requer apenas `git` e
`powershell` no PATH (sem Pester, sem rede).

## Casos cobertos

| # | Cenario | Espera-se |
|---|---------|-----------|
| 1 | Fora de um repositorio git | nao cria `.gitignore` |
| 2 | Repo sem `.gitignore` | cria com a entrada, UTF-8 **sem BOM** |
| 3 | Repo com `.gitignore` sem a entrada | anexa preservando o conteudo |
| 4 | `.gitignore` sem quebra de linha final | nao cola na linha anterior |
| 5 | Rodar 2x (idempotencia) | entrada aparece **uma** vez (regressao do `findstr`) |
| 6 | Nome acentuado | `git check-ignore` confirma que a pasta e ignorada |
| 7 | Rodando de um subdiretorio | escreve no `.gitignore` da **raiz** do repo |

Os testes usam a entrada interna `doktor-command.cmd --ensure-gitignore "<nome>"`,
que executa **apenas** o passo do `.gitignore` (sem clonar nada).
