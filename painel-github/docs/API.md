# Contrato de API

> Preenchido conforme cada rota é implementada, a partir da Fase 2. Este
> é um placeholder da Fase 0.

## Formato de erro (uniforme em toda a API)

```json
{ "error": { "code": "GITHUB_FORBIDDEN", "message": "Texto acionável", "field": "owner" } }
```

Nunca inclui stack trace, headers, ou a resposta bruta do GitHub no corpo
do erro — ver docs/SECURITY.md, ameaças A1 e A7.

## Forma de todo Route Handler

1. Sessão válida? Senão `401`.
2. Origem legítima? Senão `403`.
3. Input validado com Zod. Senão `400` com erro de campo.
4. Cache (hit dentro do TTL → devolve; senão revalida com ETag).
5. Chama o GitHub com o token decifrado da memória.
6. Mapeia para o DTO — nunca devolve a resposta crua.
7. Loga método, caminho, status, duração — sem headers, sem corpo.
8. Erro → mensagem sanitizada.
