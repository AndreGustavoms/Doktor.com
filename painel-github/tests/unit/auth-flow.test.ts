import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

/*
 * Teste de integração do fluxo completo de auth da Fase 1: setup →
 * verificação de senha → decifra do vault → sessão → validação. Não
 * cobre a chamada real ao GitHub (GET /user) — isso é testado
 * manualmente com um token real, documentado em docs/SETUP.md. Usa um
 * data/ isolado (não o do dev normal) para não conflitar com uso manual
 * do painel durante desenvolvimento.
 */

const TEST_DB_DIR = join(process.cwd(), "data-test-auth-flow");

beforeAll(() => {
  // Limpeza defensiva: se uma run anterior falhou antes do afterAll
  // rodar (ex: EPERM no Windows com o arquivo ainda aberto), um
  // data-test-auth-flow/ órfão conteria um vault e senha mestra já
  // criados — o que faria hasMasterPassword() retornar true logo no
  // primeiro assert deste arquivo, por causas alheias ao teste em si.
  try {
    if (existsSync(TEST_DB_DIR)) {
      rmSync(TEST_DB_DIR, { recursive: true, force: true });
    }
  } catch {
    // Best-effort — mesma limitação do afterAll abaixo.
  }
  process.env.PAINEL_DATA_DIR = TEST_DB_DIR;
});

afterAll(() => {
  delete process.env.PAINEL_DATA_DIR;
  // No Windows, better-sqlite3 mantém o arquivo aberto até o processo
  // encerrar — não há close() explícito aqui porque getDb() é um
  // singleton pensado para viver a vida inteira do processo (ver
  // src/server/db/index.ts). Best-effort: se falhar, o diretório de
  // teste fica órfão mas não afeta a próxima rodada (dado isolado por
  // PAINEL_DATA_DIR) nem é versionado.
  try {
    if (existsSync(TEST_DB_DIR)) {
      rmSync(TEST_DB_DIR, { recursive: true, force: true });
    }
  } catch {
    // Best-effort — ver comentário acima.
  }
});

describe("fluxo completo de autenticação (Fase 1)", () => {
  it("executa setup → unlock → sessão → lock de ponta a ponta", async () => {
    const { createMasterPassword, verifyMasterPassword, hasMasterPassword } = await import(
      "@/server/auth/password"
    );
    const { writeVault, readVault, vaultExists } = await import("@/server/vault/store");
    const {
      setUnlockedToken,
      getUnlockedToken,
      isUnlocked,
      clearUnlockedToken,
    } = await import("@/server/vault/session-state");
    const { createSession, validateSession, destroySession } = await import(
      "@/server/auth/session"
    );

    const FAKE_TOKEN = "ghp_fake0000000000000000000000000000000000";
    const PASSWORD = "senha-de-teste-bem-forte-123";

    expect(await hasMasterPassword()).toBe(false);
    expect(vaultExists()).toBe(false);

    await createMasterPassword(PASSWORD);
    await writeVault(FAKE_TOKEN, PASSWORD);

    expect(await hasMasterPassword()).toBe(true);
    expect(vaultExists()).toBe(true);

    expect(await verifyMasterPassword(PASSWORD)).toBe(true);
    expect(await verifyMasterPassword("senha-errada")).toBe(false);

    const decrypted = await readVault(PASSWORD);
    expect(decrypted).toBe(FAKE_TOKEN);

    setUnlockedToken(decrypted);
    expect(isUnlocked()).toBe(true);
    expect(getUnlockedToken()).toBe(FAKE_TOKEN);

    const session = await createSession();
    expect(session.token).toHaveLength(64); // 32 bytes em hex

    const validation = await validateSession(session.token);
    expect(validation.valid).toBe(true);

    const forgedValidation = await validateSession("0".repeat(64));
    expect(forgedValidation.valid).toBe(false);

    await destroySession(session.token);
    const afterDestroy = await validateSession(session.token);
    expect(afterDestroy.valid).toBe(false);

    clearUnlockedToken();
    expect(isUnlocked()).toBe(false);
    expect(getUnlockedToken()).toBeNull();
  });

  it("readVault lança se a senha estiver errada", async () => {
    const { readVault } = await import("@/server/vault/store");
    await expect(readVault("senha-completamente-errada")).rejects.toThrow();
  });
});
