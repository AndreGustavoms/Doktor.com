# Curadoria dos Guias Importados

Este documento define como revisar e evoluir os guias importados sem perder o valor tecnico original e sem manter marcas pessoais herdadas.

## Objetivo

Transformar os guias em material proprio do Doktor System-Design, com linguagem consistente, exemplos genericos, atribuicao legal centralizada e utilidade pratica para projetos reais.

## Estado atual

- **Curadoria concluida**: todos os guias listados na tabela de progresso abaixo estao marcados "Revisado" - nao ha guia pendente de primeira revisao.
- Os guias importados foram normalizados para ASCII; assinaturas pessoais foram removidas do corpo dos arquivos.
- Atribuicao legal ficou em `NOTICE.md` e `LICENSE`.
- Guias novos (nao vindos da origem) seguem a mesma estrutura desde a criacao - nao passam por uma fase separada de "curadoria", ja nascem no padrao.
- O que muda agora e **manutencao continua**: revisar um guia de novo so quando ele ficar desatualizado tecnicamente (ver `docs/POLITICA-DE-ATUALIZACAO.md`) ou quando um guia novo for adicionado e precisar seguir o mesmo padrao de estrutura e referencias cruzadas com guias relacionados.

## Prioridade de revisao (historico - usado durante a curadoria inicial)

Esta tabela documenta a ordem em que os guias foram revisados na primeira leva de curadoria. Como o processo ja terminou (ver tabela de progresso abaixo), ela serve como registro historico da decisao, nao como fila de trabalho pendente.

| Prioridade original | Guias | Motivo |
|------------|-------|--------|
| Alta | `core/GUIA_MINIMO_QUALIDADE.md`, `core/DESIGN_SYSTEM_BACKEND.md`, `core/DESIGN_SYSTEM_FRONTEND.md`, `docs/STACK-E-ARQUITETURA.md` | Sao lidos com mais frequencia e definem padroes gerais. |
| Media | `core/PROMPT_BASE_BACKEND.md`, `core/PROMPT_BASE_FRONTEND.md`, `core/DESIGN_SYSTEM_README.md`, `core/GUIA-START-APP-SCRIPT.md` | Afetam execucao assistida por IA e experiencia de projeto. |
| Media | `guias/integracao/GUIA-DEPLOY-RAILWAY.md`, `guias/integracao/GUIA-SCRAPING-MULTIFORMATO.md`, `guias/integracao/GUIA-INTEGRACAO-API-GITHUB.md` | Tem impacto operacional e risco maior quando usados incorretamente. |
| Baixa | Guias visuais especificos em `guias/frontend/` | Uteis como referencia, mas usados sob demanda. |
| Baixa | Guias educacionais/backend pontuais | Bons exemplos, mas menos centrais para o repositorio. |

## Checklist por guia

Ao revisar um guia, confirme:

- [ ] O titulo descreve o padrao, nao o projeto de onde veio.
- [ ] O texto usa linguagem geral e aplicavel a qualquer projeto.
- [ ] Exemplos usam placeholders genericos.
- [ ] Nao ha autor, assinatura, link pessoal ou projeto pessoal no corpo do guia.
- [ ] O guia explica quando usar e quando nao usar.
- [ ] O guia inclui riscos, limites e criterios de validacao.
- [ ] O guia termina com `## Ideias para quem quiser contribuir` (convite a contribuicao, nao "features futuras a implementar" - ver `core/GUIA_MINIMO_QUALIDADE.md`, item 8).
- [ ] Referencias cruzadas com guias relacionados existem quando fizer sentido tecnico (ex.: um guia que usa Redis para lock aponta para o guia de cache com Redis, e vice-versa).
- [ ] Links relativos funcionam.
- [ ] O arquivo permanece ASCII, salvo decisao contraria.

## Padrao de abertura recomendado

Cada guia revisado deve comecar com:

```text
# Nome do Guia

## Quando usar

...

## Quando nao usar

...

## Resultado esperado

...
```

## Como registrar progresso

Atualize esta tabela conforme os guias forem revisados.

