# Modelo de ameaça e checklist de segurança

Este documento é a fonte da verdade sobre o que este painel defende, contra
o quê, e onde cada defesa está implementada. Atualize-o na mesma fase em
que o mecanismo correspondente for construído — checklist desatualizada é
pior que nenhuma checklist.

**Premissa central: "é localhost, então é seguro" é falsa.** Este documento
existe porque essa premissa é a raiz da maioria dos vazamentos em
ferramentas desse tipo. Todo controle abaixo assume que o painel está sob
ataque mesmo rodando em `127.0.0.1`.

---

## As dez ameaças

### A1 — Vazamento para o bundle do navegador
Um token que chega ao client é um token público. Devtools, extensões e
qualquer XSS o leem. Vetores: variável `NEXT_PUBLIC_*`, token como prop de
Client Component, objeto do Octokit serializado numa resposta de API,
resposta crua da API do GitHub repassada sem filtro.

- **Defesa:** token vive só no processo servidor (`GITHUB_TOKEN`, nunca
  prefixado); todo módulo que o toca começa com `import "server-only"`;
  DTOs de saída fazem allowlist campo a campo (nunca repassam objeto cru).
- **Mecanismo:** `src/server/**` (todo o diretório),
  [src/server/github/dto.ts](../src/server/github/dto.ts) (`RepoDTO`,
  mapeamento explícito campo a campo — confirmado por teste que campos
  extra como `owner.email`, `permissions`, `installation`, `clone_url`
  com token embutido não sobrevivem ao mapeamento).
- **Teste automatizado:** `scripts/check-bundle-secrets.ts`, rodado ao
  final de todo `npm run build` — falha o build se achar `ghp_`,
  `github_pat_`, `gho_`, `ghs_`, `ghu_` em `.next/static/` ou
  `out/portfolio/`. `tests/unit/dto.test.ts` — campo extra na resposta
  simulada do GitHub não passa para a saída. `tests/unit/portfolio-export.test.ts`
  (Fase 6) — gera uma exportação real do portfólio com um token falso
  registrado para redação e garante por asserção que o HTML resultante
  não contém o token, nenhum padrão `ghp_*`/`github_pat_*`, nem tags que
  fariam uma requisição de rede (`<script>`, `<link>`, `fetch(`).
- **Status:** ☑ Implementado (DTOs cobrindo `GET /api/repos` e a
  exportação estática do portfólio — Fase 6; outros endpoints ganham seus
  próprios DTOs conforme são construídos nas próximas fases — a técnica é
  a mesma).

### A2 — Vazamento para o histórico do Git
Um `.env` commitado uma vez fica no histórico para sempre — remover o
arquivo num commit posterior não resolve nada.

- **Defesa:** `.gitignore` completo cobrindo `.env*`, `data/`, `*.db`,
  `vault.enc`, certificados; hook `pre-commit` do lefthook rodando
  `gitleaks protect --staged`; hook `pre-push` rodando `gitleaks detect`
  no diretório inteiro; regras extras em `.gitleaks.toml` para os padrões
  de token do GitHub e para o nome de arquivo `vault.enc`.
- **Mecanismo:** [.gitignore](../.gitignore), [.gitleaks.toml](../.gitleaks.toml),
  [lefthook.yml](../lefthook.yml).
- **Procedimento de incidente:** se um token for commitado, **revogue
  imediatamente** em `github.com/settings/tokens`. Reescrever o histórico
  do Git (`git filter-repo`, BFG) não é suficiente — assuma que o token já
  foi coletado por qualquer bot que varre repositórios públicos, mesmo que
  o commit tenha vivido por segundos. Depois de revogar: gere um token
  novo, rode `npm run db:backup` antes de tocar no vault, então use
  `scripts/rotate-token.ts` (Fase 5) para trocar o token sem refazer o
  setup inteiro.
- **Recomendação adicional:** habilite **Push Protection** e **Secret
  Scanning** nas configurações do repositório no GitHub — são gratuitos
  para repositórios públicos e detectam antes mesmo do seu hook local.
