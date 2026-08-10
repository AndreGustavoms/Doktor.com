# IA.md - Contexto Operacional

## Estado atual (resumo vivo)

<!--
  EXCECAO a regra append-only: esta secao e um RESUMO reescrevivel (ver
  core/TEMPLATE-CONTEXTO-IA.md). Reescreva-a a cada mudanca de estado - o
  historico completo continua protegido na secao "Historico detalhado" abaixo.
-->

Ultima atualizacao: [2026-07-24]

- Fase: acervo maduro e auditado, agora com camada de saude de repositorio e automacao de qualidade. 26 guias tecnicos, todos padronizados; scripts de instalacao cobertos por 30 testes automatizados; capa/badges no README; arquivos de comunidade do GitHub presentes.
- Documentos-nucleo recentes: `core/DESIGN_SYSTEM_MODULARIDADE.md` (granularidade de arquivo: responsabilidade unica, limites por tipo, criterio de quebra - com o custo de token como motivo declarado), `core/DESIGN_SYSTEM_ECONOMIA_IA.md` (nivel de tarefa vs. nivel de modelo, economia de contexto, com medicao real do acervo) e `docs/POLITICA-DE-ATUALIZACAO.md` (gatilhos de revisao e sincronizacao com a origem).
- Versao publicada: `0.4.0` (ver `CHANGELOG.md`). Regra ativa: `VERSION`/`CHANGELOG.md` devem ser atualizados a cada leva de commits relevante - nao deixar a versao "congelar" enquanto o acervo evolui (ver `docs/CHECKLIST-PUBLICACAO.md`, secao "Publicacao continua").
- Validacao automatizada: `scripts/validate-repo.ps1` agora checa ASCII, links, imagens locais e o roteador de guias (`scripts/validate-router.ps1`: cobertura + colisao de palavras-chave); `scripts/measure-context.ps1` recalcula a economia de contexto do acervo sob demanda.
- Seguranca/privacidade: `SECURITY.md` na raiz (politica de reporte), `templates/SECURITY-template.md` reforcado e `templates/PRIVACIDADE-LGPD-template.md` novo para projetos com dados pessoais.
- Git: regra formal de `git pull` antes de comecar a commitar e `git push` automatico ao final de cada leva, sem esperar confirmacao manual (ver `docs/GIT-POLITICA-DE-VERSIONAMENTO.md`, secao 3).
- Proximo passo natural: nao ha pendencia de alta prioridade conhecida. Manutencao continua: revisar um guia so quando ficar desatualizado tecnicamente, e sempre que um guia novo for adicionado, checar cobertura no roteador (o validador ja pega guia fora do roteador e colisao de palavra-chave) e referencia cruzada com guias relacionados.
- Risco aberto: nenhum bloqueante conhecido; atencao recorrente e manter os documentos de indice (`docs/INDICE-GERAL.md`, `docs/GUIAS-OPCIONAIS.md`, `AGENTS.md`) sincronizados sempre que um guia for adicionado ou renomeado.

## Objetivo atual

Transformar este repositorio em uma base propria de system design, qualidade e guias reutilizaveis para projetos Doktor, aproveitando o que havia de bom no repositorio de referencia sem copiar identidade pessoal de terceiros para o corpo da documentacao.

## Historico detalhado

