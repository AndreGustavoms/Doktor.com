# Doktor.com

Monorepo com os projetos do Doktor.

| Pasta | O que é |
|---|---|
| [`painel-github/`](painel-github/) | Painel local de gestão dos repositórios do GitHub — roda só em `127.0.0.1`, com o token cifrado num vault local. Next.js, SQLite, Octokit. |
| [`site/`](site/) | Landing page de portfólio. Arquivo único, sem build. Publicada em [andregustavoms.github.io/Doktor.com](https://andregustavoms.github.io/Doktor.com/). |
| `system-design/` | Submodule do [Doktor System Design](https://github.com/AndreGustavoms/Doktor-SystemDesign) — diretrizes de arquitetura e padrões compartilhados entre os projetos. |

## Clonar

O `system-design/` é um submodule, então um clone comum traz a pasta
vazia. Para vir completo:

```bash
git clone --recurse-submodules https://github.com/AndreGustavoms/Doktor.com.git
```

Se você já clonou sem isso:

```bash
git submodule update --init --recursive
```

Para atualizar o submodule quando o System Design mudar:

```bash
git submodule update --remote system-design
```

> O System Design vive num repositório próprio e é referenciado aqui, não
> copiado — o padrão tem uma fonte só, e mudanças nele não precisam ser
> replicadas à mão em cada projeto que o usa.

## Rodar o painel

```bash
cd painel-github
npm install
npm run dev
```

Setup completo, escopos do token e verificação de segurança em
[`painel-github/docs/SETUP.md`](painel-github/docs/SETUP.md).