- **Status:** ☐ Implementado — Fase 0.

### A3 — CSRF e DNS rebinding a partir do navegador
Com o painel aberto, visitar um site malicioso na mesma sessão do
navegador permite que esse site dispare requisições para
`http://localhost:3000`. Com DNS rebinding, ele contorna a same-origin
policy resolvendo um domínio dele para `127.0.0.1` — nesse ponto, o
browser considera a origem "correta" do ponto de vista de IP, mas o
header `Host` da requisição ainda carrega o domínio do atacante.

- **Defesa (anti-rebinding):** `middleware.ts` lê o header `Host` antes de
  qualquer outra lógica e aceita apenas `127.0.0.1:<porta>`,
  `localhost:<porta>` e `[::1]:<porta>`. Qualquer outro valor recebe
  `421 Misdirected Request` com corpo vazio.
- **Defesa (anti-CSRF):** toda rota que muda estado exige
  `Sec-Fetch-Site: same-origin` (ou ausência do header, tratada no Route
  Handler); como reforço, valida `Origin` contra a lista de origens
  permitidas. Requisições sem `Origin` e sem `Sec-Fetch-Site` (ex: `curl`,
  scripts locais) só passam com `X-Local-Client: 1` **e** sessão válida —
  as duas coisas, não uma ou outra. CORS nunca é habilitado; o header
  `Access-Control-Allow-Origin` nunca é emitido.
- **Mecanismo:** [src/middleware.ts](../src/middleware.ts) (Host check +
  primeira camada de origem); [src/server/guards.ts](../src/server/guards.ts)
  (`requireSameOrigin` — reforço que cobre o caso `X-Local-Client`; a
  validação de sessão em si, `requireSession`, ainda não é chamada por
  nenhum Route Handler real, porque não há rota autenticada além das de
  auth em si até a Fase 2).
- **Teste automatizado:** `tests/security/host-check.test.ts`,
  `tests/security/csrf.test.ts` (Fase 7).
- **Status:** ☑ Implementado — Host check, verificação de origem, e
  `requireSameOrigin` com suporte a `X-Local-Client` prontos.

### A4 — Exposição na rede local
`next dev -H 0.0.0.0` publica o painel para todo mundo no Wi-Fi. Num café
ou coworking, isso é acesso administrativo aberto aos repositórios.

- **Defesa:** todos os scripts do `package.json` usam `-H 127.0.0.1`
  explicitamente, nunca `0.0.0.0`. `next.config.ts` verifica
  `process.env.HOST` no carregamento do módulo e **aborta o processo**
  (`throw`) se o valor não for loopback — não é possível contornar isso
  definindo `HOST` no ambiente por engano.
- **Mecanismo:** [package.json](../package.json) (scripts `dev`, `start`),
  [next.config.ts](../next.config.ts) (checagem no topo do arquivo),
  [src/instrumentation.ts](../src/instrumentation.ts) (`register()` —
  hook oficial do Next que roda uma vez no boot do servidor, antes de
  atender qualquer requisição; loga
  `Escutando apenas em 127.0.0.1 — não acessível pela rede local.`
  Verificado ao vivo no terminal com `next start`.)
- **Status:** ☑ Implementado.

### A5 — XSS via conteúdo do GitHub
READMEs, títulos de issues, descrições e corpos de PR são conteúdo
controlado por terceiros (qualquer colaborador, ou você mesmo copiando de
algum lugar). Renderizar HTML cru dali executa script no painel
autenticado — que tem acesso de escrita aos seus repositórios.

