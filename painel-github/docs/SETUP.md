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
| Contents | Leitura e escrita | Ler arquivos, commitar, criar branches (Fase 4) |
| Issues | Leitura e escrita | Inbox de issues (Fase 5) |
| Pull requests | Leitura e escrita | Listar e comentar PRs (Fase 5) |
| Actions | Leitura | Status de workflows (Fase 3) |
| Administration | Leitura e escrita | Só se for editar descrição, topics ou visibilidade pela UI (Fase 4) — se não for, omita |

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

O endpoint `GET /api/repos` (Fase 2) foi validado ao vivo contra o
servidor real (`next start`) cobrindo: Host check (421), sessão ausente
(401), origem cross-site (403), vault bloqueado (423), e uma chamada
real ao GitHub com token inválido retornando erro sanitizado (502, sem
vazar detalhe da resposta do GitHub — confirmado no log). **O que não
foi validado nesta sessão de desenvolvimento**, por não haver um
fine-grained PAT real disponível no ambiente: a listagem de repositórios
de verdade, o comportamento de cache (`fromCache: true` no segundo
load), e a revalidação via ETag/304 contra `api.github.com`.

Para validar manualmente: rode o setup com um token real, chame
`GET /api/repos` duas vezes seguidas e confirme que a segunda resposta
tem `"fromCache": true` — a query interna correspondente em
`data/app.db` (tabela `api_cache`) deve mostrar `etag` preenchido.
