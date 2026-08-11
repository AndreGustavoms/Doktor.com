# Arquitetura

## Localização do repositório

Este projeto vive em `Doktor.com/painel-github/` — um subdiretório do
repositório `Doktor.com`, não um repositório Git próprio. Os commits das
Fases 0-3 foram construídos originalmente num repositório isolado
(`Dev/painel-github`) e trazidos para cá via `git filter-repo` (moveu
todo o histórico para a subpasta) + `git merge --allow-unrelated-histories`,
preservando os 4 commits de fase individualmente em vez de virarem um
squash. O `Dev/painel-github` original permanece intacto no disco como
cópia de referência, mas não é mais o lugar onde o desenvolvimento
continua.

**Efeito colateral real:** o `lefthook.yml` só é lido pelo lefthook
quando está na raiz do repositório Git (agora `Doktor.com/`, não
`painel-github/`). O `Doktor.com/lefthook.yml` usa `extends:` para
importar `painel-github/lefthook.yml`; cada `command` nesse arquivo
usa `root: "painel-github/"` para rodar no diretório certo. `lefthook`
também precisou ser instalado globalmente (`npm install -g lefthook`)
porque os hooks do Git chamam o binário fora do contexto de
`node_modules/.bin` do npm — descoberto ao vivo quando um commit de
teste com um token fake passou batido silenciosamente (o hook falhava
com "Can't find lefthook in PATH" sem abortar o commit). Ver commit
"fix: corrige hooks do lefthook após mover painel-github para monorepo".

## Limitações conhecidas — Fase 3

- **Paginação de 100 repos no dashboard e na régua de sincronia:**
  `src/app/(authenticated)/page.tsx` e
  `src/app/api/stats/activity/route.ts` chamam `listRepos({ perPage:
  100 })` sem paginar além disso. Usuários com mais de 100 repositórios
  não veem os excedentes nos cards agregados nem conseguem fixar um
  repositório além da primeira página. Paginação completa de dashboard
  fica para a Fase 5.
- **Popover da régua de sincronia mostra só contagem, não mensagens de
  commit:** o prompt original (§8) pede que o hover num traço abra um
  popover com as mensagens de commit daquele dia. `SyncRuler.tsx`
  implementado nesta fase mostra só "N commits" — buscar e exibir as
  mensagens reais exigiria uma chamada sob demanda por dia+repo, escopo
  deixado para refinamento futuro.
- **Placeholder "Carregar imagens" para hotlink não implementado** — ver
  docs/SECURITY.md, ameaça A5.

## Limitações conhecidas — Fase 4

- **`workflow_dispatch` com inputs em JSON livre, não formulário
  gerado do YAML:** o prompt original (§7.5) pede "disparo de
  workflow_dispatch com os inputs declarados" — ou seja, ler o YAML do
  workflow (`.github/workflows/*.yml`), extrair a seção
  `on.workflow_dispatch.inputs`, e gerar um formulário com os campos
  certos (texto, boolean, choice). `ActionsPanel.tsx` implementado
  nesta fase pede um textarea de JSON livre em vez disso — cobre o
  caso de uso real (disparar sabendo os inputs esperados) sem a
  complexidade de parsear YAML e mapear tipos de input para campos de
  formulário. Buscar o conteúdo do workflow via `contents.ts` (já
  existente) e parsear YAML é o caminho se isso vier a ser necessário.
- **Escopo de "ação destrutiva" restrito a alternar visibilidade:** o
  prompt original lista "branch, force push, arquivar, apagar release"
  como exemplos de ações destrutivas, mas nenhuma dessas tem UI nesta
  fase — só existe a ação de escrita que o painel de fato implementa
  (alternar visibilidade) passando pela guarda. Se uma fase futura
  adicionar arquivar repositório ou forçar push, a mesma
  `requireDestructiveAllowed()` se aplica.

## Limitações conhecidas — Fase 5

- **Inbox unificada mistura issues e Pull Requests:** a API REST do
  GitHub retorna PRs no mesmo endpoint de issues (`GET
  /repos/{owner}/{repo}/issues`) — um PR é uma issue internamente, com
  um campo `pull_request` a mais. `src/server/github/issues.ts` já
  mapeia a resposta crua para `IssueDTO` antes de chegar em
  `inbox.ts`, então o campo que distinguiria PR de issue comum não
  sobrevive ao DTO. Uma inbox de PRs de verdade, separada, usando
  `octokit.pulls.list()`, fica para a Fase 6 do prompt original
  (`/prs` como página própria).
- **Rotação de token via CLI, não via UI web:** `scripts/rotate-token.ts`
  pede a senha mestra e o token novo por `stdin`, fora do processo HTTP
  do painel — decisão deliberada, não lacuna. Expor rotação de token
  como Route Handler exigiria confiar em CSRF/sessão para uma operação
  que já assume acesso físico à máquina (quem roda o script já tem
  acesso ao terminal); um script CLI elimina qualquer superfície de
  ataque web nesse fluxo específico. Ver comentário no topo do arquivo.
