# DoktorDev

Landing page e portfólio público do laboratório DoktorDev. A experiência combina direção editorial, tipografia expressiva e composições próprias para apresentar projetos selecionados e repositórios públicos atualizados pelo GitHub.

## Rodar localmente

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

O servidor de desenvolvimento escuta somente em `localhost` e responde `400 Bad Request` para
URLs malformadas. Ele não deve ser usado como servidor público de produção; o deploy previsto é
o GitHub Pages.

## Estrutura

- `index.html`: conteúdo e estrutura da landing page.
- `assets/motion.css`: identidade visual, composições de projeto, movimento e responsividade.
- `src/main.js`: navegação, progresso de leitura, pausa de animações, busca e integração pública com o GitHub.
- `src/hero3d.js`: cena Three.js carregada sob demanda, com o símbolo oficial extrudado, material físico, iluminação e órbitas.
- `assets/doktordev-lockup-dark.svg`: assinatura oficial DoktorDev.com para fundos escuros.
- `assets/doktordev-mark.svg`: símbolo oficial isolado da identidade DoktorDev.
- `assets/favicon.svg`, `favicon.ico` e ícones PNG: conjunto derivado da versão sólida oficial para navegadores e dispositivos.
- `assets/og-doktordev-v1.png`: aplicação oficial da marca para compartilhamentos em redes sociais.
- `site.webmanifest`: identidade, cores e ícones da experiência instalável.
- `assets/app.js`: bundle estático gerado por `npm run build`.

O projeto é uma landing page pública, sem login, dashboard ou painel administrativo.
