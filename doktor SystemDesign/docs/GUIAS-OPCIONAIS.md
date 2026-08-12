# Guias - Padroes Especificos

A pasta [`guias/`](../guias/) contem **padroes reutilizaveis por dominio**, organizados para consulta sob demanda. Diferente do `core/`, estes arquivos sao **opcionais** - use apenas quando o projeto precisar daquela funcionalidade.

> Voltar ao [README](../README.md). Agentes de IA: o indice compacto destes guias, com palavras-chave para casar com o prompt, esta em [`AGENTS.md`](../AGENTS.md).

Cada guia responde a tres perguntas:

- Qual problema ele resolve
- Quando usar e quando nao usar
- Em que tipo de sistema vale reutiliza-lo

## Frontend

### Arvore Hierarquica

Padrao de **exploracao hierarquica** para categorias, pastas, areas, topicos ou menus, com componente React recursivo e opcao de backend parent-child.

**Quando usar:** explorador de categorias/pastas, menus hierarquicos, qualquer dado em arvore parent-child.

[Ver guia](../guias/frontend/GUIA-ARVORE-HIERARQUICA.md)

### Background Visual

Padrao de **background visual em camadas** com gradiente, simbolos animados e troca de tema.

**Quando usar:** calculadoras, paginas educacionais, dashboards tecnicos, interfaces com profundidade visual.

[Ver guia](../guias/frontend/GUIA-BACKGROUND-VISUAL.md)

### Heatmap de Atividade

Padrao de **calendario de atividade com intensidade visual** no estilo GitHub.

**Quando usar:** visualizacao de atividade por dia/semana/mes, dashboards de uso, analise temporal.

[Ver guia](../guias/frontend/GUIA-HEATMAP-DE-ATIVIDADE.md)

### Onboarding e Ajuda

Padrao de **primeira experiencia do usuario** com onboarding leve, destaque contextual e centro de ajuda permanente.

**Quando usar:** produtos com multiplas funcionalidades, interfaces com curva de aprendizado, dashboards.

[Ver guia](../guias/frontend/GUIA-ONBOARDING-E-AJUDA.md)

### Componentes UI Compostos

Kit de **componentes UI compostos** com Card, Button, Badge e utilitario de classnames. TypeScript + Tailwind, leve e facil de transportar entre projetos.

**Quando usar:** qualquer projeto React + Tailwind que precise de componentes base consistentes.

[Ver guia](../guias/frontend/GUIA-COMPONENTES-UI-COMPOSTOS.md)

### Breadcrumb e Metadata Bar

Padrao de **cabecalho tecnico utilitario** com caminho navegavel, botao de copiar e linha de metadata/ultima atividade.

**Quando usar:** telas de arquivo, repositorio, documento, dataset, modulo, pipeline ou qualquer estrutura com caminho tecnico.

[Ver guia](../guias/frontend/GUIA-BREADCRUMB-E-METADATA-BAR.md)

### Particulas e Sistema de Glow

**Background de particulas flutuantes** com Framer Motion e **sistema completo de glow CSS** com 5 niveis de intensidade controlados por CSS variable.

**Quando usar:** landing pages, portfolios, dashboards dark-theme, interfaces com efeitos de glow.

[Ver guia](../guias/frontend/GUIA-PARTICULAS-E-GLOW.md)

### Biblioteca de Acabamento Premium

**Catalogo de acabamentos** para os elementos presentes em todo projeto web (navbar, logo, botao, card, link, scrollbar), com a distincao entre **modo operacional** e **modo marca**.

**Quando usar:** produto com marca propria, landing page, catalogo, checkout, login - telas em que a identidade visual e argumento comercial.

[Ver guia](../guias/frontend/GUIA-BIBLIOTECA-DE-ACABAMENTO-PREMIUM.md)

### Efeitos de Cena e Ambiente

**Camadas de cena** para secoes de destaque: aurora, cintilancia, meteoro, sheen em card, contra-rotacao e orbita de CTA, com orcamento explicito de custo visual.

**Quando usar:** secao heroi de landing, pagina de lancamento, campanha, login de produto premium. Segundo volume do acabamento premium.

[Ver guia](../guias/frontend/GUIA-EFEITOS-DE-CENA-E-AMBIENTE.md)

### Interface Tecnica e Glitch

**Linguagem visual de sistema**: boot com blur, glitch de estabilizacao, cursor e datilografia, varredura de sinal, anel de HUD, shockwave e esteira infinita.

