# Painel GitHub

Painel local de gestão dos meus repositórios GitHub. Roda exclusivamente
em `127.0.0.1` — não é um SaaS, não tem multi-tenant, não é para ficar
exposto na internet.

## O que é

- Um cockpit privado, de usuário único, para ver e operar todos os meus
  repositórios num lugar só.
- Uma ferramenta de trabalho: ler, editar, comitar, abrir issues,
  disparar workflows, publicar releases — sem sair da interface.
- Um gerador de portfólio público: a partir dos repositórios marcados,
  exporta um site estático (`out/portfolio/`) para publicar em qualquer
  host estático.

## Documentação

- [docs/SETUP.md](docs/SETUP.md) — passo a passo do primeiro boot.
- [docs/SECURITY.md](docs/SECURITY.md) — modelo de ameaça e checklist de
  segurança, com o arquivo que implementa cada defesa.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — decisões arquiteturais e
  a regra de ouro server/client.
- [docs/API.md](docs/API.md) — contrato de cada rota.

## Comandos

```bash
npm ci              # instala dependências (nunca npm install no fluxo padrão)
npm run dev          # inicia em http://127.0.0.1:3000
npm run check        # lint + testes + audit — roda antes de qualquer commit relevante
npm run build         # build de produção; falha se achar segredo no bundle
```

Veja `package.json` para a lista completa de scripts.
