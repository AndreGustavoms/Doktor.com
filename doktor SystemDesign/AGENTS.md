# AGENTS.md - Roteiro de Leitura para Agentes de IA

> **O que e**: O ponto de entrada para qualquer agente de IA (de modelos pequenos a grandes) que use o **Doktor System-Design** como padrao de qualidade - seja trabalhando neste repositorio, seja consumindo uma copia dele dentro de outro projeto.
>
> **Quando usar**: Leia este arquivo **primeiro**. Ele diz exatamente quais documentos abrir conforme a tarefa, para que voce nunca precise ler o repositorio inteiro.
>
> **Objetivo**: Direcionar a IA desde o inicio, preservar qualidade minima e reduzir gasto de contexto. Este arquivo e um roteador progressivo, nao um convite para ler tudo.
>
> Para humanos, o mapa completo esta no [README.md](README.md).
> Para navegacao detalhada, consulte [docs/INDICE-GERAL.md](docs/INDICE-GERAL.md).

---

## 1. Protocolo de leitura

1. **Leia sempre** [`core/GUIA_MINIMO_QUALIDADE.md`](core/GUIA_MINIMO_QUALIDADE.md) - o contrato curto de qualidade (menos de 100 linhas). Ele vale para qualquer entrega.
2. **Identifique o tipo de tarefa** e abra apenas os documentos indicados na secao 2. Como regra pratica, uma tarefa comum precisa de no maximo 1-2 documentos alem do guia minimo; mais que isso e sinal de que a tarefa deveria ser dividida ou de que voce esta lendo "por garantia".
3. **Consulte `guias/` somente sob demanda**: use a tabela da secao 3 para ver se a funcionalidade pedida ja tem um guia pronto. Se nao tiver, nao leia nenhum. **O crescimento do numero de guias neste acervo nao deve aumentar quanto voce le por tarefa** - cada guia novo e mais uma linha na tabela de busca por palavra-chave, nao mais um documento a abrir "para garantir". Abra no maximo 1 guia opcional por tarefa, salvo caso raro de funcionalidade que combine explicitamente dois padroes (ex.: tabela + formulario na mesma tela).
4. **Nao leia documentos "por garantia".** Cada arquivo deste repositorio so e necessario no cenario indicado abaixo. Para o raciocinio completo de quando isso vale a pena (nivel de tarefa vs. nivel de modelo, reaproveitamento de contexto ja registrado), veja [`core/DESIGN_SYSTEM_ECONOMIA_IA.md`](core/DESIGN_SYSTEM_ECONOMIA_IA.md).
5. **Antes de editar manualmente, procure automacao existente.** Se houver script, comando, instalador ou ferramenta reutilizavel para a mudanca, reutilize ou estenda esse caminho primeiro. Edicao manual fica como excecao justificada (ver [`core/GUIA_MINIMO_QUALIDADE.md`](core/GUIA_MINIMO_QUALIDADE.md), item 9).
6. **Ao levar o padrao para outro projeto**, copie [`templates/AGENTS-template.md`](templates/AGENTS-template.md) como `AGENTS.md` na raiz do projeto destino.

## 2. Roteiro por tipo de tarefa