- Estrutura importada: `core/`, `docs/`, `guias/`, `scripts/`, `AGENTS.md`, `CONTRIBUTING.md`, `LICENSE`.
- README reescrito para servir como porta de entrada do Doktor System-Design.
- Identidade pessoal separada em `docs/DECISOES-DE-IDENTIDADE.md`.
- Atribuicao legal centralizada em `NOTICE.md` e `LICENSE`.
- Identidade publica definida: Andre Gustavo Melo da Silva, GitHub `AndreGustavoms`, nome `Doktor System-Design`.
- Comando global escolhido: `doktor`, em minusculo.
- Scripts simplificados para sincronizar este repositorio sem submodulos.
- Stack consolidada em `docs/STACK-E-ARQUITETURA.md` como baseline tecnica por contexto.
- `CONTRIBUTING.md` reescrito em tom neutro.
- Checklist de publicacao criado em `docs/CHECKLIST-PUBLICACAO.md`.
- Indice geral criado em `docs/INDICE-GERAL.md`.
- Identidade Doktor criada em `docs/IDENTIDADE-DOKTOR.md`, misturando autoria local, padroes observados e influencia da origem MIT.
- Plano de curadoria dos guias criado em `docs/CURADORIA-DOS-GUIAS.md`.
- `core/GUIA_MINIMO_QUALIDADE.md` e `docs/STACK-E-ARQUITETURA.md` marcados como revisados na curadoria.
- `core/DESIGN_SYSTEM_BACKEND.md` reescrito e marcado como revisado.
- `core/DESIGN_SYSTEM_FRONTEND.md` reescrito e marcado como revisado.
- `core/DESIGN_SYSTEM_README.md` reescrito e marcado como revisado.
- `core/PROMPT_BASE_BACKEND.md` e `core/PROMPT_BASE_FRONTEND.md` reescritos e marcados como revisados.
- `core/GUIA-START-APP-SCRIPT.md` marcado como revisado apos validacao estrutural.
- Guias de integracao revisados: Railway, Scraping Multiformato e GitHub API.
- Leitura dos repositorios publicos de `AndreGustavoms` registrada em `docs/PADROES-OBSERVADOS-GITHUB.md`.
- Guias frontend revisados/criados: Background Visual, Calendario Academico, Particulas e Glow, Componentes UI Compostos, Breadcrumb e Metadata Bar, Arvore Hierarquica, Arvore de Materiais Dual View, Heatmap de Atividade, Onboarding e Ajuda, Sistema de Alerta e Grade.
- Guia rapido de uso, checklist de projeto pronto e templates copiaveis criados.
- Proposito do Doktor reforcado como padrao leve para orientar IA em projetos novos, reduzir consumo de contexto e evitar leitura desnecessaria.
- Template `templates/AGENTS-template.md` criado para ser copiado como `AGENTS.md` na raiz de projetos destino.
- Guia rapido, checklist de projeto pronto e README-template ajustados para tratar `AGENTS.md` como parte do fluxo de projeto com IA.
- `docs/GUIA-RAPIDO-USO.md` passou a separar niveis de adocao (minimo, recomendado e completo) e incluir prompt inicial para IA.
- README, AGENTS, indice, guia rapido e template de AGENTS alinhados aos documentos recentes de API REST, arquitetura, seguranca, testes e hook de commit.
- Asset `assets/social-preview.png` criado para social preview do GitHub; validador ajustado para ignorar assets binarios na checagem ASCII.
- CI simples adicionada com `scripts/validate-repo.ps1` e `.github/workflows/validate.yml`.
- Guias backend CPF e Cifra de Cesar reescritos no padrao Doktor.
- Versao inicial registrada em `VERSION` e `CHANGELOG.md`.
- Scripts de instalacao validados em ambiente real (PowerShell, CMD, Bash/Git Bash).
- Repositorio renomeado no GitHub para `Doktor-SystemDesign`; remote e todas as referencias internas atualizados.
- Pasta destino do comando `doktor` renomeada para `doktor SystemDesign`.
- Hook Git nativo `scripts/hooks/commit-msg` adicionado para validar Conventional Commits; instrucoes em `docs/GIT-POLITICA-DE-VERSIONAMENTO.md`.
- Politica de commits expandida: estrutura com escopo opcional, tipos `style` e `test`, modo imperativo e regra de nao misturar refatoracao com feature.
- `core/DESIGN_SYSTEM_ARQUITETURA.md` criado: organizacao por camadas, nomenclatura, regras de funcao/arquivo, antipadroes e checklist de entrega.
- `core/DESIGN_SYSTEM_SEGURANCA.md` criado: secrets, variaveis de ambiente, autenticacao, autorizacao, validacao de entrada, SQL injection, XSS, headers HTTP, OWASP Top 10 e checklist de entrega.
- `core/DESIGN_SYSTEM_API_REST.md` criado: nomenclatura de endpoints, metodos HTTP, status codes, envelope data/error, versionamento, paginacao, filtros, autenticacao Bearer e checklist de entrega.
- `core/DESIGN_SYSTEM_TESTES.md` criado: tipos de teste, piramide, nomenclatura deve-X-quando-Y, estrutura AAA, mocks, cobertura minima e checklist de entrega.
- `templates/AGENTS-template.md` criado: template copiavel do AGENTS.md para projetos destino, incluindo os quatro novos padroes no roteiro.
- Duplicatas de API REST removidas de `AGENTS.md` e `docs/CORE-PADROES-OBRIGATORIOS.md`.
- `VERSION` atualizado para 0.2.0. Tag `v0.2.0` publicada.
- [2026-07-23] Comparacao completa com o repositorio de origem `Felipe-Alcantara/Felixo-System-Design` (clone local) para mapear melhorias tecnicas nao trazidas na importacao inicial e evolucoes posteriores da origem. Trazido ao Doktor nesta leva:
 - `core/GUIA_MINIMO_QUALIDADE.md`: reintegradas regras de anti-alucinacao (confirmar API/lib antes de usar), validacao com evidencia real de execucao, regua unica de testes, automacao-antes-de-edicao-manual, dependencias pinadas com auditoria (`pip-audit`/`npm audit`).
 - `core/DESIGN_SYSTEM_BACKEND.md`: adicionado TDD como fluxo preferencial, "ferramenta antes da solucao especifica", documentacao viva em tempo real (nao so ao final).
 - `core/GUIA-START-APP-SCRIPT.md`: mudanca de filosofia - de `start_app.py` com flags restrito a apps web, para menu interativo/colorido (`questionary`/`rich`/`textual`) obrigatorio para todo programa rodavel (web, CLI, automacao, script, desktop). Referencias atualizadas em `docs/STACK-E-ARQUITETURA.md`, `docs/CORE-PADROES-OBRIGATORIOS.md`, `docs/INDICE-GERAL.md`.
 - `core/PROMPT_BASE_BACKEND.md` e `PROMPT_BASE_FRONTEND.md`: adicionadas instrucoes de anti-alucinacao, validacao com evidencia real, documentacao viva em tempo real e filosofia de ferramenta reutilizavel.
 - `AGENTS.md` e `templates/AGENTS-template.md`: regra "automacao antes de ajuste manual", limite pratico de 1-2 documentos por tarefa, referencia ao novo guia de economia de IA, referencia a `IA.md` como linha do tempo (nao sobrescrever).
 - `core/TEMPLATE-CONTEXTO-IA.md` e `templates/IA-template.md`: adicionado mecanismo de arquivamento (`docs/ia-archive/IA-ARCHIVE-<ano>.md`) para quando o `IA.md` crescer demais, e secao "Estado atual (resumo vivo)" reescrevivel (excecao a regra append-only).
 - `docs/GIT-POLITICA-DE-VERSIONAMENTO.md`: adicionada secao "Apos o merge: apague a branch" com comandos e item de checklist.
 - Dois guias novos portados (reescritos no padrao Doktor, sem identidade pessoal/projeto de terceiros): `guias/frontend/GUIA-PAINEL-DE-COLECAO-COM-FILTROS-E-VIEWS.md` e `guias/integracao/GUIA-NOTION-COMO-BASE-DE-DADOS.md`.
 - Scripts de instalacao: `install-doktor-powershell.ps1` ganhou checagem/ajuste de `ExecutionPolicy` (evita que o comando fique instalado mas nunca apareca) e pausa final com `DOKTOR_NO_PAUSE`/`DOKTOR_PROFILE` para automacao; `doktor-command.cmd` e `install-doktor-bash-zsh.sh` ganharam `.gitignore` automatico da pasta de destino (idempotente, UTF-8 sem BOM); `install-doktor-cmd.cmd` trocou `setx` (que truncava PATH em 1024 chars e convertia `REG_EXPAND_SZ`) por escrita direta no registro via PowerShell, com `DOKTOR_PATH_REG`/`DOKTOR_NO_PAUSE` para teste.
 - Suite de testes automatizados criada do zero para este repositorio (o Doktor nao tinha nenhuma): `scripts/tests/installers.tests.ps1` (instalar/reinstalar/desinstalar nos 3 terminais), `scripts/tests/run-tests.ps1` (orquestrador), `scripts/cmd/tests/ensure-gitignore.tests.ps1` (7 casos do `.gitignore` automatico, incluindo nomes acentuados e idempotencia), `scripts/bash-zsh/tests/installers.tests.sh` (suite nativa para Linux/macOS/WSL). Rodada localmente: 30 testes passaram, 1 pulado (falta `rsync` no Git Bash deste ambiente, comportamento ja documentado em `docs/VALIDACAO-SCRIPTS.md`).
 - Documentos novos: `core/DESIGN_SYSTEM_ECONOMIA_IA.md` (niveis de tarefa vs. nivel de modelo de IA, economia de contexto, sem prender a nomes/versoes especificas de modelo) e `docs/POLITICA-DE-ATUALIZACAO.md` (gatilhos de revisao e processo de comparacao periodica com o repositorio de origem).
 - Indices e docs de navegacao atualizados: `docs/INDICE-GERAL.md`, `docs/GUIAS-OPCIONAIS.md`, `docs/CURADORIA-DOS-GUIAS.md`, `docs/CORE-PADROES-OBRIGATORIOS.md`, `docs/VALIDACAO-SCRIPTS.md`, `README.md`.
 - Nao trazido: `.gitmodules`/submodulo `components-database` (infraestrutura pessoal do autor de origem, fora do escopo do Doktor); nomes de clientes/projetos de terceiros citados nos guias de origem (ex.: nome de workspace especifico no guia de Notion) foram generalizados, coerente com `docs/DECISOES-DE-IDENTIDADE.md`.
