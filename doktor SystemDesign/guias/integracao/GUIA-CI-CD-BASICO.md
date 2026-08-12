# Guia CI/CD Basico

## Quando usar

Use um pipeline de CI (integracao continua) sempre que o projeto tiver testes automatizados e mais de uma pessoa (ou agente de IA) contribuindo - o pipeline roda testes/lint automaticamente a cada push/PR, sem depender de alguem lembrar de rodar localmente. Use CD (entrega continua) quando o deploy puder ser automatizado com seguranca (ver `GUIA-DEPLOY-RAILWAY.md` para o deploy em si).

## Quando nao usar

Nao crie workflow de CI so para existir se o projeto ainda nao tem teste automatizado nenhum - primeiro escreva os testes (ver `DESIGN_SYSTEM_TESTES.md`), depois automatize a execucao deles. Nao duplique automacao: se a plataforma de deploy (Railway, Vercel) ja faz autodeploy nativo a partir do branch, nao crie um segundo workflow so para redeployar (ver `GUIA-DEPLOY-RAILWAY.md`, secao 3).

## Resultado esperado

- Todo push/PR roda lint, testes e build automaticamente.
- PR fica bloqueado de merge se o pipeline falhar (quando o repositorio usa esse fluxo).
- Segredos do pipeline (tokens, chaves de API) ficam em variaveis protegidas da plataforma de CI, nunca no arquivo de workflow.
- Falha do pipeline aponta claramente qual etapa falhou (lint, teste, build), sem precisar abrir o log inteiro.

## 1. Estrutura minima (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - name: Instalar dependencias
        run: pip install -r requirements.txt
      - name: Lint
        run: ruff check .
      - name: Testes
        run: pytest --tb=short
```

Para stack Node/TypeScript, o equivalente:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

## 2. Cache de dependencias

Instalar dependencias do zero a cada execucao desperdica tempo (e minutos de CI, que em muitas plataformas tem custo). Use o cache nativo da action de setup.

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: "20"
    cache: "npm"  # cacheia node_modules entre execucoes
```

Para Python, `actions/setup-python` tem opcao equivalente de cache de `pip`.

## 3. Segredos do pipeline

- Segredos (tokens de deploy, chaves de API de teste) ficam em "Secrets" da plataforma de CI (GitHub Actions Secrets, etc.), nunca escritos no arquivo `.yml`. Mesmo principio de secrets do repo: [`../../core/DESIGN_SYSTEM_SEGURANCA.md`](../../core/DESIGN_SYSTEM_SEGURANCA.md).
- Nunca imprima o valor de um secret em log (`echo $TOKEN` vaza o valor no log publico do workflow).

```yaml
- name: Deploy
  env:
    DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
  run: ./deploy.sh
```

## 4. Matriz de versoes (quando fizer sentido)

Se o projeto precisa suportar mais de uma versao de linguagem/runtime, rode a matriz - mas so adicione essa complexidade se houver motivo real (biblioteca compartilhada, suporte a versao antiga do cliente).

```yaml
strategy:
  matrix:
    python-version: ["3.11", "3.12"]
steps:
  - uses: actions/setup-python@v5
    with:
      python-version: ${{ matrix.python-version }}
```

## 5. Bloquear merge com pipeline falhando

Configure a branch protegida (`main`) para exigir que o workflow de CI passe antes do merge (regra da plataforma de hospedagem do git, nao do arquivo de workflow em si). Isso evita que codigo quebrado entre no branch principal mesmo em fluxo de commit direto (ver `docs/GIT-POLITICA-DE-VERSIONAMENTO.md`).

## 6. Etapas com nome claro

Nomeie cada step do jeito que aparece na interface de CI - quando falhar, quem le o resultado deve entender o que quebrou sem abrir o log.

```yaml
steps:
  - name: Checkout do codigo
    uses: actions/checkout@v4
  - name: Instalar dependencias
    run: npm ci
  - name: Verificar formatacao e lint
    run: npm run lint
  - name: Rodar testes unitarios
    run: npm run test
  - name: Build de producao
    run: npm run build
```

## 7. CD: deploy automatico apos CI passar

Quando o deploy nao e feito por autodeploy nativo da plataforma (ver `GUIA-DEPLOY-RAILWAY.md`), condicione o deploy ao sucesso do job de teste.

```yaml
jobs:
  test:
    # ... (como acima)

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy
        env:
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
        run: ./deploy.sh
```

`needs: test` garante que o deploy so roda se os testes passaram. O `if` restringe a push direto no `main` (nao roda deploy em PR de outro branch).

## 8. Notificacao de falha

Para times pequenos, a propria notificacao nativa da plataforma de CI (email, badge no PR) costuma bastar. So adicione integracao externa (Slack, Discord) quando o time realmente monitorar esse canal - notificacao que ninguem le e ruido, nao observabilidade.

## Checklist

- [ ] Todo push/PR roda lint + testes automaticamente.
- [ ] Cache de dependencias esta configurado (nao reinstala do zero a cada execucao sem necessidade).
- [ ] Nenhum segredo aparece no arquivo de workflow nem e impresso em log.
- [ ] Branch principal exige que o pipeline passe antes do merge (quando o fluxo do repositorio usa PR).
- [ ] Cada etapa do workflow tem nome claro o suficiente para identificar a falha sem abrir o log completo.
- [ ] Deploy automatico (se existir) so roda apos os testes passarem (`needs`).
- [ ] Nao ha workflow duplicado fazendo o que o autodeploy nativo da plataforma de hospedagem ja cobre.

## Ideias para quem quiser contribuir

- Templates prontos de `.github/workflows/ci.yml` por stack padrao do Doktor (Django+pytest, React+Vitest).
- Guia complementar de CI para GitLab CI/CD e outras plataformas alem do GitHub Actions.