| Se a tarefa e... | Leia (alem do guia minimo) | Apoio opcional |
|------------------|----------------------------|----------------|
| Construir ou alterar **frontend** | [`core/DESIGN_SYSTEM_FRONTEND.md`](core/DESIGN_SYSTEM_FRONTEND.md) | [`core/PROMPT_BASE_FRONTEND.md`](core/PROMPT_BASE_FRONTEND.md) (montar o prompt inicial) |
| Construir ou alterar **backend** | [`core/DESIGN_SYSTEM_BACKEND.md`](core/DESIGN_SYSTEM_BACKEND.md) | [`core/PROMPT_BASE_BACKEND.md`](core/PROMPT_BASE_BACKEND.md) (montar o prompt inicial) |
| Organizar **estrutura e responsabilidades** do codigo | [`core/DESIGN_SYSTEM_ARQUITETURA.md`](core/DESIGN_SYSTEM_ARQUITETURA.md) | - |
| Refatorar, **quebrar arquivo grande** ou decidir se algo vira modulo proprio | [`core/DESIGN_SYSTEM_MODULARIDADE.md`](core/DESIGN_SYSTEM_MODULARIDADE.md) | - |
| Aplicar **seguranca** (secrets, autenticacao, validacao, OWASP) | [`core/DESIGN_SYSTEM_SEGURANCA.md`](core/DESIGN_SYSTEM_SEGURANCA.md) | - |
| Projetar ou revisar **API REST** (contratos, status codes, versionamento) | [`core/DESIGN_SYSTEM_API_REST.md`](core/DESIGN_SYSTEM_API_REST.md) | [`core/DESIGN_SYSTEM_BACKEND.md`](core/DESIGN_SYSTEM_BACKEND.md) quando envolver regra de negocio |
| Escrever ou revisar **testes** (unitario, integracao, E2E, mocks) | [`core/DESIGN_SYSTEM_TESTES.md`](core/DESIGN_SYSTEM_TESTES.md) | - |
| Escolher ou justificar **stack/arquitetura** | [`docs/STACK-E-ARQUITETURA.md`](docs/STACK-E-ARQUITETURA.md) | [`docs/PADROES-OBSERVADOS-GITHUB.md`](docs/PADROES-OBSERVADOS-GITHUB.md) quando precisar alinhar com padroes publicos do autor |
| Escrever ou revisar **README / documentacao** | [`core/DESIGN_SYSTEM_README.md`](core/DESIGN_SYSTEM_README.md) | - |
| Aplicar este system design em **projeto novo** | [`docs/GUIA-RAPIDO-USO.md`](docs/GUIA-RAPIDO-USO.md) | [`templates/AGENTS-template.md`](templates/AGENTS-template.md) para orientar a IA no projeto destino; [`templates/`](templates/) para README, IA, deploy, seguranca e ADR |
| Criar **qualquer programa rodavel** (web, CLI, automacao, script...) | [`core/GUIA-START-APP-SCRIPT.md`](core/GUIA-START-APP-SCRIPT.md) - todo programa exige um `start_app.py` na raiz com menu interativo (porta de entrada) | - |
| Registrar **contexto/memoria do projeto** | [`core/TEMPLATE-CONTEXTO-IA.md`](core/TEMPLATE-CONTEXTO-IA.md) - copie o template e preencha continuamente | - |
| Decidir **qual nivel de IA usar** ou reduzir gasto de contexto/tokens | [`core/DESIGN_SYSTEM_ECONOMIA_IA.md`](core/DESIGN_SYSTEM_ECONOMIA_IA.md) | - |
| Validar **projeto pronto** | [`docs/CHECKLIST-PROJETO-PRONTO.md`](docs/CHECKLIST-PROJETO-PRONTO.md) | [`scripts/validate-repo.ps1`](scripts/validate-repo.ps1), quando estiver validando este repo |
| **Versionar mudancas neste repositorio** | [`docs/GIT-POLITICA-DE-VERSIONAMENTO.md`](docs/GIT-POLITICA-DE-VERSIONAMENTO.md) - direto no `main` por padrao; commits `tipo: descricao`; doc viva no mesmo commit | [CONTRIBUTING.md](CONTRIBUTING.md) (se for via fork) |
| Preparar **publicacao/divulgacao** do repositorio | [`docs/CHECKLIST-PUBLICACAO.md`](docs/CHECKLIST-PUBLICACAO.md) | [`docs/DECISOES-DE-IDENTIDADE.md`](docs/DECISOES-DE-IDENTIDADE.md) |
| **Baixar/sincronizar** este repo em outro projeto | [`docs/INSTALACAO-EM-OUTROS-PROJETOS.md`](docs/INSTALACAO-EM-OUTROS-PROJETOS.md) - metodos por clone, ZIP, sparse checkout e scripts | - |
| **Manter os padroes atualizados** (stack, guias, sincronizar com origem) | [`docs/POLITICA-DE-ATUALIZACAO.md`](docs/POLITICA-DE-ATUALIZACAO.md) | - |
| Funcionalidade especifica (arvore, heatmap, deploy...) | o guia correspondente na tabela abaixo | [`docs/GUIAS-OPCIONAIS.md`](docs/GUIAS-OPCIONAIS.md) (descricoes completas) |

