# Guia Cache com Redis

## Quando usar

Use cache com Redis quando uma consulta ou calculo caro e repetido com frequencia e o dado pode ficar levemente desatualizado por um periodo curto (segundos a minutos) sem prejudicar o usuario - contagens agregadas, resultado de relatorio pesado, resposta de API externa lenta, sessao compartilhada entre multiplos processos/workers.

Redis tambem serve para **lock distribuido** (garantir que um job agendado rode uma unica vez com varios workers) - esse uso e diferente de cache-aside e esta coberto em `guias/backend/GUIA-FILAS-E-JOBS-ASSINCRONOS.md`, secao 4.

## Quando nao usar

Nao cacheie dado que precisa estar sempre atualizado no instante da leitura (saldo financeiro no momento da transacao, estoque no ato da compra) sem uma estrategia explicita de invalidacao - cache errado aqui vira bug de consistencia. Para cache simples e local a um unico processo, o cache framework do proprio backend (ver `docs/STACK-E-ARQUITETURA.md`, secao 4) pode bastar sem precisar de Redis.

## Resultado esperado

- Cache com chave previsivel e TTL definido para todo dado cacheado.
- Invalidacao explicita quando o dado de origem muda (nao depender so do TTL expirar).
- Fallback correto quando o Redis esta fora do ar (nao derrubar a aplicacao).
- Sem dado sensivel armazenado em cache sem necessidade.

## 1. Padrao de chave

Chaves de cache devem ser previsiveis e incluir o que varia o resultado.

```python
def cache_key_user_dashboard(user_id: int, period: str) -> str:
    return f"dashboard:user:{user_id}:period:{period}"
```

- Prefixo por dominio (`dashboard:`) evita colisao entre features diferentes.
- Inclua todo parametro que afeta o resultado na chave (usuario, filtro, versao) - esquecer um parametro faz dois resultados diferentes compartilharem a mesma chave por engano.

## 2. Cache-aside (o padrao mais comum)

```python
import json
from django.core.cache import cache

def get_dashboard_data(user_id: int, period: str) -> dict:
    key = cache_key_user_dashboard(user_id, period)
    cached = cache.get(key)
    if cached is not None:
        return json.loads(cached)

    data = compute_dashboard_data(user_id, period)  # consulta/calculo caro
    cache.set(key, json.dumps(data), timeout=300)  # TTL de 5 minutos
    return data
```

A aplicacao le do cache; se nao houver (miss), calcula, grava no cache e retorna. Simples e cobre a maioria dos casos.

## 3. TTL sempre explicito

Nunca grave no cache sem TTL ("cache eterno" vira memoria vazando e dado desatualizado permanente).

| Tipo de dado | TTL tipico |
|---|---|
| Resposta de API externa lenta | 1-15 minutos, conforme volatilidade da fonte |
| Agregacao/relatorio pesado | 5-60 minutos |
| Sessao/token | igual a vida do token (ver `GUIA-AUTENTICACAO-JWT-OAUTH.md`) |
| Rate limiting (contador) | janela da regra (ex.: 60s para "5 por minuto") |

## 4. Invalidacao explicita

TTL sozinho aceita dado desatualizado ate expirar. Quando o dado de origem muda, invalide o cache no mesmo fluxo da escrita.

```python
def update_user_profile(user_id: int, data: dict):
    User.objects.filter(id=user_id).update(**data)
    # invalida qualquer cache que dependa deste usuario
    cache.delete_pattern(f"dashboard:user:{user_id}:*")
```

- `delete_pattern` (ou equivalente) e util quando ha varias chaves derivadas do mesmo dado (ex.: por periodo). Confirme que o backend de cache suporta scan por padrao sem bloquear o Redis em producao (evite `KEYS *` em producao; use `SCAN`).
- Se a invalidacao por padrao for cara ou nao suportada, mantenha um TTL curto o suficiente para aceitar a defasagem.

