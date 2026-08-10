# Guia Autenticacao JWT e OAuth

## Quando usar

Use quando a API precisa autenticar usuarios via token (JWT stateless) e/ou permitir login por provedor externo (Google, GitHub, Microsoft) via OAuth2/OpenID Connect.

## Quando nao usar

Nao use JWT quando o sistema ja tem sessao de servidor tradicional funcionando bem e nao precisa de API stateless para mobile/SPA - sessao com cookie httponly e mais simples e mais segura por padrao contra XSS. Nao implemente OAuth do zero: use uma biblioteca madura do framework (`djangorestframework-simplejwt` + `django-allauth`, `next-auth`, `authlib`, etc.) em vez de reescrever o fluxo de autorizacao.

## Resultado esperado

- Login retorna access token de vida curta e refresh token de vida mais longa.
- Rotas protegidas rejeitam token ausente, expirado ou invalido com erro previsivel.
- Refresh token e revogavel (logout de verdade invalida a sessao).
- Senha nunca fica em texto claro nem em log.
- Fluxo OAuth (quando usado) valida `state` contra CSRF e nao expoe `client_secret` no frontend.

## 1. Estrutura de tokens

| Token | Duracao tipica | Onde fica |
|---|---|---|
| Access token | 5-15 minutos | Memoria do cliente (nao localStorage se puder evitar) ou header Authorization |
| Refresh token | Dias a semanas | Cookie httponly + secure + samesite, nunca acessivel via JS |

Vida curta do access token limita o dano de um token vazado; o refresh token revogavel permite forcar logout mesmo com access token ainda tecnicamente valido.

## 2. Fluxo de login com JWT (exemplo Django + DRF)

```python
# settings.py
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=10),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
}
```

```python
# views.py
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("auth/login/", TokenObtainPairView.as_view()),
    path("auth/refresh/", TokenRefreshView.as_view()),
]
```

`ROTATE_REFRESH_TOKENS` + `BLACKLIST_AFTER_ROTATION` garantem que cada refresh invalida o token anterior - um refresh token roubado e usado uma vez perde validade.

## 3. Hash de senha

Nunca implemente hash de senha proprio. Use o hasher padrao do framework (PBKDF2, argon2 ou bcrypt via biblioteca madura).

```python
# Django ja faz isso por padrao via AbstractUser/AUTH_PASSWORD_VALIDATORS.
# Para outros stacks, ex. Node:
import bcrypt

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())
```

- Nunca logue senha (nem em erro, nem em request payload de debug).
- Nunca compare senha com `==` em texto claro - sempre pelo hasher.
- O mesmo cuidado vale para token JWT (access e refresh): nunca aparecem em log, nem em stack trace de erro. Ver `guias/integracao/GUIA-OBSERVABILIDADE-LOGS-E-HEALTHCHECKS.md`, secao 4, para a lista completa do que nunca vai para o log.

## 4. Protegendo rotas

```python
# DRF: permission_classes trata autenticacao/autorizacao por rota
from rest_framework.permissions import IsAuthenticated

class ProtectedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"user_id": request.user.id})
```

- Rota sem token: `401 Unauthorized`.
- Token expirado: `401` com corpo que indica expiracao (para o cliente saber que deve fazer refresh, nao apenas repetir a chamada).
- Token valido mas usuario sem permissao para o recurso: `403 Forbidden`, nunca `401`.

## 5. Autorizacao por objeto (evitar IDOR)

Autenticacao confirma quem e o usuario; autorizacao confirma se ele pode acessar aquele recurso especifico. Checar so a rota nao basta.

```python
def get_invoice(request, invoice_id):
    invoice = Invoice.objects.get(id=invoice_id)
    if invoice.owner_id != request.user.id:
        raise PermissionDenied()  # 403, nao 404 (a menos que 404 seja a politica de ocultar existencia)
    return invoice
```

