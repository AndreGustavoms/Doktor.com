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
