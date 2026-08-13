# Doktor

Landing page e portfólio público do laboratório Doktor. A experiência combina direção editorial, tipografia expressiva e composições próprias para apresentar projetos selecionados e repositórios públicos atualizados pelo GitHub.

## Rodar localmente

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Estrutura

- `index.html`: conteúdo e estrutura da landing page.
- `assets/motion.css`: identidade visual, composições de projeto, movimento e responsividade.
- `src/main.js`: navegação, progresso de leitura, pausa de animações, busca e integração pública com o GitHub.
- `src/hero3d.js`: cena Three.js carregada sob demanda, com o D extrudado, material físico, iluminação e órbitas.
- `assets/app.js`: bundle estático gerado por `npm run build`.

O projeto é uma landing page pública, sem login, dashboard ou painel administrativo.
