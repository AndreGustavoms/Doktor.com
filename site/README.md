# DoktorDev

Landing page e portfólio público do laboratório DoktorDev. A experiência combina direção editorial, tipografia expressiva e composições próprias para apresentar projetos selecionados e repositórios públicos atualizados pelo GitHub.

## Rodar localmente

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

Versão pública: [https://andregustavoms.github.io/Doktor.com/](https://andregustavoms.github.io/Doktor.com/).

## Testes

```bash
npm test
```

Cobrem o servidor de desenvolvimento, com foco na proteção contra path traversal:
sobem `server.mjs` numa porta livre e fazem requisições reais, sem precisar alterar
o servidor. As tentativas de escape miram arquivos que existem **apenas** acima de
`site/` — se o conteúdo deles aparecer numa resposta, o teste falha.

Os testes usam apenas `node --test`, sem dependência nova. Não são publicados: a
pasta `tests/` não está na allowlist do artefato.

## Domínio próprio no futuro

O projeto está preparado para receber um domínio próprio, mas nenhum `CNAME` foi criado enquanto o domínio não estiver disponível. Quando decidir aplicar um domínio:

1. Adicione o domínio personalizado em `Settings → Pages → Custom domain` no GitHub.
2. No provedor DNS, crie um registro `CNAME` apontando `www` para `andregustavoms.github.io`.
3. Para o domínio raiz, configure os registros `A` do GitHub Pages conforme a documentação do GitHub.
4. Ative `Enforce HTTPS` depois que o certificado for emitido.

Até lá, a URL oficial continua sendo o endereço do GitHub Pages acima.

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
- `projeto.html`: página interna de detalhe dos projetos, alimentada por `assets/project.js`.

O projeto é uma landing page pública, sem login, dashboard ou painel administrativo.

Para executar a suíte de segurança do servidor local:

```bash
npm test
```

Os testes cobrem carregamento de assets, URLs malformadas, listagem de diretórios e tentativas de path traversal.

## Publicação

O deploy no GitHub Pages monta o diretório publicado por **allowlist**: entra apenas
`index.html`, `site.webmanifest` e `assets/`. Nada mais é copiado.

Ficam fora do artefato, por não serem necessários para servir o site:
`package.json`, `package-lock.json`, `server.mjs`, `src/` e este `README.md`.
Eles continuam versionados no repositório — apenas não são servidos.

Ao adicionar um arquivo que precise ser público, inclua-o explicitamente no passo
`Montar artefato apenas com o que é público` de `.github/workflows/deploy-site.yml`.
O passo seguinte valida o artefato e falha a publicação se um item não público ou uma
extensão sensível (`.map`, `.bak`, `.old`, `.sql`, dotfiles) chegar ao diretório publicado.
