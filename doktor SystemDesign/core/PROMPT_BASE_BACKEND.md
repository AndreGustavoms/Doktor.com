# Prompt Base Backend

Use este modelo para pedir a uma IA ou pessoa desenvolvedora que implemente, revise ou planeje um backend seguindo o Doktor System-Design.

Antes de usar, consulte:

- [GUIA_MINIMO_QUALIDADE.md](GUIA_MINIMO_QUALIDADE.md)
- [DESIGN_SYSTEM_BACKEND.md](DESIGN_SYSTEM_BACKEND.md)
- [../docs/STACK-E-ARQUITETURA.md](../docs/STACK-E-ARQUITETURA.md)

## 1. Prompt curto

```text
Voce vai atuar como engenheiro backend neste projeto.

Siga:
- core/GUIA_MINIMO_QUALIDADE.md
- core/DESIGN_SYSTEM_BACKEND.md
- docs/STACK-E-ARQUITETURA.md

Objetivo:
[descreva o que deve ser construido ou revisado]

Contexto:
[stack atual, banco, autenticacao, integracoes, restricoes]

Requisitos:
- [requisito 1]
- [requisito 2]
- [requisito 3]

Obrigatorio:
- separar API, services, dominio, persistencia e integracoes quando aplicavel;
- validar entradas;
- padronizar erros;
- proteger segredos;
- antes de usar uma API/lib/metodo, confirmar que existe na versao instalada (nao presumir de memoria);
- executar os testes de verdade e reportar a saida real ("deve passar" nao e validacao);
- atualizar README/IA.md em tempo real conforme o estado do projeto muda, nao so ao final;
- informar como foi validado.
```

## 2. Prompt completo

```text
Voce vai trabalhar no backend deste projeto com foco em qualidade, manutencao e seguranca.

Leia e siga estes documentos:
- core/GUIA_MINIMO_QUALIDADE.md
- core/DESIGN_SYSTEM_BACKEND.md
- docs/STACK-E-ARQUITETURA.md
- IA.md, se existir

Objetivo da tarefa:
[explique a entrega esperada]

Estado atual:
- linguagem/framework:
- banco:
- autenticacao/autorizacao:
- APIs existentes:
- integracoes externas:
- testes existentes:
- comando para rodar:

Requisitos funcionais:
- ...

Requisitos nao funcionais:
- seguranca:
- observabilidade/logs:
- performance:
- compatibilidade:
- manutencao:

Restricoes:
- nao usar:
- nao alterar:
- manter compatibilidade com:

Arquitetura esperada:
- API/views/controllers somente para entrada e resposta HTTP;
- services para casos de uso;
- dominio para regras centrais;
- repositories/models para persistencia;
- integrations/adapters para terceiros;
- configuracao por variaveis de ambiente;
- pense primeiro na ferramenta reutilizavel antes da solucao pontual, e planeje pontos de extensao (Strategy/adapters) para variacoes previsiveis.

Forma de trabalhar:
- comece pelos testes sempre que possivel: comportamento -> teste -> implementacao -> refatoracao (TDD);
- antes de usar uma API, biblioteca ou metodo, confirme que ela existe na versao instalada (doc oficial ou codigo) - nao presuma de memoria;
- execute os testes de verdade e observe a saida real; nao avance de etapa com teste falhando nem declare validacao sem execucao;
- atualize README/IA.md em tempo real a cada mudanca relevante de estado do projeto, nao apenas no fim.

Validacao esperada:
- testes automatizados quando possivel, com saida real observada e reportada;
- verificacao manual objetiva quando teste automatico nao for viavel;
- registro de risco residual.

Entrega:
- implementar ou revisar a solucao;
- atualizar documentacao afetada;
- explicar o que mudou, por que mudou, como foi validado (com evidencia real de execucao) e qual risco sobrou.
```

## 3. Escolha de stack

Use a baseline:

| Cenario | Stack sugerida |
|---------|----------------|
| CRUD/API comum | Python + Django + Django REST Framework |
| API pequena/focada | FastAPI |
| Integracao forte com JS | Node.js + TypeScript |
| Contexto corporativo/legado | C#/.NET |

Quando a stack fugir da baseline, registre:

```text
DECISAO:
ALTERNATIVAS:
MOTIVO:
RISCO:
VALIDACAO:
```

## 4. Checklist para a resposta

A resposta ou entrega deve cobrir:

- [ ] stack escolhida ou mantida;
- [ ] separacao de responsabilidades;
- [ ] validacao de entradas;
- [ ] contratos de API;
- [ ] tratamento de erros;
- [ ] persistencia e migrations, se aplicavel;
- [ ] integracoes externas isoladas;
- [ ] seguranca de segredos/logs;
- [ ] testes ou verificacao manual;
- [ ] documentacao atualizada.

## 5. Anti-padroes

Evite pedir ou aceitar:

- "faz tudo em um arquivo";
- views/controllers com regra de negocio complexa;
- chamadas externas espalhadas pelo codigo;
- logs com token/cookie/senha;
- resposta sem validacao;
- excecao generica escondendo erro;
- stack escolhida por preferencia sem justificativa;
- usar API, biblioteca ou metodo sem confirmar que existe na versao instalada;
- declarar testes/validacao "deve passar" sem executar e observar a saida real;
- mudanca sem atualizacao de README/IA.md quando comandos ou comportamento mudam.
