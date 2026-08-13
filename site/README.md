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
- `src/hero3d.js`: cena Three.js carregada sob demanda, com o símbolo oficial extrudado, material físico, iluminação e órbitas.
- `assets/doktor-mark.svg`: símbolo oficial da identidade Doktor, usado em assinaturas e aplicações de marca.
- `assets/favicon.svg`, `favicon.ico` e ícones PNG: conjunto derivado da versão sólida oficial para navegadores e dispositivos.
- `assets/og-doktor-v4.png`: aplicação oficial da marca para compartilhamentos em redes sociais.
- `site.webmanifest`: identidade, cores e ícones da experiência instalável.
- `assets/app.js`: bundle estático gerado por `npm run build`.

O projeto é uma landing page pública, sem login, dashboard ou painel administrativo.
