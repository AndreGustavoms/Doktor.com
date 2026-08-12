# Core - Padroes Obrigatorios

A pasta [`core/`](../core/) concentra os artefatos que devem acompanhar **todo projeto**. Ela separa padroes tecnicos de qualidade, prompts operacionais para IA e template de memoria operacional.

> Voltar ao [README](../README.md).

Para projetos destino, copie tambem [`templates/AGENTS-template.md`](../templates/AGENTS-template.md) como `AGENTS.md` na raiz. Ele e o roteador leve que faz a IA abrir apenas os documentos necessarios.

## Design System Testes

Padrao obrigatorio de **testes para projetos Doktor**. Define tipos de teste (unitario, integracao, E2E), piramide de testes, nomenclatura, estrutura AAA, o que testar, o que nao testar, uso correto de mocks, cobertura minima por tipo de projeto e checklist de entrega.

[Ver design system testes](../core/DESIGN_SYSTEM_TESTES.md)

## Design System API REST

Padrao obrigatorio de **contrato, nomenclatura, status codes, versionamento e tratamento de erro para APIs HTTP**. Cobre metodos HTTP, formato de resposta com envelope `data`/`error`, paginacao, filtros, autenticacao via Bearer token e checklist de entrega.

[Ver design system API REST](../core/DESIGN_SYSTEM_API_REST.md)

## Design System Seguranca

Padrao obrigatorio de **seguranca desde o primeiro commit**. Define o que nunca commitar, protecao de secrets e variaveis de ambiente, autenticacao e autorizacao, validacao de entrada, SQL injection, XSS, exposicao de dados, headers HTTP e OWASP Top 10. Inclui checklist de seguranca por entrega.

[Ver design system seguranca](../core/DESIGN_SYSTEM_SEGURANCA.md)

## Design System Arquitetura

Padrao obrigatorio de **organizacao, responsabilidade e estrutura de codigo**. Define separacao por camadas, regras de nomenclatura, tamanho de funcoes e arquivos, antipadroes a evitar e checklist de entrega. Vale para frontend, backend e scripts.

[Ver design system arquitetura](../core/DESIGN_SYSTEM_ARQUITETURA.md)

## Design System Modularidade

Padrao obrigatorio de **granularidade de arquivo**. Define o principio de responsabilidade unica por arquivo, proibe nomes-deposito (`utils.ts`, `helpers.ts`, `misc.ts`), exige um componente/hook/contexto por arquivo, e fixa limites por tipo (componente, hook, modulo Python, CSS, conteudo, documento). Inclui o criterio de quebra por responsabilidade e as regras de leitura durante correcao. O motivo e economico: arquivo grande custa tempo, token e risco de alterar codigo nao relacionado.

[Ver design system modularidade](../core/DESIGN_SYSTEM_MODULARIDADE.md)

## Design System Frontend

Guia completo de padronizacao visual para front-end, extraido do **Doktor**. Documenta paleta, tipografia, layout, componentes, animacoes e padroes de interface. Inclui separacao explicita entre principios universais e escolhas especificas do Doktor.

[Ver design system frontend](../core/DESIGN_SYSTEM_FRONTEND.md)

## Design System Backend

Guia de **qualidade de sistema backend**. Define principios de arquitetura, escolha de stack, modularizacao forte, separacao de responsabilidades, estrutura por camadas, padroes de API, persistencia, testes, TDD, SQLite como padrao inicial, Open/Closed, documentacao viva e checklist de qualidade.

[Ver design system backend](../core/DESIGN_SYSTEM_BACKEND.md)

## Stack e Arquitetura

Baseline tecnica do Doktor System-Design para frontend, backend, dados, deploy e automacao. Use este documento para escolher a stack inicial ou justificar desvios quando um projeto pedir outra arquitetura.

[Ver stack e arquitetura](STACK-E-ARQUITETURA.md)

## Design System README

Guia de padronizacao para `README.md`, usado como referencia para manter documentacao consistente entre projetos.

[Ver design system README](../core/DESIGN_SYSTEM_README.md)

## Guia Minimo de Qualidade

Contrato curto e obrigatorio para preservar qualidade de software em qualquer projeto. Resume os padroes essenciais de arquitetura, seguranca, testes, documentacao e criterio de pronto antes de consultar os documentos longos.

[Ver guia minimo de qualidade](../core/GUIA_MINIMO_QUALIDADE.md)

## Start App Script (obrigatorio por programa)

Contrato obrigatorio: **todo programa rodavel** (web, CLI, automacao, script, desktop) deve ter um `start_app.py` na raiz que abre um **menu interativo, colorido e descritivo** - a porta de entrada unica por onde a pessoa instala, configura, inicia e deixa o programa pronto (`python start_app.py`). Sempre menu, nunca flags decoradas. Menu minimo: Iniciar/Rodar, Instalar/Setup, Configurar, Status/Sair.

[Ver guia do start app script](../core/GUIA-START-APP-SCRIPT.md)

## Prompt Base Backend

Guia tecnico para montar prompts de backend completos na primeira interacao. Inclui stacks recomendadas, decisoes tecnicas por cenario e exige que a IA siga o `DESIGN_SYSTEM_BACKEND.md` como contrato de qualidade.

[Ver prompt base backend](../core/PROMPT_BASE_BACKEND.md)

## Prompt Base Frontend

Guia tecnico para montar prompts de frontend completos na primeira interacao. Inclui stacks recomendadas, decisoes visuais por cenario, campos para componentes, identidade visual, responsividade e animacoes.

[Ver prompt base frontend](../core/PROMPT_BASE_FRONTEND.md)

## TEMPLATE-CONTEXTO-IA.md - Template de Contexto Operacional

Template padrao de **memoria operacional** para projetos com IA. Deve ser copiado para o projeto destino **como `IA.md`** e preenchido continuamente durante o desenvolvimento para registrar:

- objetivo atual e milestones
- decisoes tecnicas
- stack e convencoes
- bugs e correcoes relevantes
- testes importantes
- contexto necessario para outra IA retomar o trabalho sem reler tudo

[Ver o template](../core/TEMPLATE-CONTEXTO-IA.md)