- [2026-07-23] Pedido do usuario: mais guias no acervo E economia de token ao mesmo tempo. Decisao: o acervo cresce (mais guias), mas o consumo por tarefa nao deve crescer junto - reforcado o roteador para abrir no maximo 1 guia opcional por tarefa, independente de quantos guias existirem no total. Nesta leva:
  - 8 guias novos criados (nao vem da origem Felixo, sao dominios que o usuario pediu explicitamente): `guias/integracao/GUIA-INTEGRACAO-LLM-E-AGENTES.md`, `guias/backend/GUIA-AUTENTICACAO-JWT-OAUTH.md`, `guias/backend/GUIA-FILAS-E-JOBS-ASSINCRONOS.md`, `guias/backend/GUIA-CACHE-COM-REDIS.md`, `guias/frontend/GUIA-FORMULARIOS-COMPLEXOS.md`, `guias/frontend/GUIA-TABELA-DE-DADOS-SERVER-SIDE.md`, `guias/integracao/GUIA-CI-CD-BASICO.md`, `guias/integracao/GUIA-OBSERVABILIDADE-LOGS-E-HEALTHCHECKS.md`. Todos seguem o molde existente (Quando usar/Quando nao usar/Resultado esperado/secoes tecnicas com codigo real/Checklist).
  - `core/DESIGN_SYSTEM_ECONOMIA_IA.md`: nova secao 3.1 "O acervo pode crescer sem aumentar o gasto por tarefa" - guia novo e uma linha a mais na tabela de indice (barata), nao mais leitura por tarefa; regra pratica de escolher palavras-chave especificas o suficiente para nao colidir entre guias. Novo item na lista de sinais de gasto desproporcional (mais de 1 guia opcional aberto para a mesma tarefa).
  - `AGENTS.md` e `templates/AGENTS-template.md`: adicionada regra explicita de abrir no maximo 1 guia opcional por tarefa; tabela de indice da secao 3 atualizada com os 8 guias novos e palavras-chave especificas.
  - `docs/GUIAS-OPCIONAIS.md`, `docs/INDICE-GERAL.md`, `docs/CURADORIA-DOS-GUIAS.md`: atualizados com os 8 guias novos.
