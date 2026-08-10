# Guia Filas e Jobs Assincronos

## Quando usar

Use quando uma operacao e lenta demais para rodar dentro do ciclo de request-response (envio de email, geracao de relatorio pesado, processamento de imagem/video, integracao externa lenta) ou precisa rodar em horario agendado (cron job, limpeza periodica, sincronizacao noturna).

## Quando nao usar

Nao adicione fila/worker se a operacao roda em menos de ~1s e o volume e baixo - processamento sincrono e mais simples de depurar e nao adiciona infraestrutura (Redis/broker) sem necessidade real (ver `GUIA_MINIMO_QUALIDADE.md`, item 3). Se o projeto ainda esta em SQLite/MVP, considere primeiro se realmente ha necessidade de processamento assincrono antes de migrar para Postgres + Celery + Redis (ver `docs/STACK-E-ARQUITETURA.md`).

## Resultado esperado

- Job enfileirado retorna resposta imediata ao usuario (nao bloqueia o request).
- Job e idempotente: reprocessar o mesmo job nao duplica efeito.
- Falha de job tem retry com limite e vai para um estado de erro visivel, nunca falha silenciosa.
- Jobs agendados (cron) tem execucao unica garantida quando ha mais de um worker.

## 1. Estrutura basica (exemplo Celery + Redis)

```python
# tasks.py
from celery import shared_task


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_report_email(self, user_id: int, report_id: int):
    try:
        report = generate_report(report_id)
        send_email(user_id, report)
    except TransientError as exc:
        raise self.retry(exc=exc)
```

```python
# view.py - enfileira e responde imediatamente
def request_report(request):
    report = Report.objects.create(user=request.user, status="pending")
    send_report_email.delay(request.user.id, report.id)
    return JsonResponse({"report_id": report.id, "status": "pending"}, status=202)
```

`202 Accepted` sinaliza que o processamento foi aceito mas ainda nao concluido - o cliente consulta o status depois (polling ou webhook).

## 2. Idempotencia do job

Um job pode ser executado mais de uma vez (retry, redelivery do broker, reinicio de worker no meio da execucao). O job deve ser seguro para rodar 2x com o mesmo efeito de rodar 1x.

```python
@shared_task
def process_payment_webhook(event_id: str, payload: dict):
    # chave unica de idempotencia: se o evento ja foi processado, nao repete o efeito
    if PaymentEvent.objects.filter(external_id=event_id).exists():
        return  # ja processado, no-op seguro
    with transaction.atomic():
        PaymentEvent.objects.create(external_id=event_id)
        apply_payment(payload)
```

Regras praticas:

- Operacoes de escrita usam chave unica (constraint de banco) para rejeitar duplicata, nao apenas checagem em codigo (race condition entre checar e escrever).
- Evite side effects nao idempotentes (enviar email duas vezes) sem guarda - registre que o email ja foi enviado antes de reenviar.

## 3. Retry com backoff e limite

```python
@shared_task(bind=True, max_retries=5)
def call_external_api(self, payload: dict):
    try:
        response = external_client.post(payload)
        response.raise_for_status()
    except (Timeout, HTTPError) as exc:
        # backoff exponencial: 2^tentativa segundos, com teto
        countdown = min(2 ** self.request.retries, 300)
        raise self.retry(exc=exc, countdown=countdown)
```

- Diferencie erro transitorio (timeout, 5xx, rate limit) de erro permanente (400, dado invalido) - erro permanente nao deve ser retentado, deve falhar direto e ser registrado.
- Apos esgotar as tentativas, o job vai para um estado de falha visivel (fila de erro, alerta, registro no banco) - nunca falha silenciosa que some sem rastro.

## 4. Jobs agendados (cron) com garantia de execucao unica

Com mais de um worker rodando, um job agendado ingenuamente pode disparar em duplicidade (cada worker acha que e a vez dele).

```python
# celery beat agenda; o job em si usa lock para garantir execucao unica
from django.core.cache import cache

@shared_task
def nightly_cleanup():
    lock_id = "nightly_cleanup_lock"
    if not cache.add(lock_id, "locked", timeout=600):
        return  # outro worker ja esta rodando este job
    try:
        run_cleanup()
    finally:
        cache.delete(lock_id)
```

Alternativa: usar o proprio scheduler (Celery Beat, cron do sistema) configurado para rodar em uma unica instancia designada, quando a infraestrutura permitir.

Este lock e um uso de Redis diferente do cache-aside (ver `guias/backend/GUIA-CACHE-COM-REDIS.md`) - aqui o valor guardado nao e um dado a reaproveitar, e um sinalizador de exclusividade com TTL curto.

## 5. Monitoramento de fila

- Tamanho da fila (jobs pendentes) e uma metrica de saude: fila crescendo sem parar indica worker lento ou insuficiente.
- Tempo de processamento por job tipo ajuda a identificar job que degradou.
- Jobs mortos (esgotaram retry) precisam de visibilidade - dashboard, alerta ou pelo menos consulta simples (`SELECT * FROM failed_jobs`).

```python
# Consulta simples de jobs falhos (se usando django-celery-results)
FailedTask.objects.filter(status="FAILURE").order_by("-date_done")[:20]
```

## 6. Comunicando status ao usuario

Para jobs que o usuario espera (relatorio, exportacao), exponha um endpoint de status e/ou webhook, nao deixe o usuario sem saber o que aconteceu.

```python
def report_status(request, report_id):
    report = Report.objects.get(id=report_id, user=request.user)
    return JsonResponse({"status": report.status, "url": report.file_url if report.status == "done" else None})
```

## 7. Testes

```python
def test_task_is_idempotent(db):
    process_payment_webhook("evt_123", {"amount": 100})
    process_payment_webhook("evt_123", {"amount": 100})  # repetido
    assert Payment.objects.count() == 1  # nao duplicou


def test_task_retries_on_transient_error(celery_app):
    with mock.patch("tasks.external_client.post", side_effect=Timeout):
        with pytest.raises(Retry):
            call_external_api.apply(args=[{"data": 1}])


def test_task_does_not_retry_on_permanent_error():
    with mock.patch("tasks.external_client.post", side_effect=HTTPError(response=Mock(status_code=400))):
        result = call_external_api.apply(args=[{"data": 1}])
        assert result.status == "FAILURE"
```

Use o modo eager/sincrono do broker em testes (`task_always_eager=True` no Celery) para nao depender de um worker real rodando.

## Checklist

- [ ] Operacao lenta enfileira e responde `202`/imediato, nao bloqueia o request.
- [ ] Job e idempotente: reprocessar nao duplica efeito (checagem por chave unica no banco, nao so em codigo).
- [ ] Retry diferencia erro transitorio de erro permanente, com backoff e limite de tentativas.
- [ ] Job que esgotou retry fica visivel (nao falha silenciosamente).
- [ ] Job agendado (cron) tem garantia de execucao unica com mais de um worker.
- [ ] Ha visibilidade minima de tamanho de fila e jobs falhos.
- [ ] Usuario tem forma de consultar status de job que ele espera.
- [ ] Testes cobrem idempotencia, retry transitorio e falha permanente, usando modo sincrono/eager do broker.

## Ideias para quem quiser contribuir

- Template de dashboard minimo de monitoramento de fila (tamanho, taxa de falha, latencia).
- Guia complementar de escolha entre Celery, RQ e filas nativas de cloud (SQS, Cloud Tasks) por cenario.
