# Guia Integracao LLM e Agentes

## Quando usar

Use quando o backend ou script precisa chamar um modelo de linguagem (LLM) para gerar texto, classificar, resumir, extrair dados estruturados, orquestrar ferramentas (tool use) ou montar um fluxo de RAG (retrieval-augmented generation).

## Quando nao usar

Nao use LLM para o que um algoritmo deterministico resolve com a mesma qualidade e custo menor (parsing simples, validacao de formato, regra de negocio fixa). Nao use tool use/agente autonomo quando uma chamada unica de API resolver o problema - agente e mais caro e mais dificil de depurar do que uma funcao direta.

## Resultado esperado

Uma camada de integracao com:

- cliente isolado (nao espalhar chamadas de API pela aplicacao);
- prompt versionado e testavel;
- saida estruturada e validada antes de usar no restante do sistema;
- controle de custo por chamada (nivel de modelo, tamanho de contexto, cache);
- tratamento de erro e retry para falhas transitorias;
- logs sem vazar prompts/respostas sensiveis.

## 1. Isolar o cliente de LLM

Toda chamada ao provedor de LLM deve passar por uma camada de integracao propria (ver `DESIGN_SYSTEM_BACKEND.md`, secao 5.3 - integracoes isoladas). O restante do sistema nao deve conhecer o formato cru da API do provedor.

```python
# integrations/llm/client.py
from dataclasses import dataclass


@dataclass(frozen=True)
class LlmResponse:
    text: str
    model: str
    input_tokens: int
    output_tokens: int


class LlmClient:
    def __init__(self, api_key: str, default_model: str):
        self._api_key = api_key
        self._default_model = default_model

    def complete(self, prompt: str, *, model: str | None = None, max_tokens: int = 1024) -> LlmResponse:
        # chamada real ao SDK do provedor fica encapsulada aqui
        raise NotImplementedError
```

O resto da aplicacao consome `LlmClient`, nunca o SDK do provedor diretamente.

## 2. Escolha de nivel de modelo por tarefa

Ver `core/DESIGN_SYSTEM_ECONOMIA_IA.md` para o raciocinio completo de niveis de tarefa vs. nivel de modelo. Regra pratica aplicada a codigo:

```python
def pick_model(task_kind: str) -> str:
    # tarefa mecanica (classificar, extrair campo simples) -> modelo economico
    if task_kind in {"classify", "extract_simple"}:
        return "modelo-economico"
    # tarefa de geracao/redacao comum -> modelo intermediario
    if task_kind in {"summarize", "draft"}:
        return "modelo-intermediario"
    # decisao complexa, raciocinio multi-etapa -> modelo avancado
    return "modelo-avancado"
```

Nao fixe nomes de modelo especificos no codigo de negocio: centralize a escolha numa configuracao (variavel de ambiente ou tabela), para atualizar sem reescrever chamadas espalhadas.

## 3. Prompt versionado e testavel

Prompts sao parte do contrato do sistema, nao string solta no meio do codigo.

```python
# integrations/llm/prompts/extract_invoice.py
PROMPT_VERSION = "v2"

EXTRACT_INVOICE_PROMPT = """
Extraia os campos abaixo do texto da nota fiscal. Responda em JSON.
Campos: numero, data, valor_total, cnpj_emissor.
Se um campo nao existir, use null.

Texto:
{invoice_text}
"""
```

- Cada prompt tem um identificador de versao. Ao mudar o prompt de forma que altere o comportamento, incremente a versao e registre a mudanca em `IA.md`.
- Escreva teste que valida a saida esperada para um input fixo (ver secao 6).

## 4. Saida estruturada e validada

Nunca use a resposta crua do modelo diretamente na regra de negocio. Peca formato estruturado (JSON, ou tool use/structured output quando o provedor suportar) e valide antes de usar.

```python
import json
from pydantic import BaseModel, ValidationError


class InvoiceExtraction(BaseModel):
    numero: str | None
    data: str | None
    valor_total: float | None
    cnpj_emissor: str | None


def parse_llm_output(raw_text: str) -> InvoiceExtraction | None:
    try:
        data = json.loads(raw_text)
        return InvoiceExtraction(**data)
    except (json.JSONDecodeError, ValidationError):
        return None
```

Se a validacao falhar, trate como erro de integracao (retry com instrucao mais clara, ou fallback), nunca deixe o dado invalido seguir para o resto do sistema.

## 5. Tool use / agentes: quando e como

Use tool use quando o modelo precisar decidir **qual** acao tomar entre varias ferramentas (buscar dados, chamar API, rodar calculo) antes de responder.

- Defina cada ferramenta com contrato claro (nome, parametros tipados, descricao objetiva do que faz).
- Limite o numero de ferramentas disponiveis por chamada ao que a tarefa realmente precisa - mais ferramentas custam mais contexto e aumentam chance de escolha errada.
- Trate a chamada de ferramenta como entrada externa: valide os parametros antes de executar (mesma regra do `DESIGN_SYSTEM_BACKEND.md`, secao 6.2).
- Registre um limite de iteracoes (ex.: maximo de 5 chamadas de ferramenta por tarefa) para evitar loop de custo sem controle.