Sem essa checagem, o usuario A troca o id na URL e acessa o recurso do usuario B (Insecure Direct Object Reference - ver `DESIGN_SYSTEM_SEGURANCA.md`).

## 6. Logout e revogacao

Logout stateless "de mentirinha" (so apagar o token no cliente) nao revoga nada no servidor - se o token vazou antes, continua valido ate expirar.

```python
# Blacklist do refresh token no logout real
from rest_framework_simplejwt.tokens import RefreshToken

def logout(request):
    token = RefreshToken(request.data["refresh"])
    token.blacklist()
```

Para revogacao imediata de access token (raro, mas necessario em incidentes de seguranca), mantenha uma lista de revogacao com TTL igual a vida do access token, ou aceite o atraso ate a expiracao natural do token curto.

## 7. OAuth2 / login social

Nao implemente o fluxo de authorization code manualmente. Use biblioteca madura (`django-allauth`, `authlib`, `next-auth`, `passport.js`) e siga a checklist:

- `redirect_uri` registrado exatamente igual (sem barra a mais/menos) no provedor.
- `state` gerado por requisicao e validado no callback (previne CSRF no fluxo OAuth).
- `client_secret` fica so no backend - nunca no bundle do frontend.
- Escopos (`scope`) pedidos sao o minimo necessario (nao peca acesso a Drive inteiro so para pegar email/nome).
- Apos callback, o backend emite o proprio token de sessao/JWT da aplicacao - o token do provedor (Google, GitHub) nao deve circular como se fosse o token da aplicacao.

```python
# Fluxo resumido
# 1. Frontend redireciona para o provedor com client_id, redirect_uri, state, scope
# 2. Usuario autoriza no provedor
# 3. Provedor redireciona de volta com "code" e o mesmo "state"
# 4. Backend valida "state", troca "code" por token do provedor (server-to-server)
# 5. Backend busca perfil no provedor, cria/atualiza usuario local
# 6. Backend emite o proprio access/refresh token da aplicacao
```

## 8. Rate limiting em login

Limite tentativas de login por IP/usuario para dificultar brute force e credential stuffing.

```python
# django-ratelimit, exemplo
from django_ratelimit.decorators import ratelimit

@ratelimit(key="ip", rate="5/m", block=True)
def login_view(request):
    ...
```

## 9. Testes minimos

```python
def test_login_with_valid_credentials_returns_tokens():
    response = client.post("/auth/login/", {"username": "user", "password": "correct"})
    assert response.status_code == 200
    assert "access" in response.data
    assert "refresh" in response.data


def test_protected_route_without_token_returns_401():
    response = client.get("/api/protected/")
    assert response.status_code == 401


def test_user_cannot_access_other_users_resource():
    response = client_as_user_a.get(f"/api/invoices/{invoice_of_user_b.id}/")
    assert response.status_code == 403


def test_logout_blacklists_refresh_token():
    client.post("/auth/logout/", {"refresh": refresh_token})
    response = client.post("/auth/refresh/", {"refresh": refresh_token})
    assert response.status_code == 401
```

## Checklist

- [ ] Access token tem vida curta; refresh token e revogavel.
- [ ] Senha usa hasher padrao do framework, nunca implementacao propria.
- [ ] Rota protegida retorna 401 sem token/token invalido, 403 para autorizacao negada.
- [ ] Autorizacao por objeto e checada (nao so autenticacao por rota) - sem IDOR.
- [ ] Logout revoga o refresh token de verdade (blacklist), nao so apaga no cliente.
- [ ] OAuth (se usado) valida `state`, mantem `client_secret` so no backend e emite token proprio apos o callback.
- [ ] Rate limiting aplicado em login e endpoints de autenticacao.
- [ ] Testes cobrem login valido, rota sem token, IDOR e logout.

## Ideias para quem quiser contribuir

- Template de configuracao `SIMPLE_JWT`/`next-auth` por stack padrao do Doktor.
- Checklist de rotacao de `client_secret` de OAuth em caso de vazamento.
