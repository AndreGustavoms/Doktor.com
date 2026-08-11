import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { desc, eq } from "drizzle-orm";

/*
 * Ver docs/SECURITY.md §4.4, ameaça A8 — critério funcional da Seção 10
 * do prompt original: "sessão expira". src/server/auth/session.ts define
 * dois motivos de expiração — 8h de idade absoluta e 30min de inatividade
 * (renovação deslizante). Para testar isso sem esperar 8h/30min de
 * verdade, escrevemos createdAt/lastSeenAt manipulados direto no banco
 * depois de criar a sessão via createSession() — mesmo isolamento via
 * PAINEL_DATA_DIR de tests/unit/auth-flow.test.ts.
 *
 * Cada teste cria sua própria sessão e edita só a linha mais recente
 * (orderBy id desc, limit 1) — sessions.tokenHash não é exportado por
 * session.ts (é derivado internamente), então não há como filtrar o
 * update pelo token em si sem duplicar a lógica de hash aqui; usar a
 * linha mais recente evita mexer nas sessões criadas por testes
 * anteriores no mesmo banco isolado.
 */

const TEST_DB_DIR = join(process.cwd(), "data-test-session-expiry");

function cleanTestDir() {
  try {
    if (existsSync(TEST_DB_DIR)) rmSync(TEST_DB_DIR, { recursive: true, force: true });
  } catch {
    // Best-effort — ver tests/unit/auth-flow.test.ts para o motivo.
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

describe("expiração de sessão (Fase 1)", () => {
  it("sessão recém-criada é válida", async () => {
    const { createSession, validateSession } = await import("@/server/auth/session");
    const session = await createSession();
    const result = await validateSession(session.token);
    expect(result.valid).toBe(true);
  });

  it("expira após 8h de idade absoluta, mesmo com uso recente", async () => {
    const { createSession, validateSession } = await import("@/server/auth/session");
    const { getDb } = await import("@/server/db");
    const { sessions } = await import("@/server/db/schema");

    const session = await createSession();
    const latest = getDb().select().from(sessions).orderBy(desc(sessions.id)).limit(1).all()[0]!;
    const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000 - 1000);

    getDb()
      .update(sessions)
      .set({ createdAt: eightHoursAgo, expiresAt: eightHoursAgo, lastSeenAt: new Date() })
      .where(eq(sessions.id, latest.id))
      .run();

    const result = await validateSession(session.token);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("expired");
  });

  it("expira após 30min de inatividade, mesmo dentro das 8h de idade", async () => {
    const { createSession, validateSession } = await import("@/server/auth/session");
    const { getDb } = await import("@/server/db");
    const { sessions } = await import("@/server/db/schema");

    const session = await createSession();
    const latest = getDb().select().from(sessions).orderBy(desc(sessions.id)).limit(1).all()[0]!;
    const thirtyOneMinutesAgo = new Date(Date.now() - 31 * 60 * 1000);

    getDb()
      .update(sessions)
      .set({ lastSeenAt: thirtyOneMinutesAgo })
      .where(eq(sessions.id, latest.id))
      .run();

    const result = await validateSession(session.token);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("inactive");
  });

  it("token forjado (não existe no banco) é rejeitado como not_found", async () => {
    const { validateSession } = await import("@/server/auth/session");
    const result = await validateSession("0".repeat(64));
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("not_found");
  });

  it("validação bem-sucedida renova lastSeenAt (renovação deslizante)", async () => {
    const { createSession, validateSession } = await import("@/server/auth/session");
    const { getDb } = await import("@/server/db");
    const { sessions } = await import("@/server/db/schema");

    const session = await createSession();
    const latest = getDb().select().from(sessions).orderBy(desc(sessions.id)).limit(1).all()[0]!;
    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);

    getDb()
      .update(sessions)
      .set({ lastSeenAt: twentyMinutesAgo })
      .where(eq(sessions.id, latest.id))
      .run();

    // Ainda dentro da janela de 30min — válida, e essa validação deveria
    // renovar lastSeenAt para agora.
    const result = await validateSession(session.token);
    expect(result.valid).toBe(true);

    const row = getDb().select().from(sessions).where(eq(sessions.id, latest.id)).all()[0];
    expect(row).toBeDefined();
    expect(Date.now() - row!.lastSeenAt.getTime()).toBeLessThan(5000);
  });

  it("destroySession invalida a sessão imediatamente", async () => {
    const { createSession, validateSession, destroySession } = await import(
      "@/server/auth/session"
    );
    const session = await createSession();
    await destroySession(session.token);
    const result = await validateSession(session.token);
    expect(result.valid).toBe(false);
  });
});