## 3. Indice de guias opcionais

Use um guia **somente** quando a tarefa pedir aquela funcionalidade. As palavras-chave servem para casar com o prompt do usuario.

| Guia | O que resolve | Palavras-chave |
|------|---------------|----------------|
| [`guias/frontend/GUIA-ARVORE-HIERARQUICA.md`](guias/frontend/GUIA-ARVORE-HIERARQUICA.md) | Arvore de categorias parent-child (Django self-FK + React recursivo) | arvore, categorias, pastas, menu aninhado, file explorer |
| [`guias/frontend/GUIA-ARVORE-DE-MATERIAIS-DUAL-VIEW.md`](guias/frontend/GUIA-ARVORE-DE-MATERIAIS-DUAL-VIEW.md) | Arvore de materiais com 2 modos de visualizacao e progresso em localStorage | materiais, documentos, lista de leitura, progresso, visto/nao visto |
| [`guias/frontend/GUIA-BACKGROUND-VISUAL.md`](guias/frontend/GUIA-BACKGROUND-VISUAL.md) | Background em camadas com gradiente, simbolos animados e troca de tema | fundo, gradiente, tema claro/escuro, ambientacao |
| [`guias/frontend/GUIA-PARTICULAS-E-GLOW.md`](guias/frontend/GUIA-PARTICULAS-E-GLOW.md) | Particulas flutuantes (Framer Motion) + sistema de glow CSS com niveis | particulas, glow, neon, dark theme, landing page |
| [`guias/frontend/GUIA-HEATMAP-DE-ATIVIDADE.md`](guias/frontend/GUIA-HEATMAP-DE-ATIVIDADE.md) | Calendario de atividade com intensidade visual estilo GitHub | heatmap, streak, habito, atividade diaria, contribuicoes |
| [`guias/frontend/GUIA-CALENDARIO-ACADEMICO.md`](guias/frontend/GUIA-CALENDARIO-ACADEMICO.md) | Calendario mensal interativo com eventos agrupados por data | calendario, eventos, agenda, entregas, utilitarios de data |
| [`guias/frontend/GUIA-SISTEMA-DE-ALERTA-E-GRADE.md`](guias/frontend/GUIA-SISTEMA-DE-ALERTA-E-GRADE.md) | Alerta automatico de proxima aula + grade semanal de horarios | horarios, grade, aulas, alerta, tabela semanal |
| [`guias/frontend/GUIA-ONBOARDING-E-AJUDA.md`](guias/frontend/GUIA-ONBOARDING-E-AJUDA.md) | Onboarding de primeira visita + centro de ajuda permanente | onboarding, tooltip, ajuda, tutorial, primeira visita |
| [`guias/frontend/GUIA-COMPONENTES-UI-COMPOSTOS.md`](guias/frontend/GUIA-COMPONENTES-UI-COMPOSTOS.md) | Kit base Card/Button/Badge em TypeScript + Tailwind, zero dependencias | componentes base, card, button, badge, design kit |
| [`guias/frontend/GUIA-BREADCRUMB-E-METADATA-BAR.md`](guias/frontend/GUIA-BREADCRUMB-E-METADATA-BAR.md) | Breadcrumb tecnico, copiar caminho e metadata bar | breadcrumb, path, copiar, metadata, arquivo, repositorio |
| [`guias/frontend/GUIA-PAINEL-DE-COLECAO-COM-FILTROS-E-VIEWS.md`](guias/frontend/GUIA-PAINEL-DE-COLECAO-COM-FILTROS-E-VIEWS.md) | Painel de listagem com busca, filtros, ordenacao e views grid/lista/kanban (client-side) | dashboard, painel, filtros, kanban, view grid/lista, ordenacao |
| [`guias/frontend/GUIA-FORMULARIOS-COMPLEXOS.md`](guias/frontend/GUIA-FORMULARIOS-COMPLEXOS.md) | Formularios com validacao cruzada, campos condicionais e wizard multi-step | formulario, validacao, wizard, etapas, campo condicional, react-hook-form |
| [`guias/frontend/GUIA-TABELA-DE-DADOS-SERVER-SIDE.md`](guias/frontend/GUIA-TABELA-DE-DADOS-SERVER-SIDE.md) | Tabela com paginacao, ordenacao e filtro no servidor para grandes volumes | tabela, paginacao server-side, grid, listagem grande, react-query |
| [`guias/frontend/GUIA-BIBLIOTECA-DE-ACABAMENTO-PREMIUM.md`](guias/frontend/GUIA-BIBLIOTECA-DE-ACABAMENTO-PREMIUM.md) | Acabamento premium em navbar, logo, botao, card, link e scrollbar; modo operacional vs modo marca | acabamento, premium, shimmer, hover, microinteracao, navbar scroll, scrollbar customizada, easing |
| [`guias/frontend/GUIA-EFEITOS-DE-CENA-E-AMBIENTE.md`](guias/frontend/GUIA-EFEITOS-DE-CENA-E-AMBIENTE.md) | Camadas de cena para secao heroi: aurora, cintilancia, meteoro, sheen, contra-rotacao e orcamento de custo | cena, ambiente, aurora, meteoro, cintilancia, camadas, secao heroi, atmosfera |
| [`guias/frontend/GUIA-INTERFACE-TECNICA-E-GLITCH.md`](guias/frontend/GUIA-INTERFACE-TECNICA-E-GLITCH.md) | Linguagem tecnica: boot, glitch de estabilizacao, cursor, datilografia, HUD, shockwave e esteira | glitch, terminal, hud, cursor, datilografia, boot, varredura, esteira, telemetria |
| [`guias/backend/GUIA-BACKEND-CPF.md`](guias/backend/GUIA-BACKEND-CPF.md) | Geracao, validacao e normalizacao de CPF com testes e guardrails | cpf, validacao de documento, digito verificador, dados sinteticos |
| [`guias/backend/GUIA-CRIPTOGRAFIA-CIFRA-DE-CESAR.md`](guias/backend/GUIA-CRIPTOGRAFIA-CIFRA-DE-CESAR.md) | Cifra de Cesar tradicional e numerica + normalizacao de acentos + web (Brython) | criptografia, cifra, encode/decode, educacional |
| [`guias/backend/GUIA-AUTENTICACAO-JWT-OAUTH.md`](guias/backend/GUIA-AUTENTICACAO-JWT-OAUTH.md) | Autenticacao JWT (access/refresh token) e login social OAuth2/OIDC | jwt, oauth, login social, autenticacao, refresh token, authz |
| [`guias/backend/GUIA-FILAS-E-JOBS-ASSINCRONOS.md`](guias/backend/GUIA-FILAS-E-JOBS-ASSINCRONOS.md) | Jobs assincronos e agendados com fila, idempotencia e retry | fila, celery, worker, job assincrono, cron, agendamento |
| [`guias/backend/GUIA-CACHE-COM-REDIS.md`](guias/backend/GUIA-CACHE-COM-REDIS.md) | Cache-aside com Redis, invalidacao, sessao compartilhada e rate limiting | cache, redis, invalidacao, sessao compartilhada, rate limit |
| [`guias/integracao/GUIA-INTEGRACAO-API-GITHUB.md`](guias/integracao/GUIA-INTEGRACAO-API-GITHUB.md) | Coleta de repositorios GitHub com token, paginacao, retry e limite da API | github api, importar repositorios, portfolio, limite de api externa |
| [`guias/integracao/GUIA-SCRAPING-MULTIFORMATO.md`](guias/integracao/GUIA-SCRAPING-MULTIFORMATO.md) | Pipelines de scraping com Playwright, parsers offline e persistencia auditavel | scraping, playwright, crawler, etl, coleta de dados |
| [`guias/integracao/GUIA-DEPLOY-RAILWAY.md`](guias/integracao/GUIA-DEPLOY-RAILWAY.md) | Deploy de backend no Railway (PaaS): build, banco, HTTPS, logs | deploy, hospedagem, producao, railway, backend online |
| [`guias/integracao/GUIA-NOTION-COMO-BASE-DE-DADOS.md`](guias/integracao/GUIA-NOTION-COMO-BASE-DE-DADOS.md) | Migrar planilhas/documentos para databases tipadas do Notion | notion, migracao, planilha, database, importacao |
| [`guias/integracao/GUIA-INTEGRACAO-LLM-E-AGENTES.md`](guias/integracao/GUIA-INTEGRACAO-LLM-E-AGENTES.md) | Integracao com LLM: cliente isolado, prompt versionado, tool use, RAG basico | llm, ia, prompt, agente, tool use, rag, chatbot |
| [`guias/integracao/GUIA-CLAUDE-MODELOS-E-CUSTO.md`](guias/integracao/GUIA-CLAUDE-MODELOS-E-CUSTO.md) | Claude na pratica: escolher Sonnet/Opus/Haiku por tarefa e reduzir custo (cache, batch, effort) | claude, anthropic, sonnet, opus, haiku, prompt caching, batch api, custo de token |
| [`guias/integracao/GUIA-CI-CD-BASICO.md`](guias/integracao/GUIA-CI-CD-BASICO.md) | Pipeline de CI/CD: lint/teste automatico, cache, deploy condicionado | ci, cd, pipeline, github actions, deploy automatico |
| [`guias/integracao/GUIA-OBSERVABILIDADE-LOGS-E-HEALTHCHECKS.md`](guias/integracao/GUIA-OBSERVABILIDADE-LOGS-E-HEALTHCHECKS.md) | Logs estruturados, health check e metricas minimas de producao | logs, observabilidade, health check, monitoramento, metricas |

