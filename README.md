# Doktor.com

Landing page pessoal do Doktor — um espaço para apresentar projetos, experiências, estudos e ideias em construção.

## Rodar localmente

```bash
cd site
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

O site é estático, sem framework de aplicação: conteúdo e estrutura vivem em
[`site/index.html`](site/index.html) e a identidade visual em `site/assets/motion.css`.
As interações ficam em `site/src/`, empacotadas por `npm run build` (esbuild) nos bundles
`site/assets/app.js` e `site/assets/hero3d.js` — a cena Three.js é carregada sob demanda.

A publicação no GitHub Pages monta o diretório publicado por allowlist: apenas
`index.html`, `site.webmanifest` e `assets/`. Detalhes em [`site/README.md`](site/README.md).

## DOKTOR SYSTEM DESIGN

O diretório [`doktor SystemDesign/`](doktor%20SystemDesign/) é o sistema de design e as diretrizes compartilhadas do ecossistema Doktor.