- **Defesa:** todo markdown passa pelo pipeline `unified` com
  `rehype-sanitize` **obrigatório**, schema restritivo baseado em
  `defaultSchema` cortado para a lista exata: cabeçalhos, parágrafos,
  listas, links, imagens, code, blockquote, tabelas GFM, `hr`, `strong`,
  `em`, `del`, `br`, `span` (tokens de syntax highlight). Bloqueia
  `<script>`, `<style>`, `<iframe>`, `<object>`, `<embed>`, `<form>`,
  `<meta>`, `<base>`, todo atributo `on*`, URLs `javascript:` em
  qualquer atributo, e `data:` em qualquer lugar exceto `img.src`. Links
  externos recebem `rel="noopener noreferrer nofollow"` e
  `target="_blank"`. `dangerouslySetInnerHTML` só existe num único
  componente (`MarkdownView`) — reforçado por regra ESLint
  `react/no-danger` habilitada em todo o resto do projeto, testada ao
  vivo (arquivo de prova temporário criado e removido; confirmado que a
  regra bloqueia de verdade fora desse componente).
- **Lacuna conhecida, não implementada nesta fase:** o placeholder
  "Carregar imagens" para hotlink de domínio de terceiro (mencionado no
  prompt original §4.7) — imagens de qualquer host `http`/`https`
  carregam diretamente hoje. Não é uma vulnerabilidade de XSS (é sobre
  privacidade/tracking via hotlink, ameaça distinta), mas é uma
  divergência real do prompt original que fica registrada aqui em vez de
  reivindicada como feita.
- **Mecanismo:** [src/server/markdown.ts](../src/server/markdown.ts),
  [src/components/markdown/MarkdownView.tsx](../src/components/markdown/MarkdownView.tsx),
  [eslint.config.mjs](../eslint.config.mjs) (regra `react/no-danger`).
- **Teste automatizado:** `tests/unit/markdown-sanitize.test.ts` — 25
  testes cobrindo o corpus completo: `<script>` (direto e case-mangled),
  `<img onerror/onload>`, `javascript:` em `href` e em HTML bruto,
  `<iframe>`, `<object>`, `<embed>`, `<form>`, SVG com `<script>`/`onload`/
  `xlink:href`, `<style>` com expression, `data:text/html` em link,
  `<meta refresh>`, `<base>`, atributo `style=`. Todos neutralizados;
  markdown legítimo (headers, listas, links, tabelas GFM, code) continua
  renderizando.
- **Status:** ☑ Implementado (exceto a lacuna do placeholder de imagem,
  documentada acima).

### A6 — SSRF pelo servidor
Se algum endpoint aceitar uma URL do usuário e o servidor buscar essa URL,
ele vira um proxy para a rede interna e para endpoints de metadata (ex:
`169.254.169.254` em ambientes cloud).

- **Defesa:** nenhum Route Handler aceita URL arbitrária para `fetch` no
  servidor. Recursos externos usam allowlist estrita de host:
  `api.github.com`, `raw.githubusercontent.com`,
  `avatars.githubusercontent.com` — nada mais. `owner`/`repo` validados
  por regex restritiva; caminhos de arquivo normalizados e rejeitados se
  escaparem do diretório do repositório.
- **Mecanismo:** [src/server/github/client.ts](../src/server/github/client.ts)
  (o Octokit em si só fala com `api.github.com` por construção — não há
  parâmetro de host configurável exposto ao usuário);
  [src/server/schemas/github.ts](../src/server/schemas/github.ts)
  (`RepoParamsSchema` — regex restritiva para owner/repo).
- **Teste automatizado:** `tests/security/ssrf.test.ts` — `../`, barra,
  barra invertida, URL absoluta, caractere de controle (null byte), e
  encoding de porcentagem todos rejeitados.
- **Status:** ☑ Implementado (validação de entrada; a listagem de allowed
  hosts para `raw.githubusercontent.com`/`avatars.githubusercontent.com`
  chega quando um endpoint realmente buscar esses recursos — Fase 3).

### A7 — Vazamento por log
`console.log(response)` do Octokit imprime o header `Authorization`. Logs
vão para arquivo, terminal, e às vezes para um paste num chat de suporte.