## 4. Regras deste repositorio (resumo)

Valem para agentes alterando **este** repositorio; a fonte completa e [`docs/GIT-POLITICA-DE-VERSIONAMENTO.md`](docs/GIT-POLITICA-DE-VERSIONAMENTO.md).

- **Git**: commite direto no `main` por padrao; branch **so** para feature grande, refatoracao significativa ou alto risco. Commits no formato `tipo(escopo): descricao no imperativo` - tipos validos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`. Cada commit e uma unidade coesa e separada - nao misture temas diferentes num commit so. Um hook nativo em `scripts/hooks/commit-msg` rejeita mensagens fora do padrao. Branch mesclada deve ser apagada (local e remota) - nao deixe branch morta para tras.
- **Sincronizacao com o remoto**: `git pull` antes de comecar a commitar; `git push` automatico ao final da leva de commits, sem esperar confirmacao manual (excecoes: force-push, conflito de merge, ou commit tocando segredo - esses sempre exigem confirmacao explicita). Detalhes em [`docs/GIT-POLITICA-DE-VERSIONAMENTO.md`](docs/GIT-POLITICA-DE-VERSIONAMENTO.md), secao 3.
- **Documentacao viva**: ao mudar comportamento, estrutura ou comandos, atualize README, `docs/`, guias e `IA.md` afetados **no mesmo commit**.
- **`IA.md` e linha do tempo**: nao apague registros antigos ao mudar uma decisao tecnica. Adicione um novo registro datado explicando a mudanca, o motivo e a validacao, preservando o raciocinio anterior.
- **Automacao antes de ajuste manual** (com qualidade): ao mexer em codigo ou dados, procure scripts, comandos e ferramentas reutilizaveis primeiro; so faca alteracao manual quando isso for claramente mais pragmatico, e registre a excecao. Scripts e automacoes sao codigo: organizem-se em pasta apropriada (nao na raiz), seguem responsabilidade separada, tratamento de erros, sem hardcodes, com documentacao.
- **Linguagem**: escrita open source - acessivel a qualquer leitor, sem valores hardcoded, caminhos locais ou contexto privado (referencia: [`core/DESIGN_SYSTEM_README.md`](core/DESIGN_SYSTEM_README.md), secao 3.5).

## 5. O que este repositorio nao e

- **Nao e codigo de producao** - e documentacao de padroes; o unico codigo executavel sao os instaladores em [`scripts/`](scripts/).
- **Identidade parcialmente definida** - nome, autoria e comando global ja foram decididos; consulte [`docs/DECISOES-DE-IDENTIDADE.md`](docs/DECISOES-DE-IDENTIDADE.md) antes de tratar a stack como preferencia pessoal publica.
- **Nao e checklist cego** - o valor esta em abrir so o necessario, manter `IA.md` atualizado e validar o que foi entregue.
