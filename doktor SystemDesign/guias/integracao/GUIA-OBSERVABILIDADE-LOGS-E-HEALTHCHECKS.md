# Guia Observabilidade: Logs e Health Checks

## Quando usar

Use quando o backend esta em producao (ou perto disso) e alguem precisa conseguir responder "o que aconteceu quando deu erro?" sem acesso ao codigo rodando ao vivo - logs estruturados, health check e metricas basicas sao o minimo para operar um sistema sem depender de adivinhacao.

## Quando nao usar

Nao monte stack de observabilidade pesada (tracing distribuido, dashboards elaborados) para um script local ou MVP de uso pessoal sem usuarios reais - comece pelo minimo (logs estruturados + health check) e escale conforme o sistema crescer (ver `GUIA_MINIMO_QUALIDADE.md`, item 3).

## Resultado esperado

- Logs estruturados (nao apenas `print`), com nivel (info/warning/error) e contexto suficiente para depurar sem reproduzir o bug.
- Nenhum log vaza segredo, senha, token ou dado pessoal sensivel.
- Endpoint de health check que reflete o estado real das dependencias (banco, cache, fila), nao so "o processo esta de pe".
- Erro nao tratado gera log com stack trace no servidor, mas resposta controlada ao cliente (sem vazar detalhe interno).

## 1. Logging estruturado

Prefira log estruturado (JSON ou key-value) a string livre - facilita busca e agregacao depois.

```python
import logging
import json

logger = logging.getLogger("app")

def log_event(level: str, event: str, **context):
    payload = {"event": event, **context}
    getattr(logger, level)(json.dumps(payload))

# uso
log_event("info", "order_created", order_id=order.id, user_id=user.id, total=order.total)
log_event("error", "payment_failed", order_id=order.id, reason="card_declined")
```

Para stacks que ja tem biblioteca de log estruturado madura (`structlog` em Python, `pino` em Node), prefira a biblioteca a reinventar o formato.

## 2. Niveis de log com proposito

| Nivel | Quando usar |
|---|---|
| `debug` | Detalhe util so em desenvolvimento; nao deve poluir producao |
| `info` | Evento de negocio relevante (pedido criado, usuario cadastrado) |
| `warning` | Algo inesperado mas recuperavel (retry, fallback ativado) |
| `error` | Falha que impediu a operacao de completar; precisa de atencao |

Nao logue tudo em `info` (log vira ruido, dificulta achar o que importa) nem tudo em `error` (alerta perde credibilidade quando dispara para coisa recuperavel).

## 3. Contexto de correlacao

Para rastrear todos os logs de uma mesma requisicao/job, inclua um identificador de correlacao (request ID, trace ID) em cada linha de log daquela execucao.

```python
import uuid
from contextvars import ContextVar

request_id_var: ContextVar[str] = ContextVar("request_id", default="")

def request_id_middleware(get_response):
    def middleware(request):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request_id_var.set(request_id)
        response = get_response(request)
        response["X-Request-ID"] = request_id
        return response
    return middleware

def log_event(level: str, event: str, **context):
    payload = {"event": event, "request_id": request_id_var.get(), **context}
    getattr(logging.getLogger("app"), level)(json.dumps(payload))
```

Com isso, buscar por um `request_id` no log agregador traz toda a historia de uma requisicao especifica, mesmo que ela tenha passado por varias funcoes/servicos.

## 4. O que nunca vai para o log

- Senha, token, cookie de sessao, chave de API. Ver `guias/backend/GUIA-AUTENTICACAO-JWT-OAUTH.md`, secao 3, para o mesmo cuidado aplicado a senha e token JWT na origem.
- Numero de cartao de credito, CPF completo sem mascaramento, dado pessoal sensivel sem necessidade.
- Payload de request inteiro sem filtrar campos sensiveis.

```python
def sanitize_for_log(payload: dict) -> dict:
    sensitive_fields = {"password", "token", "card_number", "cpf"}
    return {k: ("***" if k in sensitive_fields else v) for k, v in payload.items()}

log_event("info", "signup_attempt", **sanitize_for_log(request_payload))
```

## 5. Health check

Um health check que so responde "200 OK" sem checar nada real da um falso positivo perigoso (o load balancer acha que o servico esta saudavel quando o banco esta inacessivel).