- [2026-07-23] Pedido do usuario: "melhore tudo que for possivel para alcancar um nivel de excelencia absoluto, digno de elogios, para quem for usar" + regra de commits sempre separados/bem formatados + pull/push automatico. Rodada de auditoria completa (agente Explore) identificou 15 achados priorizados; todos os de prioridade alta e media foram resolvidos nesta leva:
  - **Git**: `docs/GIT-POLITICA-DE-VERSIONAMENTO.md` ganhou secao 3 "Sincronizacao com o remoto" - `git pull` antes de comecar a commitar, `git push` automatico ao final de cada leva de commits, sem esperar confirmacao manual (excecoes: force-push, conflito, segredo). Regra propagada a `AGENTS.md`. No `templates/AGENTS-template.md` isso ficou como recomendacao configuravel (decisao do projeto destino), nao regra automatica herdada.
  - **Achado critico corrigido**: o `IA.md` deste repositorio nao tinha uma secao chamada "Estado atual (resumo vivo)" apesar de `AGENTS.md`, `templates/AGENTS-template.md` e `core/DESIGN_SYSTEM_ECONOMIA_IA.md` instruirem a IA a ler essa secao primeiro. Adicionada a secao no topo do arquivo; a lista cronologica antiga foi renomeada para "Historico detalhado".
  - **Versionamento**: `VERSION` avancado de 0.2.0 para 0.3.0; `CHANGELOG.md` ganhou entrada completa cobrindo os 8 commits da leva anterior (economia de IA, menu interativo, suite de testes, correcao de bug do PATH, 10 guias novos/portados) - a versao estava "congelada" 30 dias enquanto o acervo evoluiu bastante.
  - **Padronizacao de guias**: os 15 guias mais antigos (visuais de frontend, backend educacional, integracao) nao tinham a secao `## Ideias para quem quiser contribuir` que os 10 guias mais recentes ja tinham. Adicionada em todos, com conteudo especifico a cada guia (nao generico).
  - **Referencias cruzadas adicionadas**: `GUIA-CACHE-COM-REDIS.md` <-> `GUIA-FILAS-E-JOBS-ASSINCRONOS.md` (Redis como lock distribuido, uso diferente de cache-aside); `GUIA-AUTENTICACAO-JWT-OAUTH.md` -> `GUIA-OBSERVABILIDADE-LOGS-E-HEALTHCHECKS.md` (nunca logar token/senha).
  - `docs/CHECKLIST-PUBLICACAO.md`: item de revisao de guias marcado como concluido; nova secao "Publicacao continua" cobrindo tag/versao a cada leva relevante (nao so no lancamento inicial).
  - `docs/CURADORIA-DOS-GUIAS.md`: a tabela de "Prioridade de revisao" conflitava com a tabela de progresso (uma dizia "pendente", outra "revisado" para os mesmos guias) - reclassificada como registro historico da curadoria inicial, ja concluida.
  - `docs/CHECKLIST-PROJETO-PRONTO.md`: 2 itens novos referenciando `core/DESIGN_SYSTEM_ECONOMIA_IA.md` (documentos lidos por tarefa, nivel de modelo proporcional).
  - `docs/POLITICA-DE-ATUALIZACAO.md`: nota de escopo esclarecendo que o documento e especifico deste repositorio e nao deve ser copiado para projetos destino.
  - Pequenos ajustes de descoberta: `README.md` (mapa rapido ganhou `docs/POLITICA-DE-ATUALIZACAO.md` e `docs/VALIDACAO-SCRIPTS.md`); `docs/GUIA-RAPIDO-USO.md` (exemplos dos guias novos nas secoes de frontend/backend).
  - Validado apos as mudancas: `scripts/validate-repo.ps1` OK; suite de testes dos instaladores com 30 testes passando, 1 pulado (falta de `rsync`, comportamento esperado).

