import "server-only";
import { getDb } from "../db";
import { rateLimitSnapshot } from "../db/schema";
import { desc } from "drizzle-orm";

interface RateLimitInput {
  remaining: number;
  limit: number;
  resetAt: Date;
}

/**
 * Persiste o snapshot mais recente de rate limit, lido dos headers
 * x-ratelimit-* de toda resposta do GitHub (ver client.ts). Não faz
 * upsert numa única linha — grava histórico, então o rodapé (Fase 3)
 * pode mostrar tendência, não só o valor atual. Ver prompt original
 * §4.12.
 */
export function recordRateLimitSnapshot(input: RateLimitInput): void {
  getDb()
    .insert(rateLimitSnapshot)
    .values({
      remaining: input.remaining,
      limit: input.limit,
      resetAt: input.resetAt,
      recordedAt: new Date(),
    })
    .run();
}

export interface RateLimitStatus {
  remaining: number;
  limit: number;
  resetAt: Date;
  level: "ok" | "warning" | "critical";
}

/**
 * Lê o snapshot mais recente. Usado pelo rodapé da UI (Fase 3) — amarelo
 * abaixo de 1000, vermelho abaixo de 200 (ver prompt original §4.12).
 */
export function getLatestRateLimit(): RateLimitStatus | null {
  const row = getDb()
    .select()
    .from(rateLimitSnapshot)
    .orderBy(desc(rateLimitSnapshot.recordedAt))
    .limit(1)
    .get();

  if (!row) return null;

  const level: RateLimitStatus["level"] =
    row.remaining < 200 ? "critical" : row.remaining < 1000 ? "warning" : "ok";

  return {
    remaining: row.remaining,
    limit: row.limit,
    resetAt: row.resetAt,
    level,
  };
}
