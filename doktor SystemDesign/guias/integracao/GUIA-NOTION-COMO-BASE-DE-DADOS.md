# Guia - Notion como Base de Dados

## Quando usar

Para migrar planilhas de controle, importar documentos de um Drive, montar catalogos/inventarios, consolidar dados espalhados em bases navegaveis e relacionadas, ou reorganizar a arvore de paginas de um workspace Notion.

## Quando nao usar

Quando o Notion for usado apenas como bloco de notas simples, sem necessidade de propriedades tipadas, filtros ou relacoes entre bases - nesse caso a estrutura descrita aqui e excesso.

## Resultado esperado

Planilhas, documentos e pastas heterogeneas transformadas em databases estruturadas do Notion, com propriedades tipadas, arquivos anexados, importacao idempotente e reorganizacao programatica do workspace.

---

## Visao geral

O padrao e composto por 7 camadas:

| Camada | Responsabilidade |
|---|---|
| Extracao e normalizacao | Ler a fonte (xlsx/docx/zip), corrigir encoding, normalizar datas/numeros/nomes, deduplicar |
| Modelagem do schema | Decidir 1 linha = 1 que; escolher tipos de propriedade; ID nativo; relacoes |
| Cliente resiliente | Retry com backoff (429/5xx), timeout, versao de API por chamada |
| Importacao idempotente | Estado local de progresso para retomar sem duplicar; fatiar texto > 2000 |
| Anexos | Subir o arquivo original e vincula-lo a propriedade `files` da linha |
| Estrutura de navegacao | Pastas -> topicos; topico = cabecalho + divisoria + links full-page |
| Reorganizacao | Re-parentear paginas e databases; consolidar; arquivar (nao destruir) |

---

## 1. Extracao e normalizacao da fonte

O trabalho sujo mora aqui. Antes de qualquer chamada ao Notion, transforme a fonte num JSON limpo e previsivel.

- **Encoding de nomes em ZIP**: exports do Google Drive frequentemente vem em `cp437`. Reconstrua: `nome.encode("cp437").decode("utf-8")` e normalize com `unicodedata.normalize("NFC", ...)`.
- **Numeros no formato brasileiro**: `1.614` e mil seiscentos e quatorze, nao 1,614. Trate o ponto como separador de milhar (`"2,7 mil" -> 2700`).
- **Datas**: aceite multiplos formatos (`dd/mm/aaaa`, `dd_mm`, `aaaa-mm-dd`, serial do Excel) e converta para ISO `YYYY-MM-DD`. Datas invalidas na fonte (ex.: `27/95/2026`) nao devem virar data errada - preserve o texto original em "Observacoes".
- **Deduplicacao por conteudo**: quando a mesma linha/arquivo aparece repetido, gere um hash do conteudo e agrupe as copias numa observacao, em vez de criar duplicatas.
- **Regra de ouro**: nunca descarte informacao ambigua. O que nao couber num campo tipado vai para uma propriedade `rich_text` "Observacoes".

## 2. Modelagem do schema

- **Defina a granularidade**: "1 linha = 1 conta" e "1 linha = 1 conta x plataforma" sao databases diferentes e complementares - ligue-as por relacao em vez de fundir.
- **Tipos importam**: use `select`/`multi_select` (com cores) para estados, `email`, `url`, `date`, `number`, `checkbox` e `relation` - nao jogue tudo em texto.
- **ID nativo, nao numero no titulo**: use a propriedade `unique_id` (com prefixo, ex. `PRJ`) para numeracao automatica. Nunca cole um numero sequencial dentro do nome da linha. O prefixo de `unique_id` e unico por workspace - use um prefixo distinto por database.
- **Descricao e icone** em cada database deixam a base autoexplicativa.

## 3. Cliente resiliente

Toda migracao real bate em `429` (rate limit) e `5xx` transitorios.

- **Retry com backoff exponencial**, respeitando `Retry-After` quando presente.
- **Distinga idempotencia**: `PATCH` pode ser repetido a vontade; `POST` (criacao) so deve ser repetido em `429`/`529` para nao duplicar.
- **Timeout por requisicao** e um pequeno `sleep` entre escritas evitam estourar o limite.
- **Versao de API por chamada**: algumas rotas novas (data sources, mover database) exigem uma versao de API mais recente sem que voce troque a versao padrao do resto - confira a versao exigida na documentacao oficial do Notion antes de usar rotas novas.

## 4. Importacao idempotente e retomavel

