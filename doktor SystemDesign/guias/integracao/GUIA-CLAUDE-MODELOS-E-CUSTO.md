# Guia Claude: Escolha de Modelo e Reducao de Custo

## Quando usar

Use quando o projeto chama a API da Anthropic (Claude) e voce quer gastar menos
sem perder qualidade - escolhendo o modelo certo por tarefa e aplicando as
alavancas de custo que a API oferece.

## Quando nao usar

Nao use para decidir arquitetura de integracao LLM em geral (cliente isolado,
prompt versionado, tool use, RAG) - isso esta em
[GUIA-INTEGRACAO-LLM-E-AGENTES.md](GUIA-INTEGRACAO-LLM-E-AGENTES.md). Nao use
para o raciocinio generico de "nivel de tarefa vs nivel de modelo", que vale
para qualquer provedor - isso esta em
[../../core/DESIGN_SYSTEM_ECONOMIA_IA.md](../../core/DESIGN_SYSTEM_ECONOMIA_IA.md).
Este guia e a camada especifica de Claude.

> Precos e nomes de modelo mudam. Este guia fala em **familias** e **ordem de
> grandeza**; para os IDs e valores atuais, consulte a documentacao oficial da
> Anthropic (`https://platform.claude.com/docs/en/about-claude/models/overview`
> e a pagina de pricing) ou a Models API (`GET /v1/models`).

## 1. Escolha da familia por tarefa

A familia Claude tem tres niveis. Case o nivel ao risco e a complexidade da
tarefa - nunca no maximo por padrao, nunca no minimo quando o risco for alto.

| Nivel de tarefa | Familia recomendada | Exemplos |
|---|---|---|
| Mecanica, alto volume, latencia critica | Haiku | Classificar, extrair campo simples, resumir log curto, roteamento |
| Trabalho comum do dia a dia | Sonnet | Implementar feature com padrao ja definido, revisar PR pequeno, escrever teste, gerar/resumir conteudo |
| Arquitetura, decisao critica, agentes longos | Opus | Desenhar sistema novo, revisar mudanca de alto risco, debugar sem causa raiz clara, execucao autonoma longa |

Regra pratica de custo: a diferenca de preco entre Haiku, Sonnet e Opus e de
varias vezes por token. Rodar tarefa mecanica no modelo mais caro e desperdicio;
rodar decisao critica no mais barato e risco que custa mais que a economia.

- Comece perguntando: "se isso der errado, qual o custo de corrigir depois?"
  Custo baixo -> modelo economico. Custo alto -> modelo avancado.
- Em duvida entre dois niveis, escolha o **menor** e escale se o resultado nao
  bastar - e mais barato tentar de novo do que comecar no teto.

## 2. Alavancas de custo da API (independem do modelo)

### 2.1 Prompt caching - a maior economia

Quando varias chamadas compartilham um prefixo grande e estavel (system prompt,
exemplos, documento de contexto), o cache reduz o custo desse prefixo em cerca
de 90% nas leituras seguintes.

- Cache e **prefixo exato**: qualquer byte diferente no inicio invalida tudo
  depois. Mantenha o conteudo estavel primeiro (system prompt congelado, ordem
  de ferramentas deterministica) e o volatil por ultimo (pergunta do usuario,
  timestamp, ID de requisicao).
- Nao interpole `datetime.now()`, UUID ou ID de sessao no inicio do system
  prompt - isso quebra o cache a cada chamada.
- Confira `usage.cache_read_input_tokens` na resposta. Se ficar zero em chamadas
  repetidas com o mesmo prefixo, ha um invalidador silencioso.

### 2.2 Batch para trabalho nao urgente

Requisicoes que nao precisam de resposta imediata (relatorios, classificacao em
lote, geracao offline) podem ir pela Batch API por cerca de metade do preco.
Aceita as mesmas features (vision, tools, cache).

### 2.3 Effort proporcional a tarefa

Nos modelos atuais, `output_config.effort` controla profundidade de raciocinio
e gasto de tokens (`low`/`medium`/`high`, e `xhigh`/`max` nos modelos que
suportam). Nao deixe no maximo por padrao:

- Tarefa mecanica ou chat simples: `low`.
- Trabalho comum: `medium` ou `high`.
- Decisao critica: `high`/`xhigh`; `max` so quando acertar importa mais que custo.

### 2.4 Streaming para saidas grandes

Para `max_tokens` alto, use streaming - evita timeout de conexao e deixa
mostrar progresso ao usuario, sem custo extra.

### 2.5 Conte tokens antes de gastar

Estime o custo de entrada com o endpoint de contagem de tokens
(`count_tokens`) em vez de aproximar por bibliotecas de outro provedor, que
erram a contagem para Claude.

## 3. Sinais de que o gasto esta desproporcional

- Tarefa mecanica (classificar, extrair, formatar) enviada ao modelo mais caro.
- Decisao de arquitetura ou seguranca tomada no modelo mais economico sem revisao.
- A mesma pergunta refeita em modelos diferentes "para conferir" quando o
  resultado anterior ja era confiavel.
- `cache_read_input_tokens` sempre zero apesar de prefixo repetido.
- Trabalho em lote nao urgente rodando em chamadas sincronas normais em vez de Batch.

## 4. Checklist rapido

- [ ] O nivel de modelo (Haiku/Sonnet/Opus) combina com o risco real da tarefa.
- [ ] Prefixo estavel isolado no inicio para o prompt caching funcionar.
- [ ] `cache_read_input_tokens` confirmado > 0 em chamadas repetidas.
- [ ] Trabalho nao urgente vai pela Batch API.
- [ ] `effort` proporcional a tarefa, nao no maximo por padrao.
- [ ] Saidas grandes usam streaming.
- [ ] Custo de entrada estimado com `count_tokens`, nao com tokenizer de terceiros.

## Ideias para quem quiser contribuir

- Um pequeno registro de custo real por tipo de tarefa (tokens/tempo) para
  calibrar a secao 1 com dados, ligado a
  [../../core/DESIGN_SYSTEM_ECONOMIA_IA.md](../../core/DESIGN_SYSTEM_ECONOMIA_IA.md).
