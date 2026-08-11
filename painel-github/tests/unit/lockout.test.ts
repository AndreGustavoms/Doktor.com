import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

/*
 * Ver docs/SECURITY.md §4.4, ameaça A8 — critério funcional da Seção 10
 * do prompt original: "trava depois de 5 tentativas". Cobre
 * isLockedOut()/recordLoginAttempt() (src/server/auth/password.ts)
 * isoladamente do Route Handler de /api/auth/unlock, mesmo padrão de
 * isolamento via PAINEL_DATA_DIR de tests/unit/auth-flow.test.ts.
 */

const TEST_DB_DIR = join(process.cwd(), "data-test-lockout");

function cleanTestDir() {
  try {
    if (existsSync(TEST_DB_DIR)) rmSync(TEST_DB_DIR, { recursive: true, force: true });
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

describe("trava após tentativas malsucedidas (Fase 1)", () => {
  it("não trava com menos de 5 falhas seguidas", async () => {
    const { isLockedOut, recordLoginAttempt } = await import("@/server/auth/password");

    for (let i = 0; i < 4; i++) {
      await recordLoginAttempt(false);
    }

    expect(await isLockedOut()).toBeNull();
  });

  it("trava na 5ª falha seguida", async () => {
    const { isLockedOut, recordLoginAttempt } = await import("@/server/auth/password");

    await recordLoginAttempt(false); // 5ª falha, completando a sequência do teste anterior

    const lockedUntil = await isLockedOut();
    expect(lockedUntil).not.toBeNull();
    expect(lockedUntil!.getTime()).toBeGreaterThan(Date.now());
  });

  it("uma tentativa bem-sucedida no meio da sequência reseta a contagem", async () => {
    const { isLockedOut, recordLoginAttempt } = await import("@/server/auth/password");

    for (let i = 0; i < 4; i++) {
      await recordLoginAttempt(false);
    }
    await recordLoginAttempt(true); // sucesso — quebra a sequência de falhas
    await recordLoginAttempt(false);
    await recordLoginAttempt(false);

    // Só 2 falhas desde o último sucesso — não deveria travar.
    expect(await isLockedOut()).toBeNull();
  });
});
