import { describe, it, expect } from "vitest";
import { redact, registerSecretForRedaction, clearRegisteredSecret } from "@/server/log";

/*
 * Ver docs/SECURITY.md, ameaça A7 — vazamento por log. Este teste cobre
 * o critério da Seção 10 do prompt original: um objeto de log contendo
 * token sai com [REDACTED].
 */
describe("redact", () => {
  it("redige um fine-grained PAT do GitHub", () => {
    const input = "Authorization: Bearer github_pat_11ABCDEFG0123456789012345678901234567890abcdefghij";
    expect(redact(input)).not.toContain("github_pat_");
    expect(redact(input)).toContain("[REDACTED]");
  });

  it("redige um classic PAT (ghp_)", () => {
    const input = `token=ghp_${"a".repeat(36)}`;
    expect(redact(input)).toBe("token=[REDACTED]");
  });

  it("redige tokens gho_, ghs_, ghu_", () => {
    for (const prefix of ["gho_", "ghs_", "ghu_"]) {
      const input = `${prefix}${"b".repeat(36)}`;
      expect(redact(input)).toBe("[REDACTED]");
    }
  });

  it("redige o token atual registrado mesmo que não bata com os padrões de regex", () => {
    const customToken = "um-formato-de-token-que-nao-existe-ainda";
    registerSecretForRedaction(customToken);

    const input = `Authorization: Bearer ${customToken}`;
    expect(redact(input)).toBe("Authorization: Bearer [REDACTED]");

    clearRegisteredSecret();
  });

  it("não redige texto sem nenhum segredo", () => {
    const input = "GET /api/repos 200 45ms";
    expect(redact(input)).toBe(input);
  });

  it("redige múltiplas ocorrências na mesma string", () => {
    const token = `ghp_${"c".repeat(36)}`;
    const input = `first=${token} second=${token}`;
    expect(redact(input)).toBe("first=[REDACTED] second=[REDACTED]");
  });
});
