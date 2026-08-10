# Padroes Observados no GitHub

Este documento registra padroes recorrentes observados nos repositorios publicos de [AndreGustavoms](https://github.com/AndreGustavoms), sem transformar uma amostra pequena em regra absoluta.

## Escopo da leitura

Leitura inicial feita em 2026-06-22, atualizada em 2026-07-27, considerando apenas informacao publica:

| Fonte | Papel na leitura |
|---|---|
| [AndreGustavoms](https://github.com/AndreGustavoms) | Perfil publico e lista de repositorios publicos. |
| [AndreGustavoms/Contas.exe](https://github.com/AndreGustavoms/Contas.exe) | Principal repositorio autoral publico analisado (produto operacional). |
| [AndreGustavoms/MeuEcooBETA](https://github.com/AndreGustavoms/MeuEcooBETA) | Segundo repositorio autoral analisado (landing page de trabalho). Adiciona um caso de frontend puro sem backend, util para contrastar com o padrao "produto operacional" do Contas.exe. |
| [AndreGustavoms/Doktor-SystemDesign](https://github.com/AndreGustavoms/Doktor-SystemDesign) | Fork/base de system design; usado como contexto, nao como prova estetica autoral. |

Limite importante: havia poucos repositorios publicos. As conclusoes abaixo devem orientar a direcao inicial, mas cada projeto ainda precisa decidir conforme dominio, publico e restricoes.

## Perfil geral observado

O padrao mais forte e:

- produto operacional, nao landing page;
- frontend rico;
- backend pragmatico;
- seguranca tratada como parte da arquitetura;
- documentacao operacional versionada;
- deploy simples;
- componentes proprios em vez de biblioteca visual pesada;
- interface densa, clara e controlada.

Em uma frase:

> Priorizar ferramenta funcional, segura e bem documentada, com visual limpo, moderno e discreto.

## Padrao estetico observado

### Linguagem visual

O estilo publico mais claro e um app operacional com:

- superficie clara por padrao;
- suporte a tema escuro;
- cards limpos com borda sutil;
- sombras leves;
- cantos moderadamente arredondados;
- acento verde/ciano para acao, sucesso e foco;
- badges pequenos para status;
- icones Lucide em acoes;
- textos compactos;
- hierarquia visual por espacamento, peso e cor, nao por decoracao pesada.

### Paleta

Padrao observado:

| Uso | Direcao |
|---|---|
| Fundo claro | cinza claro frio, proximo de `#e9edf3` |
| Superficie | branco ou branco translucido |
| Texto | azul/preto frio, proximo de slate |
| Muted | slate/cinza azulado |
| Acento principal | verde/emerald |
| Acento secundario | ciano/sky |
| Estados | verde, amarelo, vermelho, neutro |

Aplicacao recomendada:

- use verde como acento funcional, nao como banho de cor;
- use ciano/azul apenas como apoio tecnologico;
- preserve bastante neutro para ferramentas de leitura e gestao;
- evite gradientes dominando a UI.

### Componentes

Componentes recorrentes:

- `Button` com variantes `default`, `outline`, `ghost`, `secondary`, `danger`;
- `Card`, `CardHeader`, `CardContent`, `CardFooter`;
- `Badge` por status;
- inputs com altura minima mobile de 44px;
- botoes com alvo de toque de 44px;
- theme toggle claro/escuro;
- icones `lucide-react`;
- classes utilitarias com tokens CSS (`--accent`, `--panel`, `--border`, `--muted`).

Regra pratica:

- comece com primitives proprias pequenas;
- use biblioteca externa para icones, nao para dominar a identidade visual;
- mantenha controles previsiveis e escaneaveis;
- em app operacional, cards devem agrupar informacao real, nao decorar a pagina.

### Layout

Padroes observados:

- app shell com navegacao compacta;
- dashboards e paineis administrativos;
- listas com busca, filtro, status e acoes;
- conteudo denso, mas dividido por superficies;
- mobile tratado como requisito real;
- estados e acoes criticas destacados.

## Padrao arquitetural observado

O repositorio autoral publico analisado aponta para:

| Camada | Padrao observado |
|---|---|
| Frontend | React + TypeScript + Vite |
| UI | Tailwind CSS + componentes proprios |
| Icones | Lucide React |
| Backend | Node.js pragmatico |
| Banco | PostgreSQL como persistencia real |
| Deploy | servico unico no inicio |
| Operacao local | script de start local |
| Documentacao | README, IA, arquitetura, deploy, seguranca |
| Seguranca | sessao server-side, reauth, auditoria, rate limit, 2FA quando faz sentido |

Isso nao substitui a baseline de [STACK-E-ARQUITETURA.md](STACK-E-ARQUITETURA.md). A leitura sugere uma variante pessoal forte para produtos fullstack em JavaScript:

```text
React + TypeScript + Vite + Tailwind
Node.js
PostgreSQL
deploy simples em um servico
documentacao operacional versionada
```

### Caso frontend puro: MeuEcooBETA

`MeuEcooBETA` e uma landing page de trabalho (projeto "Ecoo"), sem backend, com:

- React 19 + TypeScript + Vite;
- Tailwind CSS v4 com tema proprio (`ecoo`/`ink`) declarado em `src/index.css`;
- estrutura de secoes: `Hero`, `FeatureRow`, `FaqAccordion`, `EmailCTA`, `Footer`, `Logo`;
- conteudo de texto isolado em `data/content.ts`, separado dos componentes visuais;
- inspiracao apenas na estrutura de secoes comuns a paginas de streaming, sem copiar identidade visual de terceiros.

Isso mostra que o padrao autoral nao se limita a apps operacionais: quando o pedido e uma landing page, a mesma disciplina de stack (React + TS + Vite + Tailwind) e mantida, mas a organizacao vira "secoes de pagina" em vez de "app shell com dashboard". Separar texto/conteudo de componente (`data/content.ts`) e um padrao a reaproveitar em landing pages Doktor.

## Padrao de documentacao observado

Fortes sinais positivos:

- README com badges, stack, arquitetura, estrutura e comandos;
- `IA.md` como contexto operacional;
- docs separadas para arquitetura, deploy, seguranca e privacidade;
- checklist de seguranca;
- script de varredura de segredos;
- decisao arquitetural documentada no repositorio.

Recomendacao para projetos Doktor:

1. Todo app serio deve ter `IA.md`.
2. Todo app com deploy deve ter `docs/DEPLOY.md`.
3. Todo app com usuario, conta, token ou segredo deve ter `SECURITY.md`.
4. Todo app com dados pessoais deve ter guia de privacidade/LGPD.
5. README deve explicar o produto e como rodar, nao so listar tecnologias.

## O que levar para o Doktor System-Design

Use como direcao inicial **para produto operacional** que nao trouxer identidade propria. Produto de marca segue outro caminho - veja os dois modos em [IDENTIDADE-DOKTOR.md](IDENTIDADE-DOKTOR.md).

- ferramenta antes de marketing;
- interface operacional, clara e compacta;
- tema claro forte com dark mode opcional;
- acento unico e funcional sobre neutros frios (no `Contas.exe`, verde/ciano - mas a cor e da marca, nao do Doktor);
- cards e badges para organizar dados;
- componentes proprios pequenos;
- Lucide para iconografia;
- documentacao viva no repo;
- seguranca desde o primeiro desenho.

## Referencia externa: ecossistema VS (contexto de trabalho)

Esta secao documenta uma referencia **externa**, nao autoral. Ela existe porque o autor (AndreGustavoms) trabalha proximo desse ecossistema, e pode ser util como ponto de comparacao, mas nao representa identidade Doktor nem deve virar padrao por padrao.

Fonte publica: [flaviavs-commits](https://github.com/flaviavs-commits), bio "SaaS com IA + Infraestrutura AWS", ecossistema de produto chamado "VS" (Vitis Souls).

Repositorio mais relevante para frontend: [vs-app-toolkit](https://github.com/flaviavs-commits/vs-app-toolkit) - um gerador de apps satelite do ecossistema VS, com:

- backend Express + Prisma;
- frontend React 18 + TypeScript + Vite + Tailwind CSS;
- autenticacao via Firebase (Google OAuth) + JWT proprio, extraida de um app financeiro em producao;
- "membership gate" (bloqueio por assinatura) aplicado tanto no frontend quanto no backend;
- estrutura do template com `src/auth/` (modulo pronto, nao mexer) e `src/AppContent.tsx` (onde o app especifico comeca) - um padrao de "core compartilhado + area livre por app".

Outros repositorios da mesma conta sao majoritariamente forks de [Felipe-Alcantara](https://github.com/Felipe-Alcantara) (`Felixo-System-Design`, ferramentas de Notion/MCP), ou seja, essa conta parte da **mesma linhagem de system design** que originou o Doktor, mas evoluiu de forma independente. Nao ha colaboracao direta entre as duas contas nos repositorios publicos analisados.

O que pode ser util observar do vs-app-toolkit:

- separar um "core" de autenticacao/gate reutilizavel do restante do app, quando varios produtos compartilham login;
- Firebase como opcao valida para auth social rapida, quando o projeto pedir login Google sem construir OAuth do zero;
- gerar esqueleto de app via script (`create-vs-app.py`) para produtos satelite de um mesmo ecossistema.

Isso **nao** substitui a stack padrao Doktor nem a direcao estetica de `IDENTIDADE-DOKTOR.md`. E contexto de mercado, nao decisao de identidade.

## O que nao deve virar regra cega

- Node.js nao deve substituir Django/Python em todos os backends.
- Radius mais arredondado nao deve ser usado em toda UI densa sem criterio.
- Tema verde/ciano nao deve ser forcado em projetos com outra marca.
- Um servico unico nao deve impedir separacao quando houver jobs, filas ou escala real.
- Publicacao de repositorios privados nao foi analisada; nao inferir padroes deles.
- O ecossistema VS (`flaviavs-commits`) e referencia externa de mercado, nao autoria Doktor; Firebase, Prisma e o padrao "membership gate" nao devem ser adotados por padrao so porque aparecem la.

## Checklist rapido para um novo projeto com identidade Doktor

- [ ] A primeira tela entrega uma ferramenta real, nao uma landing page vazia.
- [ ] A UI usa superficies neutras e acento funcional.
- [ ] Existem estados de loading, vazio, erro e sucesso.
- [ ] Componentes base estao em `components/ui`.
- [ ] Icones vem de Lucide quando houver equivalente.
- [ ] `IA.md` existe desde o inicio.
- [ ] README explica produto, stack, estrutura e comandos.
- [ ] Segredos e dados sensiveis foram pensados antes do deploy.
- [ ] Deploy inicial e simples, mas nao bloqueia evolucao futura.

