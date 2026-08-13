# IA.md - Contexto Operacional

## Estado atual (resumo vivo)

[2026-08-13] Landing page estática publicada no GitHub Pages. O diretório publicado é
montado por allowlist no workflow de deploy, com um passo que falha a publicação se
arquivo não público ou extensão sensível entrar no artefato. Nenhum manifesto, fonte ou
arquivo de configuração é servido pelo site.

## Objetivo do projeto

[2026-08-13] Landing page e portfólio públicos do DoktorDev: apresentar projetos,
repositórios e identidade visual. Público geral, sem área autenticada.

## Estado atual

- Implementado: página única (`site/index.html`), camada visual em `site/assets/motion.css`,
  interações em `site/src/` empacotadas por esbuild, cena Three.js sob demanda, página 404
  própria e publicação automatizada no GitHub Pages.
- Não existe: login, painel administrativo, backend ou banco de dados.

## Stack e dependencias

- Frontend: HTML/CSS/JS sem framework de aplicação; `three` carregado sob demanda.
- Build: esbuild (`npm run build`) gera `assets/app.js` e `assets/hero3d.js` a partir de `src/`.
- Backend: nenhum. `site/server.mjs` é servidor de desenvolvimento local, escuta apenas em
  `localhost` e não deve servir tráfego público.
- Deploy: GitHub Actions -> GitHub Pages, com actions fixadas por SHA.
- Testes: `npm test` em `site/` (apenas `node --test`, sem dependência nova) cobre o
  servidor de desenvolvimento; o restante do site é visual e validado manualmente.

## Decisoes de arquitetura

- [2026-08-13] O artefato publicado passou a ser montado por **allowlist**: o workflow copia
  apenas `index.html`, `404.html`, `site.webmanifest` e `assets/` para um diretório `dist/`,
  que é o que vai ao Pages. Antes o workflow publicava a pasta de trabalho inteira e removia
  itens depois. Motivo: lista de exclusão envelhece mal - todo arquivo novo entra por padrão.
  Impacto: `package.json`, `package-lock.json`, `server.mjs`, `src/` e `README.md` deixaram de
  ser servidos. Continuam versionados, apenas não são publicados.
- [2026-08-13] Um passo `Validar conteúdo do artefato` falha a publicação se dotfiles ou
  extensões sensíveis (`.map`, `.bak`, `.old`, `.orig`, `.save`, `.swp`, `.sql`, `.log`,
  `.zip`, `~`) ou itens não públicos conhecidos chegarem ao diretório publicado. Existe para
  que a regressão apareça no CI e não em produção.

## Decisoes de design e convencoes

- [2026-08-13] Arquivo novo que precise ser público deve ser adicionado explicitamente ao
  passo de montagem do artefato. O padrão é não publicar.
- [2026-08-13] Versionamento segue `docs/GIT-POLITICA-DE-VERSIONAMENTO.md` do system design:
  commits `tipo(escopo): descrição` direto no `main`. O hook `commit-msg` que valida esse
  formato não é versionado - cada cópia local precisa instalá-lo uma vez a partir de
  `doktor SystemDesign/scripts/hooks/commit-msg`.
- [2026-08-13] Como o hook local só protege a máquina onde foi instalado, a mesma validação
  passou a rodar no CI (`.github/workflows/valida-commits.yml`). O workflow **reutiliza o
  script do hook** em vez de repetir o padrão, para que máquina e CI não possam discordar
  sobre o que é uma mensagem válida. Verifica apenas os commits que o evento traz e ignora
  commits de merge - o histórico anterior não é reavaliado.

## Testes importantes

- [2026-08-13] Montagem do artefato simulada localmente: resultado contém apenas os arquivos
  públicos; `package.json`, `package-lock.json`, `server.mjs`, `README.md`, `src/` e
  `node_modules` ausentes.
- [2026-08-13] Passo de validação exercitado em 5 casos: artefato limpo passa; `.map`
  injetado, `.env` + `.bak` injetados e `src/` vazando são bloqueados; volta ao limpo passa.
- [2026-08-13] Verificação contra o site publicado: caminhos sensíveis e caminho inexistente
  retornam `404` com corpo byte-idêntico - sem diferença de status, tamanho, cabeçalho ou
  redirecionamento que confirme existência. Os arquivos públicos referenciados retornam `200`.
- [2026-08-13] `npm test` em `site/`: 20 testes, todos passando. Cobrem a proteção contra
  path traversal do servidor de desenvolvimento em 16 variantes de codificação, além de
  serviço de página, content-type e resposta a URL malformada.
