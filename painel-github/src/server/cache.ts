import "server-only";
import { getDb } from "./db";
import { apiCache } from "./db/schema";
import { eq } from "drizzle-orm";

/*
 * TTL por tipo de recurso — ver prompt original §4.12.
 */
export const CACHE_TTL_MS = {
  repoList: 5 * 60 * 1000,
  repoDetail: 2 * 60 * 1000,
  readme: 15 * 60 * 1000,
  issues: 1 * 60 * 1000,
  actionsStatus: 30 * 1000,
} as const;

export type CacheResourceType = keyof typeof CACHE_TTL_MS;

interface CacheEntry<T> {
  payload: T;
  etag: string | null;
  fresh: boolean; // dentro do TTL — pode ser servido sem revalidar
}

/**
 * Lê uma entrada de cache. `fresh: false` não significa "inválido" —
 * significa "passou do TTL, revalide com If-None-Match antes de
 * confiar", que é exatamente o que faz a resposta 304 não contar contra
 * o rate limit do GitHub (ver prompt original, notas sobre ETag).
 */
export function readCache<T>(key: string): CacheEntry<T> | null {
  const row = getDb().select().from(apiCache).where(eq(apiCache.key, key)).get();
  if (!row) return null;

  return {
    payload: JSON.parse(row.payload) as T,
    etag: row.etag,
    fresh: row.expiresAt > new Date(),
  };
}

export function writeCache<T>(
  key: string,
  payload: T,
  etag: string | null,
  resourceType: CacheResourceType,
): void {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CACHE_TTL_MS[resourceType]);
  const db = getDb();

  db.insert(apiCache)
    .values({
      key,
      etag,
      payload: JSON.stringify(payload),
      fetchedAt: now,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: apiCache.key,
      set: { etag, payload: JSON.stringify(payload), fetchedAt: now, expiresAt },
    })
    .run();
}

/**
 * Estende o expiresAt de uma entrada existente sem mudar o payload —
 * usado quando o GitHub responde 304 (payload não mudou, mas o TTL
 * local já tinha vencido e por isso a revalidação foi feita).
 */
export function touchCache(key: string, resourceType: CacheResourceType): void {
  const expiresAt = new Date(Date.now() + CACHE_TTL_MS[resourceType]);
  getDb().update(apiCache).set({ expiresAt }).where(eq(apiCache.key, key)).run();
}
