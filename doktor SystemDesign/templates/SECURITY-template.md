# Security

## Escopo

Este documento registra cuidados minimos de seguranca do projeto.

## Dados Sensiveis

Liste os dados sensiveis tratados:

- credenciais;
- dados pessoais;
- tokens;
- arquivos privados;
- informacoes financeiras.

## Variaveis e Segredos

- [ ] `.env` real nao esta versionado.
- [ ] `.env.example` existe sem segredo real.
- [ ] Tokens ficam em cofre, variaveis de ambiente ou painel da plataforma.
- [ ] Logs nao imprimem segredo.

## Autenticacao e Autorizacao

- Metodo:
- Rotas protegidas:
- Perfis/permissoes:
- Reautenticacao para acoes sensiveis:

- [ ] Sessao e server-side ou o token tem expiracao curta e revogacao possivel.
- [ ] Autorizacao e checada no backend, nao so escondida na interface.
- [ ] Acesso a recurso valida dono/permissao (evita IDOR).
- [ ] 2FA disponivel para contas com acesso privilegiado, quando fizer sentido.

## Validacao de Entrada

- [ ] Inputs de usuario sao validados.
- [ ] Uploads tem limite e tipo permitido.
- [ ] IDs externos sao checados antes de acesso.
- [ ] Queries usam parametros/ORM, nunca concatenacao de string (anti SQL injection).
- [ ] Saida para HTML e escapada (anti XSS).

## Auditoria e Observabilidade

- [ ] Acoes sensiveis (login, troca de senha, exclusao, acesso a dado pessoal)
      geram registro de auditoria.
- [ ] Logs guardam quem, o que e quando - sem gravar segredo ou dado sensivel.
- [ ] Existe forma de detectar tentativa de acesso indevido (falhas repetidas).

## Rate Limit e Abuso

- [ ] Rotas de login e recuperacao de senha tem rate limit.
- [ ] Endpoints custosos ou publicos tem limite por IP/usuario.
- [ ] Lockout ou backoff apos varias falhas de autenticacao.

## Cabecalhos e Transporte

- [ ] HTTPS obrigatorio (redirect de HTTP; HSTS quando aplicavel).
- [ ] Cabecalhos de seguranca definidos (CSP, X-Content-Type-Options, etc.).
- [ ] Cookies sensiveis usam `HttpOnly`, `Secure` e `SameSite`.

## Dependencias

```bash
comando para auditoria de dependencias
```

- [ ] Auditoria de dependencias roda em CI ou antes de release.
- [ ] Ha varredura de segredos no repositorio (ver hooks em `scripts/hooks/`).

## Dados Pessoais (LGPD)

Se o projeto trata dados pessoais, preencha tambem o guia de privacidade.

- [ ] `PRIVACIDADE.md` existe (base: [PRIVACIDADE-LGPD-template.md](PRIVACIDADE-LGPD-template.md)).
- [ ] Dados pessoais em repouso e transito estao protegidos.
- [ ] Retencao e eliminacao de dados pessoais estao definidas.

## Checklist Antes do Deploy

- [ ] CORS revisado.
- [ ] Debug desativado em producao.
- [ ] Banco de producao nao usa credencial padrao.
- [ ] Rate limit aplicado onde fizer sentido.
- [ ] Backups ou exportacao foram considerados.
- [ ] Mensagens de erro em producao nao vazam stack trace ou dado interno.

## Contato

Informe como reportar vulnerabilidades.