## Decisoes tomadas

- Nao trazer submodulos externos do repositorio de origem.
- Manter atribuicao MIT da origem, sem repetir assinaturas pessoais no fim dos guias.
- Usar ASCII nos arquivos normalizados para evitar texto quebrado vindo da origem.
- Tratar stack como baseline tecnica revisavel do repositorio, nao como preferencia pessoal publica.
- Publicar autoria local como Andre Gustavo Melo da Silva / AndreGustavoms.
- Usar padroes observados no GitHub como direcao inicial, nao como regra cega para todo projeto.
- Misturar influencia Felixo/Felipe como heranca estetica/metodologica documentada, sem transferir autoria pessoal para o README principal ou guias tecnicos.
- Tratar o `AGENTS.md` de projetos destino como roteador leve de contexto: guia minimo sempre, documentos por tipo de tarefa e guias opcionais somente sob demanda.
- [2026-07-29] Modularidade vira documento proprio em `core/`, nao secao do `DESIGN_SYSTEM_ARQUITETURA.md`. Motivo: o tema tem regra suficiente para documento normativo (limites por tipo, criterio de quebra, proibicoes de nome, regras de correcao) e precisa ser roteavel por tarefa - quem vai refatorar deve abrir um documento sobre refatoracao, nao cacar uma subsecao dentro de arquitetura. Origem: regra redigida pelo autor no projeto `PrismaTest`, onde nasceu de um caso concreto (um `start_app.py` de 1716 linhas com seis responsabilidades). O angulo de custo de token/contexto e o que o acervo nao tinha - os documentos existentes tratavam tamanho de arquivo como questao de manutenibilidade humana.
- [2026-07-29] `utils/` permanece como pasta valida no acervo; o proibido e o arquivo `utils.*` generico. O `DESIGN_SYSTEM_ARQUITETURA.md` se contradizia: prescrevia a pasta na estrutura padrao (linhas de estrutura backend e frontend) e logo abaixo dizia "nao crie pasta `utils/` como lixeira". Conciliado em favor da pasta porque ela ja esta nas estruturas prescritas e em projetos existentes; mudar isso quebraria layout de repositorio sem ganho real. O problema sempre foi o arquivo sem nome descritivo, nao o diretorio.