- **Defesa:** `src/server/log.ts` expõe uma função `redact()` que
  substitui por `[REDACTED]` qualquer string que case com
  `ghp_[A-Za-z0-9]{36}`, `github_pat_[A-Za-z0-9_]{22,}`, `gho_`, `ghs_`,
  `ghu_`, e o valor literal do token atual em memória. O hook de log do
  Octokit registra apenas método, caminho, status e tempo — nunca
  headers, nunca corpo. `console.log` direto é proibido em código de
  servidor via regra ESLint `no-console`, com exceção só para o próprio
  módulo de log. Logs vão para `data/logs/app.log` (diretório inteiro no
  `.gitignore`).
- **Mecanismo:** [src/server/log.ts](../src/server/log.ts) (`redact()`,
  estado ancorado em `globalThis` — ver docs/ARCHITECTURE.md),
  [src/server/github/client.ts](../src/server/github/client.ts)
  (`octokit.hook.wrap("request", ...)` — confirmado ao vivo no log real:
  `{"method":"GET","path":"/user/repos","status":401,"durationMs":411}`,
  sem headers, sem corpo, sem o token), [eslint.config.mjs](../eslint.config.mjs)
  (regra `no-console` ativa desde a Fase 0).
- **Teste automatizado:** `tests/unit/redact.test.ts` — objeto de log
  contendo token sai com `[REDACTED]`.
- **Status:** ☑ Implementado.

### A8 — Outro processo na mesma máquina
Qualquer processo local pode falar com `127.0.0.1:3000`. Sem
autenticação, um script qualquer rodado por engano (ou por outro
programa) tem acesso total ao painel.

- **Defesa:** sessão local com senha mestra, mesmo rodando só em
  localhost. Wizard de setup no primeiro boot exige senha mestra
  (derivação `scrypt`, `N=2^17, r=8, p=1`, salt de 16 bytes). Sessão de
  32 bytes aleatórios; banco guarda só o hash SHA-256 do token de sessão.
  Cookie `HttpOnly`, `SameSite=Strict`, `Max-Age` de 8h com renovação
  deslizante. Bloqueio automático após 30 min de inatividade, e botão
  "Bloquear painel" sempre visível.
- **Mecanismo:** [src/server/auth/session.ts](../src/server/auth/session.ts),
  [src/server/auth/password.ts](../src/server/auth/password.ts),
  [src/server/vault/crypto.ts](../src/server/vault/crypto.ts) (scrypt +
  AES-256-GCM), [src/app/setup/page.tsx](../src/app/setup/page.tsx),
  [src/app/unlock/page.tsx](../src/app/unlock/page.tsx),
  [src/components/layout/LockButton.tsx](../src/components/layout/LockButton.tsx)
  (botão + timer de inatividade client-side — a garantia real de
  inatividade é recalculada no servidor a partir de `lastSeenAt` em
  `session.ts`, o timer do client é só UX).
- **Nota de arquitetura importante:** o token decifrado do vault vive em
  `globalThis` (não numa variável `let` de module scope) — ver
  [docs/ARCHITECTURE.md](ARCHITECTURE.md), seção "Estado em memória
  entre Route Handlers e páginas". Sem isso, o estado "destravado" não
  era visto de forma consistente entre a rota de unlock e a página do
  dashboard — bug real descoberto e corrigido nesta fase.
- **Status:** ☑ Implementado. Validado ao vivo: setup → unlock → acesso
  ao dashboard → restart do processo → painel exige senha de novo
  (`isUnlocked()` reseta porque `globalThis` é por processo, não
  persiste entre restarts — o vault sempre precisa ser redecifrado).

### A9 — Ação destrutiva por engano
Deletar branch, forçar push, arquivar repositório, apagar release. Erro
seu, dano permanente.

- **Defesa:** variável `ALLOW_DESTRUCTIVE=false` por padrão — botões
  destrutivos ficam desabilitados com tooltip explicando como habilitar.
  Toda ação destrutiva exige digitar o **nome completo do repositório**
  no diálogo de confirmação (não um "Confirmar" genérico). Toda ação
  destrutiva é gravada em `activity_log` com timestamp, ação, alvo e
  resultado. **Exclusão de repositório não é implementada — nem atrás de
  flag.** Antes de sobrescrever arquivo via API, mostra diff e exige
  confirmação.