| Arquivo | Status | Observacao |
|---------|--------|------------|
| `core/GUIA_MINIMO_QUALIDADE.md` | Revisado | Estrutura clara, links relativos validos e conteudo alinhado ao repositorio. |
| `docs/STACK-E-ARQUITETURA.md` | Revisado | Baseline tecnica criada, integrada no README, AGENTS e indice core. |
| `core/DESIGN_SYSTEM_BACKEND.md` | Revisado | Reescrito e alinhado com `docs/STACK-E-ARQUITETURA.md`. |
| `core/DESIGN_SYSTEM_FRONTEND.md` | Revisado | Reescrito como padrao geral de frontend, sem identidade visual herdada. |
| `core/DESIGN_SYSTEM_README.md` | Revisado | Reescrito como padrao neutro e pratico para READMEs. |
| `core/PROMPT_BASE_BACKEND.md` | Revisado | Reescrito com prompt curto, completo, checklist e anti-padroes. |
| `core/PROMPT_BASE_FRONTEND.md` | Revisado | Reescrito com prompt curto, completo, checklist e anti-padroes. |
| `core/GUIA-START-APP-SCRIPT.md` | Revisado | Estrutura e template mantidos; links e ASCII validados. |
| `guias/integracao/GUIA-DEPLOY-RAILWAY.md` | Revisado | Reescrito no padrao Doktor, com comandos conferidos na documentacao oficial do Railway. |
| `guias/integracao/GUIA-SCRAPING-MULTIFORMATO.md` | Revisado | Abertura padronizada; guardrails, limites, testes e criterios de pronto preservados. |
| `guias/integracao/GUIA-INTEGRACAO-API-GITHUB.md` | Revisado | Reescrito no padrao Doktor, sem origem de projeto especifico e com escopos/rate limit alinhados a documentacao oficial do GitHub. |
| `guias/frontend/GUIA-BACKGROUND-VISUAL.md` | Revisado | Reescrito como padrao generico de background em camadas, sem blocos quebrados. |
| `guias/frontend/GUIA-CALENDARIO-ACADEMICO.md` | Revisado | Reescrito como padrao generico de calendario mensal, sem blocos quebrados. |
| `guias/frontend/GUIA-PARTICULAS-E-GLOW.md` | Revisado | Reescrito como padrao generico de particulas e glow, sem blocos quebrados. |
| `guias/frontend/GUIA-COMPONENTES-UI-COMPOSTOS.md` | Revisado | Reescrito como kit proprio e compacto de UI, alinhado ao estilo operacional observado. |
| `guias/frontend/GUIA-BREADCRUMB-E-METADATA-BAR.md` | Revisado | Criado a partir de elementos utilitarios observados: caminho navegavel, copiar e metadata bar. |
| `guias/frontend/GUIA-ARVORE-HIERARQUICA.md` | Revisado | Reescrito como padrao generico de arvore parent-child, sem referencia a projeto especifico. |
| `guias/frontend/GUIA-ARVORE-DE-MATERIAIS-DUAL-VIEW.md` | Revisado | Reescrito como explorador de materiais com progresso e dois modos de visualizacao. |
| `guias/frontend/GUIA-HEATMAP-DE-ATIVIDADE.md` | Revisado | Reescrito como calendario de intensidade generico, sem dependencia de produto especifico. |
| `guias/frontend/GUIA-ONBOARDING-E-AJUDA.md` | Revisado | Reescrito como onboarding curto e central de ajuda declarativa. |
| `guias/frontend/GUIA-SISTEMA-DE-ALERTA-E-GRADE.md` | Revisado | Reescrito como agenda semanal generica com alerta de proximo evento. |
| `guias/backend/GUIA-BACKEND-CPF.md` | Revisado | Reescrito como guia backend generico, com contratos, testes e guardrails de dados pessoais. |
| `guias/backend/GUIA-CRIPTOGRAFIA-CIFRA-DE-CESAR.md` | Revisado | Reescrito como guia educacional de cifra, com aviso claro de nao uso para seguranca real. |
| `guias/frontend/GUIA-PAINEL-DE-COLECAO-COM-FILTROS-E-VIEWS.md` | Revisado | Portado do repositorio de origem via comparacao direta; reescrito no padrao Doktor sem referencia a projeto especifico. |
| `guias/integracao/GUIA-NOTION-COMO-BASE-DE-DADOS.md` | Revisado | Portado do repositorio de origem via comparacao direta; reescrito no padrao Doktor, sem nomes de clientes/projetos de terceiros. |
| `guias/integracao/GUIA-INTEGRACAO-LLM-E-AGENTES.md` | Revisado | Guia novo (nao vem da origem): integracao com LLM, prompt versionado, tool use, RAG basico, sem prender a provedor especifico. |
| `guias/backend/GUIA-AUTENTICACAO-JWT-OAUTH.md` | Revisado | Guia novo: JWT com refresh/revogacao, autorizacao por objeto (IDOR), OAuth2/OIDC via biblioteca madura. |
| `guias/backend/GUIA-FILAS-E-JOBS-ASSINCRONOS.md` | Revisado | Guia novo: idempotencia, retry com backoff, execucao unica de job agendado. |
| `guias/backend/GUIA-CACHE-COM-REDIS.md` | Revisado | Guia novo: cache-aside, TTL explicito, invalidacao, fallback de falha do Redis. |
| `guias/frontend/GUIA-FORMULARIOS-COMPLEXOS.md` | Revisado | Guia novo: validacao cruzada, campos condicionais, wizard, acessibilidade de formulario. |
| `guias/frontend/GUIA-TABELA-DE-DADOS-SERVER-SIDE.md` | Revisado | Guia novo: paginacao/ordenacao/filtro server-side, estado sincronizado com URL, debounce. |
| `guias/integracao/GUIA-CI-CD-BASICO.md` | Revisado | Guia novo: pipeline de CI com GitHub Actions, cache, segredos, deploy condicionado. |
| `guias/integracao/GUIA-OBSERVABILIDADE-LOGS-E-HEALTHCHECKS.md` | Revisado | Guia novo: logs estruturados, correlacao por request ID, health check com dependencias reais. |

## Regra de ouro

Um guia so deve virar "padrao Doktor" quando uma pessoa conseguir aplicar a recomendacao sem conhecer o projeto original de onde ela veio.