**Quando usar:** produto tecnico, ferramenta de desenvolvedor, gamificacao, painel de dados ao vivo. Terceiro volume do acabamento visual.

[Ver guia](../guias/frontend/GUIA-INTERFACE-TECNICA-E-GLITCH.md)

### Arvore de Materiais Dual-View

**Arvore de materiais com dois modos de visualizacao** (simples e dinamico), tracking de itens vistos via localStorage e contagem de progresso por pasta.

**Quando usar:** bibliotecas de materiais, exploradores de documentos, listas de leitura com progresso.

[Ver guia](../guias/frontend/GUIA-ARVORE-DE-MATERIAIS-DUAL-VIEW.md)

### Calendario Academico

**Calendario mensal interativo** com grade de dias, agrupamento de eventos por data, status do usuario e 11 funcoes de data sem dependencias externas.

**Quando usar:** dashboards academicos, calendarios de entregas, agendas de projeto.

[Ver guia](../guias/frontend/GUIA-CALENDARIO-ACADEMICO.md)

### Sistema de Alerta e Grade de Horarios

**Sistema de alerta automatico de proximo evento** com parser de grade, cores por local/tipo e tabela semanal com coluna sticky.

**Quando usar:** paineis academicos, agendas de time, turnos, reunioes recorrentes e apps de horarios.

[Ver guia](../guias/frontend/GUIA-SISTEMA-DE-ALERTA-E-GRADE.md)

### Painel de Colecao com Filtros e Views

**Painel de listagem** com busca, filtros combinaveis, ordenacao, multiplos modos de visualizacao (grade/lista/kanban), colunas ajustaveis e reordenacao por arrastar, tudo persistido em `localStorage`.

**Quando usar:** listas grandes de itens homogeneos (projetos, produtos, tarefas, artigos) que precisam de filtro, ordenacao e visualizacao configuraveis, quando os dados cabem no cliente.

[Ver guia](../guias/frontend/GUIA-PAINEL-DE-COLECAO-COM-FILTROS-E-VIEWS.md)

### Formularios Complexos

**Formularios com validacao cruzada**, campos condicionais e submissao em etapas (wizard), usando `react-hook-form` + schema de validacao.

**Quando usar:** cadastros com mais de ~4 campos, validacao entre campos (confirmar senha, datas relacionadas), ou fluxo de multiplas etapas.

[Ver guia](../guias/frontend/GUIA-FORMULARIOS-COMPLEXOS.md)

### Tabela de Dados Server-Side

**Tabela com paginacao, ordenacao e filtro processados no servidor**, estado sincronizado com a URL e busca com debounce.

**Quando usar:** listagens com milhares de linhas ou mais, onde carregar tudo no cliente nao e viavel.

[Ver guia](../guias/frontend/GUIA-TABELA-DE-DADOS-SERVER-SIDE.md)

## Backend

### Backend CPF

Padrao de **backend logico para CPF** com algoritmo, contratos, fluxo de validacao, matriz de testes e guardrails para dados reais.

**Quando usar:** geracao sintetica de CPF para testes, validacao backend, normalizacao de entrada, formularios.

[Ver guia](../guias/backend/GUIA-BACKEND-CPF.md)

### Criptografia Cifra de Cesar

Sistemas reutilizaveis da **Cifra de Cesar em Python**: cifra tradicional, cifra numerica, normalizacao de acentos e interface web com Brython.

**Quando usar:** apps educacionais de criptografia, playgrounds web, utilitarios de encode/decode.

[Ver guia](../guias/backend/GUIA-CRIPTOGRAFIA-CIFRA-DE-CESAR.md)

### Autenticacao JWT e OAuth

**Autenticacao stateless com JWT** (access/refresh token, revogacao) e **login social via OAuth2/OpenID Connect**, com checklist contra IDOR e vazamento de sessao.

**Quando usar:** API que precisa autenticar via token para consumo mobile/SPA, ou login por Google/GitHub/Microsoft.

[Ver guia](../guias/backend/GUIA-AUTENTICACAO-JWT-OAUTH.md)

### Filas e Jobs Assincronos

**Processamento assincrono** (Celery + Redis como exemplo) com idempotencia, retry com backoff e jobs agendados com garantia de execucao unica.

**Quando usar:** operacao lenta demais para o ciclo de request-response, ou tarefa que precisa rodar em horario agendado.

