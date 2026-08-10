# Setup

> Preenchido nas Fases 1–2 (vault, sessão, camada GitHub). Este é um
> placeholder da Fase 0 — os comandos abaixo já funcionam para rodar o
> scaffold, mas o wizard de `/setup` e a criação do fine-grained PAT
> ainda não existem.

## Pré-requisitos

- Node.js 20 LTS ou superior (testado com Node 24).
- [gitleaks](https://github.com/gitleaks/gitleaks) instalado e no PATH —
  necessário para os hooks do lefthook funcionarem (`winget install
  Gitleaks.Gitleaks` no Windows).
- Opcional: [mkcert](https://github.com/FiloSottile/mkcert) para HTTPS
  local (ver docs/SECURITY.md §4.15 no prompt original).

## Instalação

```bash
npm ci
npm run prepare   # instala os hooks do lefthook
npm run dev        # http://127.0.0.1:3000
```

## Próximas fases

- **Fase 1** traz o wizard de `/setup`, que vai pedir a senha mestra e o
  token do GitHub e substituir este documento por instruções reais de
  criação de fine-grained PAT com os escopos exatos.
