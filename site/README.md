# Doktor

Landing page e portfólio público do laboratório Doktor. A interface combina direção editorial, azul como assinatura e um Signal Core proprietário, com projetos selecionados e repositórios públicos atualizados pelo GitHub.

## Rodar localmente

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Estrutura

- `index.html`: conteúdo e estrutura da landing page.
- `assets/motion.css`: identidade visual e responsividade.
- `src/main.js`: navegação, estados de seção, pausa do Signal Core, busca e integração pública com o GitHub.
- `assets/app.js`: bundle estático gerado por `npm run build`.

O projeto é uma landing page pública, sem login, dashboard ou painel administrativo.