[Ver guia](../guias/backend/GUIA-FILAS-E-JOBS-ASSINCRONOS.md)

### Cache com Redis

**Cache-aside com TTL explicito**, invalidacao no fluxo de escrita, fallback quando o Redis cai, sessao compartilhada e rate limiting.

**Quando usar:** consulta/calculo caro e repetido, ou sessao compartilhada entre multiplos processos/workers.

[Ver guia](../guias/backend/GUIA-CACHE-COM-REDIS.md)

## Integracao

### Integracao API GitHub

Padrao de **coleta robusta de repositorios no GitHub** com autenticacao por token, paginacao, deduplicacao, retry com backoff e tratamento de rate limit.

**Quando usar:** importadores de portfolio, dashboards de projetos, sincronizadores, ETLs de inventario tecnico.

[Ver guia](../guias/integracao/GUIA-INTEGRACAO-API-GITHUB.md)

### Scraping Multiformato

Padrao de **scraping multiformato** com Playwright, parsers offline, JSON embutido, captura manual assistida, persistencia idempotente, URL publica segura, testes e guardrails operacionais.

**Quando usar:** coletores, catalogos, ETLs, comparadores, importadores e pipelines que precisam transformar paginas heterogeneas em dados estruturados auditaveis.

[Ver guia](../guias/integracao/GUIA-SCRAPING-MULTIFORMATO.md)

### Deploy Railway (backend padrao online)

**Servico padrao para colocar backend online**. Railway (PaaS) faz build, deploy, banco gerenciado, variaveis de ambiente, dominio HTTPS e logs sem gerenciar servidor. Inclui fluxo de CLI, conceitos, deploy por Git ou `railway up`, bancos, variaveis e checklist.

**Quando usar:** APIs REST, back-ends de apps, workers, bots, scrapers agendados e qualquer servico que precise ficar online com URL publica e HTTPS.

> **Aviso:** se login/autorizacao falhar repetidamente, o guia instrui o agente a parar e acionar o operador humano com passo a passo claro, em vez de insistir em loop.

[Ver guia](../guias/integracao/GUIA-DEPLOY-RAILWAY.md)

### Notion como Base de Dados

Padrao de **migracao de planilhas/documentos para databases estruturadas do Notion**, com schema tipado, cliente resiliente com retry, importacao idempotente/retomavel, anexos e reorganizacao programatica do workspace.

**Quando usar:** importar planilhas de controle, migrar documentos de um Drive, montar catalogos/inventarios, consolidar dados espalhados em bases navegaveis.

[Ver guia](../guias/integracao/GUIA-NOTION-COMO-BASE-DE-DADOS.md)

### Integracao LLM e Agentes

**Cliente isolado para LLM**, prompt versionado, saida estruturada e validada, tool use com limite de iteracoes e RAG basico com chunking e citacao de fonte.

**Quando usar:** integrar chamada de modelo de linguagem para gerar, classificar, extrair ou orquestrar ferramentas.

[Ver guia](../guias/integracao/GUIA-INTEGRACAO-LLM-E-AGENTES.md)

### Claude: Modelos e Custo

**Camada especifica de Claude**: como escolher entre Sonnet, Opus e Haiku por
tarefa e como reduzir custo com prompt caching, Batch API, effort proporcional
e streaming. Complementa o guia de integracao LLM (generico) e o design system
de economia de IA (provider-neutro).

**Quando usar:** o projeto chama a API da Anthropic e voce quer gastar menos sem
perder qualidade.

[Ver guia](../guias/integracao/GUIA-CLAUDE-MODELOS-E-CUSTO.md)

### CI/CD Basico

**Pipeline de integracao continua** (GitHub Actions como exemplo): lint e testes automaticos em todo push/PR, cache de dependencias, segredos protegidos e deploy condicionado ao sucesso dos testes.

**Quando usar:** projeto com testes automatizados e mais de uma pessoa/agente contribuindo.

[Ver guia](../guias/integracao/GUIA-CI-CD-BASICO.md)

### Observabilidade: Logs e Health Checks

**Logs estruturados** com correlacao por requisicao, **health check** que verifica dependencias reais (banco, cache) e metricas minimas de erro/latencia.

**Quando usar:** sistema em producao onde alguem precisa depurar um erro sem acesso ao ambiente rodando ao vivo.

[Ver guia](../guias/integracao/GUIA-OBSERVABILIDADE-LOGS-E-HEALTHCHECKS.md)
