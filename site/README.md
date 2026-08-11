# site

Landing page de portfólio — arquivo único, sem dependências e sem build.

`index.html` traz o CSS e o JavaScript embutidos: nenhuma requisição de rede
em runtime, nenhuma fonte de CDN (as famílias usadas são de sistema, com
fallback declarado em cada stack). Abre com um duplo-clique.

## Publicar

Como é estático e autocontido, qualquer host serve. As duas rotas mais
diretas:

**GitHub Pages** — em Settings → Pages, aponte a origem para a branch
`main` e a pasta `/site`.

**Vercel / Netlify** — importe o repositório e configure o diretório raiz
como `site`, sem comando de build.

## Editar

O conteúdo (projetos, textos, contato) está no HTML direto, na marcação
das seções `#trabalhos`, `#metodo`, `#numeros` e `#contato`. Os tokens de
cor e as famílias tipográficas ficam no bloco `:root` no topo do `<style>`
— mudar a paleta inteira é mudar aquelas variáveis.

Movimento respeita `prefers-reduced-motion`: com a preferência ativa, as
animações de entrada, o brilho que segue o cursor e o marquee param.
