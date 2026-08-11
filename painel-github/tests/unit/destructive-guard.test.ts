import { describe, it, expect, afterEach } from "vitest";
import { requireDestructiveAllowed, GuardError } from "@/server/guards";

/*
 * Ver docs/SECURITY.md, ameaça A9 — critério funcional da Seção 10 do
 * prompt original: "ação destrutiva bloqueada com a flag desligada".
 * requireDestructiveAllowed() é chamado por toda ação destrutiva de
 * verdade (ex: setRepoVisibility em src/server/github/repo-settings.ts)
 * antes de qualquer chamada ao GitHub — este teste cobre a função
 * isoladamente, sem precisar montar uma requisição HTTP completa.
 */

const ORIGINAL_ENV = process.env.ALLOW_DESTRUCTIVE;

afterEach(() => {
  if (ORIGINAL_ENV === undefined) {
    delete process.env.ALLOW_DESTRUCTIVE;
  } else {
    process.env.ALLOW_DESTRUCTIVE = ORIGINAL_ENV;
  }
});

describe("requireDestructiveAllowed — flag de ações destrutivas", () => {
  it("bloqueia quando ALLOW_DESTRUCTIVE não está definida", () => {
    delete process.env.ALLOW_DESTRUCTIVE;
    expect(() => requireDestructiveAllowed()).toThrow(GuardError);
  });

  it("bloqueia quando ALLOW_DESTRUCTIVE=false — ausência não é opt-in silencioso", () => {
    process.env.ALLOW_DESTRUCTIVE = "false";
    expect(() => requireDestructiveAllowed()).toThrow(GuardError);
  });

  it("bloqueia qualquer valor que não seja exatamente 'true' (ex: '1', 'TRUE', 'yes')", () => {
    for (const value of ["1", "TRUE", "yes", "on", ""]) {
      process.env.ALLOW_DESTRUCTIVE = value;
      expect(() => requireDestructiveAllowed()).toThrow(GuardError);
    }
  });

  it("erro lançado é 403 com código DESTRUCTIVE_ACTIONS_DISABLED", () => {
    delete process.env.ALLOW_DESTRUCTIVE;
    try {
      requireDestructiveAllowed();
      expect.unreachable("deveria ter lançado GuardError");
    } catch (err) {
      expect(err).toBeInstanceOf(GuardError);
      expect((err as GuardError).status).toBe(403);
      expect((err as GuardError).code).toBe("DESTRUCTIVE_ACTIONS_DISABLED");
    }
  });

  it("permite quando ALLOW_DESTRUCTIVE=true exatamente", () => {
    process.env.ALLOW_DESTRUCTIVE = "true";
    expect(() => requireDestructiveAllowed()).not.toThrow();
  });
});