- **Mecanismo:** [src/server/guards.ts](../src/server/guards.ts)
  (`requireDestructiveAllowed()` — checa `ALLOW_DESTRUCTIVE`, lança 403
  se ausente/false),
  [src/components/feedback/ConfirmDestructive.tsx](../src/components/feedback/ConfirmDestructive.tsx)
  (exige digitar o nome completo; botão de confirmação fica desabilitado
  quando `destructiveAllowed` é `false`, com o motivo explicado na UI),
  [src/server/github/repo-settings.ts](../src/server/github/repo-settings.ts)
  (`setRepoVisibility()` — única ação classificada como destrutiva nesta
  fase; a rota valida o nome digitado ANTES de sequer chamar a função
  que checa a flag — duas camadas independentes),
  [src/server/activity-log.ts](../src/server/activity-log.ts)
  (`logAction()` — timestamp, ação, alvo, resultado, chamado em toda
  escrita ao GitHub, destrutiva ou não).
- **Escopo desta fase:** das ações destrutivas listadas no prompt
  original (branch, force push, arquivar, apagar release), só
  alternância de visibilidade foi implementada — as demais não têm UI
  nesta fase (não existe "forçar push" ou "arquivar" no painel ainda).
  Exclusão de repositório **não implementada, nem atrás de flag** —
  decisão permanente, não uma lacuna desta fase.
- **Teste automatizado:** nenhum teste unitário dedicado ainda (a lógica
  de `requireDestructiveAllowed()` é simples o bastante para não
  justificar um arquivo de teste próprio) — validado ao vivo contra o
  servidor real: `PUT /visibility` sem `ALLOW_DESTRUCTIVE` retorna `403
  DESTRUCTIVE_ACTIONS_DISABLED`; nome de confirmação incorreto retorna
  `400 CONFIRMATION_MISMATCH` antes mesmo de a guarda destrutiva ser
  avaliada.
- **Status:** ☑ Implementado (para o escopo desta fase — ver nota
  acima).

### A10 — Cadeia de suprimentos
Uma dependência comprometida com script de `postinstall` lê `.env.local`
e exfiltra.

- **Defesa:** lockfile commitado; `npm ci` nas instruções (nunca
  `npm install` no fluxo padrão); lista de dependências mantida curta,
  cada uma justificada; `npm run audit` roda `npm audit --audit-level=high`;
  `.github/dependabot.yml` com atualizações semanais.
- **Mecanismo:** [package.json](../package.json) (script `audit`),
  [.github/dependabot.yml](../.github/dependabot.yml).
- **Opção mais paranoica:** `npm ci --ignore-scripts` — documentado em
  `docs/SETUP.md`, com aviso de que pode quebrar pacotes com binário
  nativo como `better-sqlite3` (nesse caso, rode
  `npm rebuild better-sqlite3` separadamente após revisar o script).
- **Status:** ☐ Implementado — Fase 0 traz lockfile e script de audit;
  `dependabot.yml` chega na Fase 7 junto com o endurecimento final.

### Dívida técnica conhecida — vulnerabilidades aceitas

`npm run audit` (limite `--audit-level=high`) passa limpo desde a Fase 0.
Abaixo do limite, seguem 4 vulnerabilidades moderadas conhecidas e
aceitas conscientemente:

- **`esbuild <=0.24.2`** (moderada, CVSS 5.3,
  [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99))
  — permite que um site externo mande requisição para o dev server e
  leia a resposta. Chega via `drizzle-kit` → `@esbuild-kit/esm-loader`.
  **Por que aceito:** `drizzle-kit` só roda como CLI local
  (`db:migrate`, `db:generate`), nunca como processo de servidor do
  painel em si — não há dev server do Drizzle exposto durante o uso
  normal. A correção exigiria downgrade do `drizzle-kit` para
  `0.18.1` (`isSemVerMajor: true`), uma regressão de versão maior que
  o risco que resolve.
  **Reavaliar quando:** o próprio `drizzle-kit` publicar uma versão
  estável que não dependa mais de `@esbuild-kit/esm-loader` — checar
  com `npm audit` a cada bump de `drizzle-kit`.

