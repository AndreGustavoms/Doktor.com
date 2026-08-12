# Template de Contexto IA

Use este arquivo como base para criar `IA.md` em projetos desenvolvidos com apoio de IA.

## Quando usar

Use em qualquer projeto que precise preservar contexto entre sessoes, agentes ou modelos diferentes.

## Quando nao usar

Nao use como diario longo. O arquivo deve guardar decisoes, estado, riscos e validacoes relevantes, nao transcrever conversa.

## Resultado esperado

Um unico arquivo que permite retomar o projeto rapidamente, entendendo:

- objetivo;
- estado atual (resumo vivo, sem precisar reler o historico inteiro);
- stack;
- decisoes;
- pendencias;
- validacoes;
- bugs relevantes;
- integracoes externas;
- limites conhecidos.

## Como usar

1. Copie este arquivo para a raiz do projeto destino como `IA.md`.
2. Preencha as secoes iniciais no primeiro setup.
3. Atualize sempre que houver decisao tecnica, mudanca de escopo, bug importante ou validacao relevante - em tempo real, nao apenas ao final do trabalho.
4. Nao registre secrets, tokens, senhas ou dados privados.

## Regra de preservacao historica

O `IA.md` e a linha do tempo tecnica do projeto. Nao apague nem reescreva registros antigos quando uma decisao mudar; adicione um novo registro datado explicando o que mudou, por que mudou e como foi validado. A unica excecao e a secao "Estado atual (resumo vivo)": ela pode e deve ser reescrita a cada mudanca de estado, porque seu papel e resumir "onde o projeto esta agora", nao preservar historico.

## Template

````markdown
# IA.md - Contexto Operacional

## Estado atual (resumo vivo)

<!--
  EXCECAO a regra append-only: esta secao e um RESUMO reescrevivel.
  Ela responde "onde o projeto esta AGORA" em poucas linhas, para que uma IA
  retome o contexto sem reler toda a linha do tempo. Reescreva-a livremente
  a cada mudanca de estado - o historico detalhado continua protegido nas
  secoes datadas abaixo e nos archives.
  Exemplo:
  Ultima atualizacao: [2026-03-15]
  - Fase: MVP funcional, deploy em VPS, autenticacao JWT pronta.
  - Em andamento: cache do /api/reports (ver Resumos de decisao de 2026-03-14).
  - Proximo passo: testes de integracao do fluxo de pagamento.
  - Risco aberto: timeout em uploads >50MB (ver Bugs de 2026-03-13).
-->

[YYYY-MM-DD] Preencher e manter sempre atualizado.

## Objetivo do projeto

[YYYY-MM-DD] Descreva o objetivo principal, publico e prioridade.

## Estado atual

- O que ja esta implementado.
- O que esta em progresso.
- O que ainda nao foi feito.

## Stack e dependencias

- Frontend:
- Backend:
- Banco:
- Deploy:
- Testes:

## Decisoes de arquitetura

- [YYYY-MM-DD] Decisao: motivo e impacto.

## Decisoes de design e convencoes

- [YYYY-MM-DD] Convencao de pastas, commits, naming, UI ou API.

## Testes importantes

- [YYYY-MM-DD] `comando`: resultado e o que valida.

## Bugs e fixes relevantes

- [YYYY-MM-DD] BUG: causa e fix aplicado.

## Integracoes e servicos externos

- Servico:
- Como esta configurado:
- Onde ficam variaveis:
- Observacao de seguranca:

## Pendencias

- [ ] Pendente 1.
- [ ] Pendente 2.

## Resumos de decisao

Use quando houver decisao complexa:

```text
[YYYY-MM-DD] CONTEXTO:
ALTERNATIVAS:
DECISAO:
VALIDACAO:
```

Nao registre chain of thought interno. Registre apenas informacao tecnica util, verificavel e retomavel.
````

## Quando registrar

Atualize o `IA.md` sempre que:

1. Uma decisao tecnica for tomada - escolha de lib, padrao, arquitetura, estrutura de banco.
2. A stack for definida ou alterada.
3. Um teste importante passar ou falhar.
4. O design/arquitetura mudar - refatoracao, novo modulo.
5. Um bug significativo for resolvido - causa raiz e fix aplicado.
6. A meta ou objetivo mudar - pivo, mudanca de escopo.
7. Uma convencao for estabelecida - naming, estrutura de pastas, padrao de commit.
8. Uma integracao externa for configurada - sem expor secrets.
9. Uma milestone for atingida.
10. Houver uma decisao complexa que mereca um resumo (contexto, alternativas, conclusao, validacao).

## Por que registrar resumo de decisao?

Modelos de IA podem alucinar ou se confundir durante decisoes longas. Registrar um resumo tecnico e auditavel permite:

- identificar onde o erro comecou, se o resultado final estiver errado;
- evitar loops - se a IA ja tentou um caminho e falhou, o registro impede repeticao;
- retomar com outro modelo, que consegue ler a decisao anterior e continuar de onde parou;
- auditar alucinacoes por comparacao entre a decisao registrada e o codigo gerado.

## Quando o arquivo crescer demais (compactacao sem perda)

Um `IA.md` gigante deixa de cumprir o proprio objetivo: estoura o contexto do modelo e enterra a informacao atual sob historico antigo. A regra de preservacao continua valendo - nada e apagado - mas o historico pode ser movido:

1. Quando o `IA.md` ficar longo demais para leitura rapida (sinal pratico: a IA gasta mais tempo relendo historico do que trabalhando), mova os registros mais antigos, na integra e sem editar, para `docs/ia-archive/IA-ARCHIVE-<ano>.md` (ou faixa de datas).
2. Deixe no `IA.md` um ponteiro datado para cada arquivo de archive (ex.: `[2026-07-18] Registros de 2025 movidos para docs/ia-archive/IA-ARCHIVE-2025.md`).
3. Mantenha no `IA.md` os registros recentes e a secao "Estado atual (resumo vivo)" sempre em dia - e ela que permite retomar contexto sem reler o archive.
4. A linha do tempo completa continua auditavel: `IA.md` + archives, em ordem cronologica, sem nenhum registro perdido ou reescrito.

## Regra de manutencao

Atualize o `IA.md` no mesmo commit da mudanca relevante, em tempo real durante o trabalho - nao deixe para o fim. Contexto desatualizado conta como documentacao quebrada.
