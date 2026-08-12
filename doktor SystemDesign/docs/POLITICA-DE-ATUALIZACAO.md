# Politica de Atualizacao

Este documento define como manter o Doktor System-Design atualizado ao longo do tempo, para que os padroes nao fiquem presos a versoes antigas de frameworks, modelos de IA ou praticas de mercado.

> **Escopo**: este documento e especifico deste repositorio (o Doktor System-Design em si) - ele fala de sincronizar com o repositorio de origem e manter os proprios padroes atualizados. Por isso ele **nao** foi propagado para `templates/AGENTS-template.md`: um projeto que apenas consome o Doktor nao precisa comparar-se com o Felixo System-Design, so precisa saber onde a copia sincronizada vive (ver `docs/INSTALACAO-EM-OUTROS-PROJETOS.md`). Se um projeto destino quiser uma politica propria de manter suas dependencias/stack atualizadas, isso e uma decisao dele, nao uma copia deste arquivo.

## 1. Por que isso existe

Documentacao de padroes tecnicos envelhece de duas formas diferentes:

- **Envelhecimento por desatualizacao tecnica**: uma stack recomendada deixa de ser a melhor escolha, uma versao citada fica obsoleta, uma pratica de seguranca e superada por outra melhor.
- **Envelhecimento por divergencia da origem**: este repositorio nasceu de uma copia do [`Felixo System Design`](https://github.com/Felipe-Alcantara/Felixo-System-Design) (ver [`../NOTICE.md`](../NOTICE.md)). A origem continua evoluindo depois da copia; sem um processo, o Doktor para de receber melhorias reais que nao dependem de identidade pessoal.

## 2. Regra central

Nao fixe numero de versao de ferramenta em documentacao (ex.: "React 18", "Django 5.1"). Use sempre "versao estavel mais recente" no texto e deixe o numero exato para o lockfile de cada projeto (`package-lock.json`, `requirements.txt`, `poetry.lock`). Isso evita que o proprio guia fique desatualizado so por citar um numero.

Excecao: quando a citacao de versao for necessaria para explicar uma decisao historica (ex.: "usamos X ate a versao Y por causa de Z"), registre isso como decisao datada, nao como recomendacao vigente.

## 3. Gatilhos de revisao

Revise um documento quando qualquer um destes sinais aparecer:

| Gatilho | O que fazer |
|---|---|
| Uma stack ou pratica recomendada aqui foi abandonada ou substituida no ecossistema | Atualizar `docs/STACK-E-ARQUITETURA.md` e o `core/DESIGN_SYSTEM_*.md` afetado, registrando a mudanca no `IA.md` deste repositorio |
| Um projeto que usa o Doktor precisou desviar da stack padrao por a stack estar desatualizada (nao por preferencia) | Registrar a excecao no `IA.md` do projeto e, se o padrao mudar de fato, propor atualizacao aqui |
| O repositorio de origem (Felixo System Design) publicou guia novo, regra nova ou correcao de bug relevante | Ver secao 4 (sincronizacao com a origem) |
| Uma regra de seguranca ficou defasada frente a uma vulnerabilidade ou pratica nova (ex.: novo item no OWASP Top 10) | Atualizar `core/DESIGN_SYSTEM_SEGURANCA.md` |
| Uma pratica de uso de IA (modelos, custo, contexto) mudou de forma relevante | Atualizar `core/DESIGN_SYSTEM_ECONOMIA_IA.md` mantendo a linguagem por nivel de tarefa, sem prender a nomes de modelo especificos que vao mudar de novo |

## 4. Sincronizacao com o repositorio de origem

O Doktor removeu identidade pessoal do corpo dos guias (ver [`DECISOES-DE-IDENTIDADE.md`](DECISOES-DE-IDENTIDADE.md)), mas isso nao significa ignorar melhorias tecnicas que a origem continuar publicando.

Processo recomendado, periodico ou sob demanda:

1. Clone ou atualize uma copia local do repositorio de origem (`https://github.com/Felipe-Alcantara/Felixo-System-Design`).
2. Compare arquivo por arquivo equivalente com o Doktor: o que existe la e nao existe aqui, e o que mudou de conteudo (nao apenas de formatacao/ASCII) nos arquivos que os dois compartilham.
3. Separe cada diferenca em uma destas categorias:
 - **Regra de qualidade tecnica nova ou mais rigida** -> portar para o Doktor, reescrita no padrao proprio (sem assinatura pessoal, ASCII).
 - **Identidade visual, autoria ou preferencia pessoal do autor de origem** -> nao portar; e o que a curadoria ja filtra (ver [`CURADORIA-DOS-GUIAS.md`](CURADORIA-DOS-GUIAS.md)).
 - **Guia opcional novo (funcionalidade especifica)** -> avaliar se faz sentido para o escopo do Doktor antes de portar.
4. Registrar o resultado da comparacao no `IA.md` deste repositorio: o que foi trazido, o que foi descartado e por que.
5. Commitar as mudancas seguindo [`GIT-POLITICA-DE-VERSIONAMENTO.md`](GIT-POLITICA-DE-VERSIONAMENTO.md) - normalmente varios commits pequenos, um por documento ou tema, nao um commit unico gigante.

Nao ha automacao obrigatoria para este processo (nao existe forma confiavel de "puxar a internet" sozinho); ele e deliberadamente manual e feito por quem estiver mantendo o repositorio, com apoio de um agente de IA quando fizer sentido.

## 5. Checklist de atualizacao

- [ ] Nenhum numero de versao de ferramenta foi fixado como recomendacao vigente (fora de contexto historico).
- [ ] A mudanca foi registrada no `IA.md` deste repositorio com data e motivo.
- [ ] Se a mudanca veio de comparacao com a origem, o resultado da comparacao (trazido/descartado/por que) foi registrado.
- [ ] Documentos afetados (`docs/STACK-E-ARQUITETURA.md`, `core/DESIGN_SYSTEM_*.md`, `AGENTS.md`) foram atualizados juntos, nao isolados.
- [ ] Links internos continuam validos apos a atualizacao.