Se novas vulnerabilidades de severidade alta ou crítica aparecerem no
futuro (via `npm audit` ou Dependabot), elas **não** entram nesta lista
de aceitas sem decisão explícita — o padrão é corrigir, não silenciar.

### Pendência de validação — sem token real do GitHub disponível

`GET /api/repos` (Fase 2) foi validado ao vivo contra o servidor real
(`next start`) para todas as camadas de guarda: Host check (421),
sessão ausente (401), origem cross-site (403), vault bloqueado (423), e
erro sanitizado quando o GitHub rejeita um token inválido (502, log
confirmado sem vazamento). **Não validado nesta sessão de
desenvolvimento**, por não haver um fine-grained PAT real disponível no
ambiente: listagem de repositórios reais, `fromCache: true` no segundo
load, e revalidação via ETag/304 contra `api.github.com` de verdade.
Procedimento de validação manual documentado em `docs/SETUP.md`.

---

## Acesso remoto — se um dia você quiser acessar de fora

O design atual **assume loopback**, e essa suposição está codificada em
vários pontos: o Host check da A3 rejeita qualquer `Host` que não seja
`127.0.0.1`/`localhost`/`[::1]`; a sessão de 8h sem segundo fator assume
que só você tem acesso físico à máquina; não há rate limiting por IP
porque não se espera mais de um cliente.

Se você quiser acessar o painel de fora da sua máquina:

- **Opção recomendada:** [Tailscale](https://tailscale.com) ou
  **Cloudflare Tunnel com Access** — os dois autenticam na borda, antes
  da requisição sequer chegar no processo Node. Isso significa que o
  painel continua "pensando" que está em loopback (você acessa via um IP
  da VPN/túnel que ainda bate com as regras de host, ou o túnel termina
  em `127.0.0.1` do lado do servidor).
- **Nunca** exponha via port forwarding no roteador. Nunca use túnel
  público sem autenticação na borda (ex: `ngrok` sem senha).
- Se o painel algum dia sair do loopback de verdade (bind em interface
  não-loopback, mesmo que atrás de um proxy reverso próprio), a
  verificação de Host da A3 precisa ser **reescrita** para aceitar o novo
  host esperado, e a senha mestra sozinha deixa de ser suficiente —
  segundo fator (TOTP) se torna obrigatório antes de fazer esse switch.

---

## Checklist de definição de pronto

Marcado conforme cada item é implementado e verificado — ver
`prompt-painel-github-local.md` §15 para a lista original.

- [ ] `npm run check` passa limpo.
- [ ] Todos os testes de `tests/security/` passam.
- [ ] `gitleaks detect --no-git` acha zero coisas.
- [ ] Grep por `ghp_`, `github_pat_`, `gho_` no `.next/static/` e no
      `out/` não retorna nada.
- [ ] O servidor recusa iniciar se configurado para escutar fora do
      loopback.
- [ ] `curl -H "Host: evil.com" http://127.0.0.1:3000/api/repos` responde
      421.
- [ ] Toda rota de API valida sessão, origem e input, nessa ordem.
- [ ] Nenhum arquivo em `src/components/` ou `src/hooks/` importa de
      `src/server/`, e o lint reforça isso.
- [ ] Este documento lista os 10 pontos do modelo de ameaça, cada um com
      o mecanismo de defesa e o arquivo que o implementa.
- [ ] `docs/SETUP.md` leva alguém do zero ao painel rodando em menos de
      10 minutos.
- [ ] O painel roda offline (exceto pelas chamadas ao GitHub) e o cache
      serve conteúdo quando a rede cai.