## 5. Fallback quando o Redis cai

Cache e uma otimizacao, nao uma dependencia rigida - se o Redis ficar indisponivel, a aplicacao deve degradar (ficar mais lenta), nao quebrar.

```python
def get_dashboard_data_safe(user_id: int, period: str) -> dict:
    key = cache_key_user_dashboard(user_id, period)
    try:
        cached = cache.get(key)
    except ConnectionError:
        cached = None  # Redis fora do ar: segue sem cache

    if cached is not None:
        return json.loads(cached)

    data = compute_dashboard_data(user_id, period)
    try:
        cache.set(key, json.dumps(data), timeout=300)
    except ConnectionError:
        pass  # nao falha a request so porque nao conseguiu gravar cache

    return data
```

Se o framework/biblioteca de cache ja trata isso internamente (muitas tratam), confirme o comportamento antes de assumir - documente a decisao no `IA.md` do projeto.

## 6. Cache de sessao compartilhada

Quando ha mais de um processo/worker atras de um load balancer, sessao em memoria local nao funciona (usuario cai em processos diferentes a cada request). Redis resolve isso como store de sessao compartilhado.

```python
# settings.py (Django)
SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"  # aponta para o Redis configurado em CACHES
```

## 7. Rate limiting com Redis

Contador atomico do Redis e uma base comum para rate limiting distribuido entre varios processos.

```python
def is_rate_limited(key: str, limit: int, window_seconds: int) -> bool:
    current = redis_client.incr(key)
    if current == 1:
        redis_client.expire(key, window_seconds)
    return current > limit
```

`INCR` e atomico no Redis - varios processos incrementando a mesma chave nao tem race condition.

## 8. Dados sensiveis em cache

- Nao cacheie senha, token de sessao em texto claro sem necessidade, ou dado pessoal sensivel sem justificativa e TTL curto.
- Se o Redis for compartilhado entre ambientes/times, trate o acesso a ele com o mesmo cuidado de um banco de dados (rede isolada, autenticacao, sem exposicao publica).

## 9. Testes

```python
def test_cache_aside_returns_cached_value_on_second_call(cache_backend):
    call_count = 0

    def expensive():
        nonlocal call_count
        call_count += 1
        return {"value": 42}

    key = "test:key"
    cache.delete(key)
    result1 = get_or_compute(key, expensive, ttl=60)
    result2 = get_or_compute(key, expensive, ttl=60)
    assert result1 == result2
    assert call_count == 1  # so calculou uma vez


def test_invalidation_removes_derived_keys():
    cache.set("dashboard:user:1:period:week", "old")
    invalidate_user_cache(user_id=1)
    assert cache.get("dashboard:user:1:period:week") is None


def test_cache_failure_does_not_break_request(mock_redis_down):
    result = get_dashboard_data_safe(user_id=1, period="week")
    assert result is not None  # segue funcionando sem cache
```

## Checklist

- [ ] Toda chave de cache tem TTL explicito - nenhum cache "eterno".
- [ ] Chave de cache inclui todo parametro que afeta o resultado.
- [ ] Escrita que muda o dado de origem invalida (ou aceita a defasagem do TTL de forma deliberada, documentada).
- [ ] Aplicacao nao quebra se o Redis ficar indisponivel (fallback tratado).
- [ ] Sessao compartilhada usa Redis quando ha mais de um processo/worker.
- [ ] Rate limiting usa operacao atomica (`INCR`/`EXPIRE`), nao leitura+escrita separadas.
- [ ] Nenhum dado sensivel desnecessario fica em cache sem justificativa.
- [ ] Testes cobrem cache hit/miss, invalidacao e fallback de falha do Redis.

## Ideias para quem quiser contribuir

- Decorator generico de cache-aside reutilizavel entre projetos Doktor.
- Guia complementar de cache em CDN/edge para respostas HTTP publicas.
