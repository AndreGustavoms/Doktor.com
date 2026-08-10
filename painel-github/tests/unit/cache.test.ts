import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

/*
 * Ver prompt original §4.12 — cache com TTL por tipo de recurso, e
 * §10 — critério: cache respeita TTL, 304 reaproveita corpo cacheado.
 * Usa PAINEL_DATA_DIR isolado, mesmo padrão de
 * tests/unit/auth-flow.test.ts (Fase 1).
 */

const TEST_DB_DIR = join(process.cwd(), "data-test-cache");

function cleanTestDir() {
  try {
    if (existsSync(TEST_DB_DIR)) {
      rmSync(TEST_DB_DIR, { recursive: true, force: true });
    }
  } catch {
    // Best-effort — ver tests/unit/auth-flow.test.ts para o motivo
    // (better-sqlite3 mantém arquivo aberto até o processo encerrar no
    // Windows).
  }
}

beforeAll(() => {
  cleanTestDir();
  process.env.PAINEL_DATA_DIR = TEST_DB_DIR;
});

afterAll(() => {
  delete process.env.PAINEL_DATA_DIR;
  cleanTestDir();
});

describe("cache com TTL e ETag", () => {
  it("readCache retorna null para chave inexistente", async () => {
    const { readCache } = await import("@/server/cache");
    expect(readCache("chave-que-nao-existe")).toBeNull();
  });

  it("writeCache seguido de readCache retorna fresh:true dentro do TTL", async () => {
    const { readCache, writeCache } = await import("@/server/cache");

    writeCache("teste:1", { valor: 42 }, "etag-abc", "issues"); // TTL 1min
    const entry = readCache<{ valor: number }>("teste:1");

    expect(entry).not.toBeNull();
    expect(entry?.fresh).toBe(true);
    expect(entry?.etag).toBe("etag-abc");
    expect(entry?.payload.valor).toBe(42);
  });

  it("entrada expirada (TTL no passado) tem fresh:false mas ainda retorna o payload", async () => {
    const { readCache, writeCache } = await import("@/server/cache");
    const { getDb } = await import("@/server/db");
    const { apiCache } = await import("@/server/db/schema");
    const { eq } = await import("drizzle-orm");

    writeCache("teste:2", { valor: 7 }, "etag-xyz", "issues");

    // Força a expiração manualmente — writeCache sempre grava um TTL no
    // futuro, então simulamos o tempo passando ajustando expiresAt
    // direto no banco.
    getDb()
      .update(apiCache)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(apiCache.key, "teste:2"))
      .run();

    const entry = readCache<{ valor: number }>("teste:2");
    expect(entry?.fresh).toBe(false);
    expect(entry?.payload.valor).toBe(7); // payload ainda vem — é isso que permite reaproveitar em 304
  });

  it("touchCache estende expiresAt sem mudar o payload — simula reaproveitamento após 304", async () => {
    const { readCache, writeCache, touchCache } = await import("@/server/cache");
    const { getDb } = await import("@/server/db");
    const { apiCache } = await import("@/server/db/schema");
    const { eq } = await import("drizzle-orm");

    writeCache("teste:3", { valor: 99 }, "etag-touch", "issues");
    getDb()
      .update(apiCache)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(apiCache.key, "teste:3"))
      .run();

    expect(readCache("teste:3")?.fresh).toBe(false);

    touchCache("teste:3", "issues");

    const entry = readCache<{ valor: number }>("teste:3");
    expect(entry?.fresh).toBe(true);
    expect(entry?.payload.valor).toBe(99); // payload inalterado
  });

  it("writeCache sobrescreve entrada existente na mesma chave (upsert)", async () => {
    const { readCache, writeCache } = await import("@/server/cache");

    writeCache("teste:4", { valor: "primeiro" }, "etag-1", "issues");
    writeCache("teste:4", { valor: "segundo" }, "etag-2", "issues");

    const entry = readCache<{ valor: string }>("teste:4");
    expect(entry?.payload.valor).toBe("segundo");
    expect(entry?.etag).toBe("etag-2");
  });
});
