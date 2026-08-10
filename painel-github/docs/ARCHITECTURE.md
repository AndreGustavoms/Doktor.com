# Arquitetura

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

**Onde isso já foi corrigido:** `src/app/page.tsx`. `/setup` e
`/unlock` são Client Components puros (a lógica de auth roda via
`fetch` para as rotas de API, não no Server Component em si) — não
precisam da mesma flag, mas qualquer página futura em `src/app/**` que
leia estado de sessão/auth diretamente no Server Component precisa do
mesmo tratamento.

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