```python
def health_check(request):
    checks = {}
    status_ok = True

    try:
        db.execute("SELECT 1")
        checks["database"] = "ok"
    except Exception:
        checks["database"] = "unreachable"
        status_ok = False

    try:
        cache.get("healthcheck")
        checks["cache"] = "ok"
    except Exception:
        checks["cache"] = "unreachable"
        status_ok = False  # decida se cache indisponivel derruba o health check ou so alerta

    return JsonResponse({"status": "ok" if status_ok else "degraded", "checks": checks},
                         status=200 if status_ok else 503)
```

- Separe "liveness" (o processo esta rodando? reiniciar ajudaria?) de "readiness" (o servico esta pronto para receber trafego? dependencias estao de pe?) quando a infraestrutura de orquestracao (Kubernetes, etc.) distinguir os dois.
- Decida conscientemente se uma dependencia opcional (cache) derruba o health check inteiro ou so gera um aviso - cache fora do ar geralmente nao deveria tirar o servico do ar (ver `GUIA-CACHE-COM-REDIS.md`, secao 5).

## 6. Metricas minimas

Sem precisar de uma stack completa de metricas, valores basicos ja ajudam a identificar degradacao:

- Taxa de erro por endpoint (quantos 5xx nas ultimas N requisicoes).
- Latencia (tempo de resposta) por endpoint, ao menos p50/p95.
- Tamanho de fila de jobs pendentes (ver `GUIA-FILAS-E-JOBS-ASSINCRONOS.md`, secao 5).

```python
import time

def timed_view(view_func):
    def wrapper(request, *args, **kwargs):
        start = time.monotonic()
        response = view_func(request, *args, **kwargs)
        duration_ms = (time.monotonic() - start) * 1000
        log_event("info", "request_completed", path=request.path, status=response.status_code, duration_ms=round(duration_ms, 2))
        return response
    return wrapper
```

Se o volume justificar, migre para uma ferramenta dedicada (Prometheus, Sentry, Datadog) em vez de acumular logs manuais - mas comece pelo minimo que ja responde "esta lento? esta com erro?".

## 7. Tratamento de erro nao capturado

```python
def custom_exception_handler(request, exception):
    log_event("error", "unhandled_exception", path=request.path, exception=str(exception), exc_info=True)
    # resposta ao cliente nao vaza stack trace nem detalhe interno
    return JsonResponse({"error": "internal_error", "message": "Algo deu errado. Tente novamente."}, status=500)
```

Stack trace completo vai para o log do servidor (para quem investiga); a resposta ao cliente e generica e segura (ver `DESIGN_SYSTEM_SEGURANCA.md`).

## 8. Testes

```python
def test_health_check_returns_ok_when_dependencies_are_up():
    response = client.get("/health/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_health_check_returns_503_when_database_is_down(mock_db_failure):
    response = client.get("/health/")
    assert response.status_code == 503
    assert response.json()["checks"]["database"] == "unreachable"


def test_log_does_not_contain_sensitive_fields(caplog):
    sanitize_for_log({"email": "a@b.com", "password": "secret123"})
    assert "secret123" not in caplog.text


def test_unhandled_exception_returns_generic_message(client):
    response = client.get("/route-that-raises/")
    assert response.status_code == 500
    assert "traceback" not in response.json()["message"].lower()
```

## Checklist

- [ ] Logs sao estruturados (nao `print`/string livre) e tem nivel apropriado ao evento.
- [ ] Log inclui identificador de correlacao (request ID) para rastrear uma execucao completa.
- [ ] Nenhum log contem senha, token, cartao ou dado pessoal sensivel sem mascaramento.
- [ ] Health check verifica dependencias reais (banco, cache), nao so "processo de pe".
- [ ] Decisao sobre dependencia opcional derrubar ou nao o health check foi tomada conscientemente.
- [ ] Ha visibilidade minima de taxa de erro e latencia por endpoint.
- [ ] Erro nao tratado loga stack trace no servidor mas responde mensagem generica e segura ao cliente.
- [ ] Testes cobrem health check saudavel/degradado e ausencia de dado sensivel no log.

## Ideias para quem quiser contribuir

- Middleware generico de request ID + logging estruturado, reutilizavel entre projetos Doktor.
- Guia complementar de integracao com ferramenta de observabilidade externa (Sentry, Prometheus/Grafana) quando o volume justificar.
