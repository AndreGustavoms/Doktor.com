# DESIGN SYSTEM - MODULARIDADE

> **O que e**: Padrao obrigatorio de granularidade de arquivo. Define o
> tamanho e a fronteira de responsabilidade de cada arquivo do projeto.
>
> **Quando usar**: Ao criar arquivo novo, ao refatorar, ao decidir se
> algo vira modulo proprio, e sempre que um arquivo comecar a crescer.
>
> **Objetivo**: Permitir que uma pessoa - ou uma IA - conserte uma parte
> do sistema lendo apenas os arquivos daquela parte.

---

## 1. Objetivo

A prioridade **nao** e reduzir a quantidade de arquivos.

A prioridade e reduzir:

- leitura desnecessaria;
- consumo de contexto;
- consumo de tokens;
- tempo de analise;
- risco de modificar codigo nao relacionado;
- conflitos durante correcao.

Este e o ponto que diferencia esta regra de um padrao de estilo comum:
**o custo de um arquivo grande nao e estetico, e economico.** Para
trocar a cor de um botao num arquivo de 1700 linhas, a IA le 1700 linhas
- gasta tempo, gasta token e arrisca mexer no que nao devia. Se o botao
mora num arquivo de 60 linhas, ela le 60.

Toda alteracao deve permitir abrir **apenas os arquivos realmente
envolvidos** naquela tarefa. Nunca obrigue quem for manter o projeto a
ler centenas ou milhares de linhas para alterar uma funcionalidade
pequena.

---

## 2. Principio fundamental

**Cada arquivo tem UMA responsabilidade.**

Se um arquivo passa a conter duas ou mais responsabilidades diferentes,
divida. A organizacao do projeto vale mais do que ter poucos arquivos:
40 arquivos de 80 linhas sao melhores que 1 de 3.000.

Ao criar qualquer coisa, pergunte:

> "Essa responsabilidade ja pertence exatamente a este arquivo?"

Se nao for um **sim absoluto**, crie um modulo novo. Na duvida entre
criar arquivo novo ou aumentar o existente, **crie o novo** - desde que
ele represente uma responsabilidade clara e unica.

---

## 3. Arquivo deposito e proibido

Nomes que nao dizem o que o arquivo faz viram lixeira por natureza:

- `utils.ts`, `helpers.ts`, `misc.ts`, `common.ts`, `functions.ts`
- `services.ts` gigante
- `components.tsx` com varios componentes

> **Pasta `utils/` continua valida; arquivo `utils.*` nao.** A estrutura
> de [`DESIGN_SYSTEM_ARQUITETURA.md`](DESIGN_SYSTEM_ARQUITETURA.md)
> prescreve `utils/` para funcoes puras reutilizaveis - o que ela pede e
> que cada arquivo dentro tenha nome descritivo (`formatCurrency.ts`,
> `maskCPF.ts`), nunca um `utils.ts` unico acumulando tudo. O problema
> e o arquivo generico, nao a pasta.

---

## 4. Separacao obrigatoria

Cada item abaixo em seu proprio arquivo:

| Tipo | Regra | Exemplo |
|------|-------|---------|
| Componente | Um por arquivo | `Header.tsx`, `Card.tsx`, `Modal.tsx` |
| Hook | Um por arquivo | `useAuth.ts`, `useTheme.ts` |
| Contexto | Um por arquivo | `ThemeContext.tsx`, `UserContext.tsx` |
| Tipo | Por dominio, nunca tudo junto | `User.ts`, `Order.ts` |
| Constante | Por assunto | `colors.ts`, `routes.ts`, `api.ts` |
| Conteudo/copy | Por bloco | `landing.ts`, `faq.ts`, `pricing.ts` |
| Funcao relevante | Por proposito | `formatDate.ts`, `generateSlug.ts` |

**CSS**: nunca um `index.css` gigantesco. Separe em `variables.css`,
`fonts.css`, `layout.css`, `animations.css` quando crescer.

**Python**: separe por responsabilidade - `routes.py`, `database.py`,
`config.py`, `logger.py`, `window.py`, `actions.py`. Um ponto de entrada
executavel (`start_app.py`) e um **gatilho**: ele importa e chama, nao
concentra a implementacao.

---

## 5. Criterio de quebra

Divida por **responsabilidade**, nao por contagem de linhas.

Teste pratico: o arquivo cabe numa frase simples?

- "Esse arquivo desenha o Header." Bom.
- "Esse arquivo controla a autenticacao." Bom.

Se a frase precisar de **e**, **tambem**, **alem disso**, **outra
coisa** - ha responsabilidades demais.

---

## 6. Limites

Alerta estrutural, nao proibicao automatica. Um arquivo coeso de 220
linhas e melhor que tres picotados de 70 sem sentido proprio - mas
passar do maximo e o sinal de parar e perguntar se ainda ha um so
assunto ali dentro.

| Tipo | Ideal | Alerta | Maximo |
|------|-------|--------|--------|
| Componente | 120 | 150 | 200 |
| Hook | 80 | - | 150 |
| Modulo Python | 150 | 200 | 300 |
| Conteudo | 150 | - | 250 |
| CSS | 150 | - | 250 |
| Documento | 250 | - | 400 |

Estes numeros substituem o intervalo generico de "200-300 linhas" citado
em [`DESIGN_SYSTEM_ARQUITETURA.md`](DESIGN_SYSTEM_ARQUITETURA.md) secao
"Arquivos": aquele documento continua valendo para camadas, nomes e
antipadroes; a granularidade por tipo e definida aqui.

---

## 7. Durante correcao

Abra **apenas os arquivos necessarios**.

E proibido:

- reler o projeto inteiro para uma mudanca localizada;
- modificar arquivo sem necessidade;
- centralizar codigo que estava separado;
- mover responsabilidade para um arquivo maior.

Se a alteracao envolve um componente, mexa naquele componente.

---

## 8. Refatoracao

Ao ver um arquivo crescendo, extraia: componentes, funcoes, hooks,
constantes, tipos, utilidades especificas.

**Nao espere o arquivo ficar gigantesco para modularizar.** O custo de
quebrar cresce junto com o arquivo.

Quebra estrutural merece **commit proprio**: nao reorganize um arquivo
grande "de passagem" numa tarefa que nao o envolve.

---

## 9. Checklist de entrega

- [ ] Cada responsabilidade permanece isolada.
- [ ] Nenhum arquivo virou deposito (nome generico acumulando coisas).
- [ ] A alteracao exigiu ler apenas os arquivos realmente envolvidos.
- [ ] Nenhum arquivo passou do maximo da secao 6 sem motivo registrado.
- [ ] Um componente, um hook, um contexto por arquivo.
- [ ] Texto e copy fora dos componentes.
- [ ] A proxima pessoa - ou IA - consegue modificar aquela parte sem
      analisar centenas de linhas desnecessarias.

---

## 10. Frase de controle

Se consertar um detalhe do sistema obriga a ler um arquivo enorme, o
problema nao e de quem esta consertando: e da estrutura.