```python
MAX_TOOL_ITERATIONS = 5

def run_agent_loop(prompt: str) -> str:
    for _ in range(MAX_TOOL_ITERATIONS):
        response = llm_client.complete_with_tools(prompt, tools=available_tools)
        if response.is_final:
            return response.text
        prompt = apply_tool_result(prompt, response.tool_call)
    raise RuntimeError("agente excedeu o limite de iteracoes sem concluir")
```

## 6. RAG basico (retrieval-augmented generation)

Quando a resposta depender de dados especificos do projeto (documentos, base de conhecimento), busque o contexto relevante antes de montar o prompt, em vez de tentar colocar tudo no contexto do modelo.

```text
Pergunta do usuario
  -> busca por similaridade (embeddings) nos documentos indexados
  -> seleciona os N trechos mais relevantes
  -> monta prompt: instrucao + trechos recuperados + pergunta
  -> chama o modelo
```

- Nao indexe documentos inteiros sem chunking: fatie em blocos de tamanho gerenciavel (ex.: por paragrafo ou secao).
- Registre a fonte de cada trecho recuperado, para poder citar a origem na resposta e auditar respostas erradas.
- Reavalie periodicamente se os trechos recuperados sao realmente relevantes (nao assuma que a busca por similaridade sempre acerta).

## 7. Cache e reaproveitamento

- Se o provedor suportar cache de prompt (contexto estavel reaproveitado entre chamadas), estruture o prompt com a parte estavel (instrucoes, exemplos) antes da parte variavel (pergunta do usuario), para maximizar o reaproveitamento.
- Para perguntas identicas ou muito similares, considere cache de resposta em nivel de aplicacao (chave = hash do prompt final), com TTL adequado ao caso de uso.
- Nao cacheie respostas que dependem de dado sensivel do usuario sem escopo claro de quem pode ler o cache.

## 8. Erros e retry

- Diferencie erro transitorio (rate limit, timeout, 5xx do provedor) de erro de conteudo (resposta invalida, saida que nao valida no schema).
- Erro transitorio: retry com backoff exponencial, limite de tentativas.
- Erro de conteudo: nao adianta repetir a mesma chamada sem mudar o prompt; ou ajuste o prompt e tente de novo (uma vez), ou registre falha e trate como caso manual.
- Nunca deixe uma falha de LLM quebrar o fluxo principal sem fallback definido (mensagem de erro clara para o usuario, ou caminho alternativo).

## 9. Seguranca e dados sensiveis

- Nao envie segredo, token ou dado pessoal desnecessario no prompt.
- Trate o log de prompts/respostas como log sensivel: nao grave payload completo em log publico ou compartilhado sem necessidade.
- Se o provedor usa os dados enviados para treinamento por padrao, confirme a politica de retencao/uso antes de enviar dado de cliente real.
- Valide saida do modelo antes de renderizar como HTML/executar como comando - resposta de LLM e entrada nao confiavel como qualquer outra (ver `DESIGN_SYSTEM_SEGURANCA.md`).

## 10. Testes

- Teste a camada de parsing/validacao da saida (secao 4) com respostas fixas simuladas - nao dependa de chamar o modelo de verdade a cada execucao de teste.
- Para o prompt em si, mantenha um pequeno conjunto de casos de referencia (input -> saida esperada) e rode manualmente ao mudar a versao do prompt, registrando o resultado em `IA.md`.
- Fluxos de agente (tool use) merecem teste de integracao que simula as ferramentas com mocks, verificando que o loop respeita o limite de iteracoes.

## Checklist

- [ ] Chamadas ao provedor de LLM passam por um cliente isolado, nao espalhadas pelo codigo.
- [ ] Nivel de modelo escolhido combina com a complexidade da tarefa (ver `DESIGN_SYSTEM_ECONOMIA_IA.md`).
- [ ] Prompts sao versionados e a mudanca de versao fica registrada.
- [ ] Saida do modelo e validada antes de usar na regra de negocio.
- [ ] Tool use/agente tem limite de iteracoes e ferramentas com contrato validado.
- [ ] RAG (quando usado) faz chunking e registra a fonte dos trechos recuperados.
- [ ] Erros transitorios tem retry com backoff; erros de conteudo tem fallback definido.
- [ ] Prompts/respostas sensiveis nao vazam em log.
- [ ] Testes cobrem parsing da saida com casos fixos, sem depender de chamada real a cada execucao.

## Ideias para quem quiser contribuir

- Template de cliente LLM com suporte a multiplos provedores atras da mesma interface.
- Harness de teste para comparar saida de prompt entre versoes (regressao de prompt).