- **Export de dados não inclui o vault nem o token:** `exportLocalData()`
  (settings → Exportar dados) exporta só tabelas de dado pessoal
  (pinned, tags, notas, portfólio) — nunca `auth`, `sessions`, ou o
  conteúdo de `vault.enc`. Migrar o token para uma instalação nova é um
  fluxo separado (rodar o setup lá com o mesmo token).

## Regra de ouro

`src/server/**` nunca é importado por nada dentro de `src/components/**`
ou `src/hooks/**`. Isso não é uma convenção — é um erro de lint
(`no-restricted-imports` em [eslint.config.mjs](../eslint.config.mjs)) e a
fronteira que faz o pacote `server-only` funcionar de verdade: qualquer
tentativa de puxar `src/server/github/client.ts` (que segura o token
decifrado em memória) para um Client Component quebra o build antes de
chegar perto de vazar para o bundle.

```
src/server/**      → só importado por Route Handlers (src/app/api/**)
                      e Server Components (src/app/**/page.tsx sem "use client")
src/lib/**          → seguro para o client, nada sensível aqui
src/components/**   → nunca importa de src/server/**
src/hooks/**        → nunca importa de src/server/**
```

## Por que Next.js App Router

A fronteira server/client é explícita no framework — Server Components
por padrão, `"use client"` como opt-in explícito para interatividade.
Isso é tratado como vantagem de segurança (força a pergunta "este código
precisa rodar no browser?" a cada arquivo novo), não como conveniência de
DX.

## Fluxo de uma requisição que muda estado

1. **`src/middleware.ts`** (Edge runtime) — Host check (anti-DNS-rebinding)
   e primeira camada de verificação de origem (Sec-Fetch-Site/Origin).
   Roda antes de qualquer coisa, em toda rota.
2. **Route Handler** (`src/app/api/**/route.ts`, runtime Node) — dentro
   dele, nessa ordem: sessão válida (`requireSession`) → origem reforçada
   (`requireSameOrigin`, cobre o caso `X-Local-Client` que o middleware
   não resolve sozinho) → input validado com Zod.
3. **Camada GitHub** (`src/server/github/**`) — chama o Octokit com o
   token decifrado em memória, nunca em disco.
4. **DTO** (`src/server/github/dto.ts`) — resposta crua do Octokit nunca
   sai; todo campo é mapeado explicitamente via schema Zod (allowlist).
5. **Log** (`src/server/log.ts`) — método, caminho, status, duração.
   Nunca headers, nunca corpo.

Ver [docs/SECURITY.md](SECURITY.md) para o motivo de cada camada (mapeado
às ameaças A1–A10) e [docs/API.md](API.md) para o contrato de erro
uniforme.

## Estado em memória entre Route Handlers e páginas

**Regra:** todo módulo de servidor com estado mutável de module scope
(`let algumaCoisa = ...`) precisa ancorar esse estado em `globalThis`
via uma chave `Symbol.for(...)`, nunca numa variável solta no topo do
arquivo.

**Por quê:** Next.js compila Route Handlers (`app/api/**/route.ts`) e
Server Components de página (`app/**/page.tsx`) como entry points de
build separados. Cada um ganha sua própria cópia física de qualquer
módulo que importa — inclusive dentro do **mesmo processo Node, mesmo
`next start`, sem restart**. Uma variável `let` em module scope em
`src/server/vault/session-state.ts` ou `src/server/log.ts` seta um valor
que uma Route Handler enxerga, mas que um Server Component de página,
importando "o mesmo" módulo, não vê — porque não é o mesmo módulo em
memória, é uma cópia com sua própria closure.

**Como foi descoberto:** `POST /api/auth/unlock` chamava
`setUnlockedToken()` com sucesso (log confirmado), mas a página `/`
(Server Component) chamando `isUnlocked()` logo em seguida via `false` —
mesmo processo, sem restart, cookie de sessão válido confirmado por uma
rota de API diferente (`/api/auth/status`) na mesma janela de tempo.
Debugado com log temporário no componente, comparando os três valores
lado a lado. Ver
[vercel/next.js#65350](https://github.com/vercel/next.js/issues/65350).

**Onde isso já foi corrigido:** `src/server/vault/session-state.ts`
(token decifrado do vault) e `src/server/log.ts` (valor do token
registrado para redação) — os dois únicos módulos com estado mutável
até a Fase 1. Qualquer módulo futuro com o mesmo padrão (ex: cache de
rate limit ou circuit breaker do Octokit, Fase 2) precisa do mesmo
tratamento — copie o padrão `getState()` desses dois arquivos.

## Prerendering e páginas que decidem autenticação

**Regra:** toda página (`page.tsx`) cuja árvore de renderização depende
de `cookies()`, sessão, ou qualquer estado que mude depois do build
**precisa** de `export const dynamic = "force-dynamic"` explícito no
topo do arquivo — não confie em detecção automática do Next.

**Por quê:** verificado ao vivo que `src/app/page.tsx` (que lê
`cookies()` e decide entre renderizar o dashboard ou `redirect()`) foi
prerenderizada no build e servida do cache HTTP
(`x-nextjs-cache: HIT`, `Cache-Control: s-maxage=31536000`) em vez de
reavaliar a cada requisição. Isso significa que o resultado da
autenticação no momento do `next build` (tipicamente "não configurado")
ficaria congelado por até um ano, ignorando qualquer setup ou unlock
feito depois. `export const dynamic = "force-dynamic"` resolve —
confirmado via `curl -D -` mostrando `Cache-Control: private, no-cache,
no-store, max-age=0, must-revalidate` depois da correção.

**Onde isso já foi corrigido:** `src/app/(authenticated)/page.tsx`
(dashboard) e `src/app/(authenticated)/repos/[owner]/[name]/page.tsx`
(detalhe do repositório) — os dois Server Components que decidem
autenticação diretamente. `/setup` e `/unlock` são Client Components
puros (a lógica de auth roda via `fetch` para as rotas de API, não no
Server Component em si) — não precisam da mesma flag, mas qualquer
página futura em `src/app/**` que leia estado de sessão/auth diretamente
no Server Component precisa do mesmo tratamento.

## React Compiler (ativo por padrão via eslint-config-next@16)

O `eslint-config-next@16` já vem com as regras do React Compiler
habilitadas por padrão (`react-hooks/purity`,
`react-hooks/preserve-manual-memoization`), mesmo sem
`reactCompiler: true` declarado em `next.config.ts` — essas são regras
de **lint**, não o compiler em si rodando no build; ele analisa código
buscando padrões que quebrariam a otimização automática se o compiler
estivesse ativo. Duas descobertas reais durante a Fase 3:

- **Funções impuras no corpo de um componente são erro de lint**, não
  só warning. `Date.now()` chamado direto dentro de
  `src/app/(authenticated)/page.tsx` (para calcular "repositório parado
  há mais de 6 meses") falhou com `react-hooks/purity`. Correção:
  extrair para função pura de módulo, fora do componente, recebendo
  timestamp como parâmetro implícito via `Date.now()` chamado dentro da
  função (não no corpo de render) — ver `isStale()` no topo do arquivo.
  Isso vale mesmo em Server Components, onde a preocupação original
  (re-render inconsistente no client) não se aplica da mesma forma — o
  linter não distingue Server de Client Component nessa regra.
- **`useMemo` com optional chaining na lista de dependências
  (`data?.repos`) pode ser rejeitado** com "Existing memoization could
  not be preserved" — o compiler infere a dependência real de forma
  diferente da declarada explicitamente. Correção: extrair
  `data?.repos` para uma variável antes do `useMemo` e referenciar essa
  variável tanto no corpo quanto no array de dependências — ver
  `src/app/(authenticated)/repos/page.tsx`.

## Decisões registradas

- **Next.js 16.3.0, não 15.x:** o prompt original pedia "Next.js 15+".
  Next 15.5.23 (última da série 15) foi a escolha inicial, mas trouxe 2
  vulnerabilidades de severidade alta sem correção nessa série (`postcss`
  XSS/path-traversal e CVEs de `libvips` via `sharp`, ambas dependências
  transitivas do próprio `next`) — `npm run audit --audit-level=high`
  não passava. Migrado para 16.3.0 (a `latest` estável do registro) para
  eliminar as duas. Efeitos colaterais da migração, já resolvidos: `next
  lint` foi removido (trocado por `eslint .` direto no script `lint`);
  `eslint-config-next@16` exige import nativo de flat config
  (`eslint-config-next/core-web-vitals` e `/typescript`) em vez do shim
  `FlatCompat`/`@eslint/eslintrc` usado na 15.x.
- **SQLite em vez de Postgres/similar:** zero configuração, arquivo
  único, fácil de fazer backup (`scripts/backup.ts`). O painel é
  single-user e single-machine — não há caso para um banco cliente-servidor.
- **Vault cifrado em `data/vault.enc` em vez de `.env.local` em
  produção:** `.env.local` é aceito como fallback só documentado para
  desenvolvimento (com aviso vermelho persistente na UI quando ativo). O
  vault é o caminho padrão porque o token só existe decifrado em memória,
  nunca em disco.
- **Fontes via `next/font/google`:** faz self-hosting em build time — os
  arquivos são servidos por `/_next/static/media/`, nunca há requisição
  para `fonts.googleapis.com` em runtime. Compatível com o CSP
  `font-src 'self'` sem precisar baixar `.woff2` manualmente.
- **`middleware.ts` mantido em vez de migrar para `proxy.ts` (Next 16):**
  o build emite um warning de deprecation sugerindo `proxy.ts`, mas
  `proxy.ts` roda em **Node.js runtime**, não Edge — e isso não é
  configurável. Trocar significaria que o Host check (a defesa contra
  DNS rebinding, ameaça A3) deixaria de rodar na camada mais enxuta e
  isolada disponível, sem ganho nenhum em troca. A própria documentação
  do Next recomenda manter `middleware.ts` quando o Edge runtime importa,
  e promete instruções futuras de Edge para `proxy.ts` — reavaliar essa
  decisão só quando isso existir. Ver warning no output de
  `npm run build`; é esperado e intencionalmente ignorado.