## Pendencias

- Melhorar gradualmente qualquer guia novo importado.
- Seguir `docs/CURADORIA-DOS-GUIAS.md` para manter os guias opcionais como padroes Doktor revisados.
- Testar Bash/Zsh nativo no Linux, macOS ou WSL com `rsync` disponivel (Git Bash no Windows nao inclui `rsync` por padrao).

## Validacao recente (2026-06-23)

- Scripts de instalacao validados em ambiente real:
 - PowerShell: instalacao, `doktor -Help`, `doktor` em pasta temp (58 arquivos), segunda rodada ("ja atualizado"), desinstalacao e perfil limpo.
 - CMD: instalacao, `doktor` em pasta temp (58 arquivos), desinstalacao. CMD nao detecta "ja atualizado" (robocopy compara por timestamp, nao hash); comportamento esperado documentado.
 - Bash: sintaxe valida, instalacao e desinstalacao testadas no Git Bash (Windows) com rsync fake. Requer `rsync` em ambiente real.
- `doktor-command.cmd` corrigido: removida exibicao de caminhos completos da pasta temporaria no preview do robocopy; output usa exit code.
- Checklist de publicacao e `docs/VALIDACAO-SCRIPTS.md` atualizados com resultados reais.
- Repositorio publicado em `https://github.com/AndreGustavoms/Doktor-SystemDesign`, branch `main`, tag `v0.1.0`.
