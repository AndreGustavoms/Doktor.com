# Setup

## Pré-requisitos

- Node.js 20 LTS ou superior (testado com Node 24).
- [gitleaks](https://github.com/gitleaks/gitleaks) instalado e no PATH —
  necessário para os hooks do lefthook funcionarem (`winget install
  Gitleaks.Gitleaks` no Windows).
- Opcional: [mkcert](https://github.com/FiloSottile/mkcert) para HTTPS
  local (ver `dev:https` em `package.json`).

## Instalação

```bash
npm ci
npm run prepare   # instala os hooks do lefthook
npm run dev        # http://127.0.0.1:3000
```

Na primeira vez, o painel redireciona automaticamente para `/setup`.

## Criando o token do GitHub

Crie um [fine-grained personal access
token](https://github.com/settings/personal-access-tokens/new) com:

- **Repositórios:** selecionados manualmente (nunca "todos").
- **Validade:** 90 dias (o painel avisa antes de expirar — Fase 5,
  rotação de token).
- **Permissões exatas** (confirme na página de criação do GitHub — esses
  nomes e níveis podem mudar):

| Permissão | Nível | Necessária para |
|---|---|---|
| Metadata | Leitura | Obrigatória para qualquer fine-grained token |
| Contents | Leitura e escrita | Ler arquivos, commitar README (Fase 4) |
| Issues | Leitura e escrita | Criar/comentar/fechar issues (Fase 4); inbox unificada (Fase 5) |
| Pull requests | Leitura e escrita | Listar e comentar PRs (Fase 5) |
| Actions | Leitura e escrita | Ler status de workflows (Fase 3); disparar workflow_dispatch e re-executar (Fase 4) |
| Administration | Leitura e escrita | Editar descrição/topics (Fase 4) e alternar visibilidade — ação destrutiva, atrás de `ALLOW_DESTRUCTIVE` (Fase 4). Se você nunca for alternar visibilidade pela UI, ainda precisa desta permissão para editar descrição/topics/homepage. |

**Nota:** Actions passou de "Leitura" (Fase 3) para "Leitura e escrita"
nesta fase — se você criou o token antes da Fase 4, precisa editar as
permissões dele em github.com/settings/tokens para disparar workflows.

O wizard de `/setup` valida o token chamando `GET /user` antes de
prosseguir — se a validação falhar, revise as permissões acima.

**Evolução futura:** um **GitHub App** com token de instalação de vida
curta (expira em 1h, renovado automaticamente) é mais seguro que um PAT
de 90 dias parado no disco. Vale considerar se o painel for usado por
muito tempo — ver notas do prompt original.

## Wizard de setup (`/setup`)

Quatro passos: senha mestra (mínimo 12 caracteres, sem recuperação se
perdida) → token do GitHub → confirmação de escopo → verificação ao
vivo. Ao final, o painel decifra o token em memória e cria uma sessão —
ver `docs/SECURITY.md`, ameaças A1/A2/A8.

## Pendência conhecida: validação com token real

Todas as rotas foram validadas ao vivo contra o servidor real
(`next start`) para as camadas que não dependem de um token válido:
Host check (421), sessão ausente (401), origem cross-site (403), vault
bloqueado (423), path traversal rejeitado (400), guarda destrutiva sem
`ALLOW_DESTRUCTIVE` (403), nome de confirmação incorreto (400), e uma
chamada real ao GitHub com token inválido retornando erro sanitizado
(502, sem vazar detalhe da resposta do GitHub).

**O que não foi validado nesta sessão de desenvolvimento**, por não
haver um fine-grained PAT real disponível no ambiente:

- Fase 2: listagem de repositórios de verdade, `fromCache: true` no
  segundo load, revalidação via ETag/304.
- Fase 4: commit de README de verdade (incluindo o caso de conflito de
  SHA — 409), edição de descrição/topics persistindo no GitHub, criar
  issue/comentar/fechar contra um repo real, criar release de verdade,
  disparar `workflow_dispatch` contra um workflow real, e alternar
  visibilidade com `ALLOW_DESTRUCTIVE=true` de fato setado.

Para validar manualmente: rode o setup com um token real, defina
`ALLOW_DESTRUCTIVE=true` no `.env.local` temporariamente, e exercite
cada fluxo de escrita na UI de um repositório de teste descartável.
