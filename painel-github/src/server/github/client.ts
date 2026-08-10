import "server-only";
import { Octokit } from "@octokit/rest";
import { throttling } from "@octokit/plugin-throttling";
import { retry } from "@octokit/plugin-retry";
import { getUnlockedToken } from "../vault/session-state";
import { logInfo, logWarn } from "../log";
import { recordRateLimitSnapshot } from "./rate-limit";

const RequestOctokit = Octokit.plugin(throttling, retry);

/*
 * A7 — o hook de log abaixo é o ÚNICO ponto por onde uma requisição do
 * Octokit vira uma linha de log. Loga método, caminho, status e duração
 * — nunca headers (que carregam Authorization), nunca corpo. Ver
 * docs/SECURITY.md, ameaça A7.
 */
function attachRequestLogging(octokit: InstanceType<typeof RequestOctokit>) {
  octokit.hook.wrap("request", async (request, options) => {
    const startedAt = Date.now();
    try {
      const response = await request(options);
      logInfo("github_request", {
        method: options.method,
        path: safePath(options.url),
        status: response.status,
        durationMs: Date.now() - startedAt,
      });
      recordRateLimitFromHeaders(response.headers);
      return response;
    } catch (err) {
      const status =
        typeof err === "object" && err !== null && "status" in err
          ? Number((err as { status: unknown }).status)
          : undefined;
      logWarn("github_request_failed", {
        method: options.method,
        path: safePath(options.url),
        status: status ?? null,
        durationMs: Date.now() - startedAt,
      });
      throw err;
    }
  });
}

/*
 * options.url do Octokit é o template da rota (ex: "/repos/{owner}/{repo}"),
 * não a URL final com valores interpolados — então não há risco de vazar
 * nome de repositório privado ou token de query string no log. Mesmo
 * assim, cortamos qualquer query string por precaução (ETags e tokens de
 * paginação não deveriam ir para o log de qualquer forma).
 */
function safePath(url: string): string {
  return url.split("?")[0] ?? url;
}

function recordRateLimitFromHeaders(headers: Record<string, string | number | undefined>) {
  const remaining = headers["x-ratelimit-remaining"];
  const limit = headers["x-ratelimit-limit"];
  const reset = headers["x-ratelimit-reset"];
  if (remaining === undefined || limit === undefined || reset === undefined) return;

  recordRateLimitSnapshot({
    remaining: Number(remaining),
    limit: Number(limit),
    resetAt: new Date(Number(reset) * 1000),
  });
}

/*
 * Fábrica, não singleton — o token muda entre unlock/lock/rotate, então
 * cada chamada que precisa do Octokit pega uma instância fresca com o
 * token atual da memória (ver src/server/vault/session-state.ts).
 * Lança se o vault não estiver destravado; todo Route Handler que chega
 * aqui já passou por requireSession (ver src/server/guards.ts), que
 * garante isUnlocked() — este erro só dispara se algo pular essa ordem.
 */
export function getOctokit(): InstanceType<typeof RequestOctokit> {
  const token = getUnlockedToken();
  if (!token) {
    throw new Error("Vault bloqueado — getOctokit() chamado sem token decifrado em memória.");
  }

  const octokit = new RequestOctokit({
    auth: token,
    userAgent: "painel-github",
    throttle: {
      onRateLimit: (retryAfter, options, _octokit, retryCount) => {
        logWarn("github_rate_limit", {
          method: options.method,
          path: safePath(options.url),
          retryAfter,
          retryCount,
        });
        // Máximo 2 tentativas, respeitando retryAfter — ver
        // docs/SECURITY.md §4.12 e prompt original.
        return retryCount < 2;
      },
      onSecondaryRateLimit: (retryAfter, options, _octokit, retryCount) => {
        logWarn("github_secondary_rate_limit", {
          method: options.method,
          path: safePath(options.url),
          retryAfter,
          retryCount,
        });
        return retryCount < 2;
      },
    },
    request: {
      // Timeout de 15s por chamada — ver docs/SECURITY.md §4.12.
      signal: AbortSignal.timeout(15_000),
    },
  });

  attachRequestLogging(octokit);
  return octokit;
}