- [2026-08-13] BUG: `?project=constructor` (e `toString`, `valueOf`, `__proto__`,
  `hasOwnProperty`) derrubava a página de projeto. A resolução era
  `projects[slug] || padrão`, e chaves herdadas de `Object.prototype` devolvem valor
  truthy, então o fallback nunca disparava e a renderização morria em
  `project.stack.join()` com `TypeError`. Slug simplesmente desconhecido já caía no
  fallback corretamente - o defeito atingia só as chaves herdadas. Corrigido com
  `Object.hasOwn`; a lógica saiu para `src/projects-catalog.js` para poder ser testada, e
  a regressão está fixada em `tests/projects-catalog.test.mjs`.
- [2026-08-13] Teste de mutação da suíte de catálogo: reintroduzindo o lookup por herança
  numa cópia isolada, 7 dos 15 testes falham.
- [2026-08-13] Teste de mutação da suíte acima: removendo a guarda de traversal de uma cópia
  isolada do servidor, 4 testes falham - exatamente as variantes com separador
  percent-encoded (`%2e%2e%2f`, `%2e%2e%5c`). As demais variantes já são neutralizadas pelo
  parser de URL antes de chegar à guarda. Confirma que a suíte detecta a regressão real e
  documenta qual é, de fato, o trabalho da guarda.

## Integracoes e servicos externos

- Serviço: API pública do GitHub (`api.github.com/users/.../repos`), sem autenticação.
- Como está configurado: chamada direta do bundle do navegador, somente leitura de dados públicos.
- Onde ficam variáveis: não há. O site não usa segredo em runtime.
- Observação de segurança: nenhuma credencial deve ser embutida no bundle - ele é público por
  natureza. `secret scanning` e `push protection` estão ativos no repositório.

## Pendencias

- [ ] Cobertura de testes limitada ao servidor de desenvolvimento; a camada visual e a
      integração com a API do GitHub em `src/main.js` seguem validadas manualmente.
- [x] ~~Otimizar o tamanho do bundle `assets/hero3d.js`~~ - investigado em 2026-08-13 e
      encerrado: a redução não está disponível sem trocar de biblioteca. Ver o resumo de
      decisão abaixo.
- [ ] Domínio próprio ainda não aplicado; passos registrados em `site/README.md`.

## Resumos de decisao

```text
[2026-08-13] CONTEXTO: o histórico público do repositório contém 180 arquivos de um projeto
de painel (Next.js) que existiu na árvore e foi removido. Levantou-se se valeria reescrever
o histórico para retirá-lo.
ALTERNATIVAS: (a) reescrever o histórico e forçar push; (b) manter e tratar o conteúdo como
público por premissa.
DECISAO: (b) manter. O conteúdo não contém segredo, host, IP nem configuração de deploy - o
projeto era de execução local (127.0.0.1) e nunca teve alvo publicado. O repositório não tem
forks nem cópias de terceiros. Reescrever exigiria force-push sobre dezenas de commits e o
GitHub ainda retém objetos inalcançáveis por SHA, tornando a limpeza parcial.
VALIDACAO: varredura de todo o histórico por padrões de segredo (`ghp_`, `github_pat_`,
`AKIA`, `sk-`, `xox*`, blocos de chave privada) sem nenhuma ocorrência real - apenas
placeholder literal em `.env.example`. Contagem de forks/stars/watchers igual a zero.
RISCO REMANESCENTE: se aquele painel for publicado no futuro, sua árvore de rotas e desenho
de segurança já são conhecidos. A defesa nesse caso é autenticação e restrição de rede, nunca
segredo de caminho.
```

```text
[2026-08-13] CONTEXTO: `assets/hero3d.js` é o maior ativo do site. O número que circulava
(~578 KB) é o tamanho em disco; o que o navegador realmente baixa são 147 KB, porque o
GitHub Pages serve com gzip.
ALTERNATIVAS: (a) trocar `import * as THREE` por imports nomeados, esperando tree-shaking;
(b) remover PMREMGenerator/RoomEnvironment e o material físico; (c) manter como está;
(d) abandonar o Three.js e reescrever a cena.
DECISAO: (c) manter. As opções (a) e (b) foram medidas e não entregam:
  - imports nomeados: 147281 -> 147241 b gzip. Economia de 40 b (0%). O bundle sem
    minificação é byte-idêntico - o esbuild já resolve o namespace tão bem quanto possível.
  - sem PMREM + RoomEnvironment: -1556 b. Material padrão no lugar do físico: -575 b.
    As duas juntas: -2203 b, ou 1,5% - ao custo dos dois recursos que dão à cena sua
    aparência característica.
O volume é o núcleo do WebGLRenderer e seus shader chunks, alcançável assim que a cena
renderiza. Não há corte incremental disponível; só (d), que é outro projeto.
VALIDACAO: medições por build isolado em cópia do repositório, comparando bytes após
gzip -9. Nenhuma alteração foi aplicada ao código do site.
MITIGACAO JA EXISTENTE: o bundle é separado, carregado por import dinâmico em
`requestIdleCallback` (timeout de 1200 ms), e nem chega a ser baixado quando não há
WebGL ou quando o navegador sinaliza `saveData`. O custo não pesa no carregamento inicial.
```