Migracoes grandes (centenas de linhas) vao falhar no meio em algum momento.

- Mantenha um **arquivo de estado local** (`{chave_da_linha: page_id}`) gravado a cada criacao. Ao reexecutar, pule o que ja existe. Isso torna o script retomavel apos crash sem duplicar nada.
- Alternativa no proprio Notion: idempotencia por uma propriedade unica (ex. "Origem"/URL), fazendo upsert - bom para sincronizacoes recorrentes.
- **Fatie texto > 2000 unidades UTF-16** em multiplos itens de `rich_text`; o Notion recusa valores maiores. (O corpo da pagina, em blocos, nao tem esse teto apertado - jogue o conteudo longo la.)

## 5. Anexos: o arquivo original junto do dado

Extrair o conteudo do documento para blocos e otimo para leitura, mas guarde tambem o arquivo original na propriedade `files` da linha.

- Fluxo da File Upload API (parte unica, ate 20 MB): `POST /v1/file_uploads` (cria) -> `POST /v1/file_uploads/{id}/send` (envia `multipart/form-data`) -> referencie `{"type": "file_upload", "file_upload": {"id": ...}}` na propriedade.
- Assim cada linha tem o dado estruturado (propriedades), a leitura (blocos) e a fonte de verdade (arquivo anexado).

## 6. Estrutura de navegacao: pastas viram topicos

Reproduza a hierarquia de pastas como topicos aninhados, e deixe so os arquivos finais como linhas de database.

- **Topico = cabecalho (`heading`) + divisoria + databases/paginas full-page linkadas** logo abaixo. Sem paragrafos longos de introducao no meio.
- **Pasta com subpastas -> pagina-pasta com subtopicos**; cada subpasta e um `heading` + divisoria; o nivel mais fundo e que vira database.
- **Insercao posicional**: a API so anexa blocos no fim de uma pagina, mas o parametro `after` no append permite inserir num ponto especifico - util para colocar um cabecalho imediatamente antes de um link ja existente.

## 7. Reorganizacao programatica (mover, consolidar, arquivar)

Reorganizar nao exige recriar. A API permite re-parentear:

- **Mover pagina**: `PATCH /pages/{id}` com novo `parent`. Atencao: mover uma pagina que contem databases retorna `200` mas e silenciosamente ignorado - nesse caso, mova os databases um a um e descarte a pagina vazia.
- **Mover database**: `PATCH /databases/{id}` com `parent`, exigindo a versao de API que suporta essa rota.
- **Consolidar**: projeto espalhado em varios topicos vira um folder unico movendo as databases para dentro dele.
- **Arquivar, nao destruir**: `PATCH` com `archived: true` manda para a lixeira (recuperavel). Prefira arquivar a apagar; e antes de arquivar algo que voce nao criou, confirme que e mesmo redundante.

---

## Checklist de migracao confiavel

- [ ] A fonte foi normalizada (encoding, datas, numeros BR, dedup) antes de tocar o Notion?
- [ ] Cada informacao ambigua tem destino (campo tipado ou "Observacoes")?
- [ ] O schema usa tipos corretos, `unique_id` com prefixo proprio e relacoes em vez de fusao?
- [ ] O import e idempotente/retomavel (estado local ou upsert por propriedade)?
- [ ] Texto > 2000 e fatiado; conteudo longo foi para o corpo em blocos?
- [ ] O arquivo original foi anexado na propriedade `files`?
- [ ] A navegacao segue "pastas -> topicos; cabecalho + divisoria + links full-page"?
- [ ] A reorganizacao usou re-parent/arquivamento (reversivel), nao recriacao/destruicao?

---

## Anti-padroes a evitar

- Numero sequencial colado no titulo em vez da propriedade `unique_id` nativa.
- Tudo em `rich_text`, perdendo filtros, agrupamentos e cores de `select`.
- Fundir databases de granularidades diferentes em vez de relaciona-las.
- Reexecutar o import do zero sem estado - gera centenas de duplicatas.
- Apagar (destrutivo) quando arquivar resolveria de forma reversivel.
- Chamar a API sem retry - a primeira leva de `429` derruba a migracao.

## Ideias para quem quiser contribuir

- Um cliente Python/TypeScript de referencia com retry, upload e upsert ja prontos, publicavel como pacote separado.
- Script de auditoria que compara o estado local (`{chave: page_id}`) com o workspace real, para detectar divergencias apos falha parcial.
