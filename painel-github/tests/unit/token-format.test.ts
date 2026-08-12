import { describe, it, expect } from "vitest";
import { SetupSchema } from "@/server/schemas/auth";

/*
 * Formato de token aceito no setup — ver src/server/schemas/auth.ts.
 * A lista precisa cobrir exatamente os prefixos que src/server/log.ts
 * sabe redigir: um token que entra no painel mas escapa do logger é
 * justamente a ameaça A7 (vazamento por log).
 *
 * A regra existia desde a Fase 1 e recusava gho_ — o formato que o
 * `gh` CLI emite —, o que obrigava quem já tinha o gh autenticado a
 * criar um PAT só para o painel, sem ganhar segurança nenhuma.
 */
const SENHA_OK = "senha-mestra-de-teste-123";

function parse(githubToken: string) {
  return SetupSchema.safeParse({ password: SENHA_OK, githubToken });
}

describe("formato de token aceito no setup", () => {
  it("aceita fine-grained PAT (github_pat_)", () => {
    expect(parse("github_pat_" + "A".repeat(30)).success).toBe(true);
  });

  it("aceita classic PAT (ghp_)", () => {
    expect(parse("ghp_" + "a1B2c3D4e5".repeat(3) + "abcdef").success).toBe(true);
  });

  it("aceita token OAuth (gho_) — é o que o gh CLI emite", () => {
    expect(parse("gho_" + "a1B2c3D4e5".repeat(3) + "abcdef").success).toBe(true);
  });

  it("aceita tokens de GitHub App (ghs_ e ghu_)", () => {
    expect(parse("ghs_" + "a1B2c3D4e5".repeat(3) + "abcdef").success).toBe(true);
    expect(parse("ghu_" + "a1B2c3D4e5".repeat(3) + "abcdef").success).toBe(true);
  });

  it("rejeita string vazia", () => {
    expect(parse("").success).toBe(false);
  });

  it("rejeita token sem prefixo conhecido", () => {
    expect(parse("a".repeat(40)).success).toBe(false);
  });

  it("rejeita prefixo inventado que não é do GitHub", () => {
    expect(parse("ghx_" + "a".repeat(36)).success).toBe(false);
  });

  it("rejeita token curto demais para o prefixo", () => {
    expect(parse("ghp_abc").success).toBe(false);
  });

  it("rejeita token com espaço — erro clássico de copiar e colar", () => {
    expect(parse("ghp_" + "a".repeat(20) + " " + "b".repeat(15)).success).toBe(false);
  });

  it("continua exigindo senha de 12+ caracteres", () => {
    const curta = SetupSchema.safeParse({
      password: "curta",
      githubToken: "ghp_" + "a".repeat(36),
    });
    expect(curta.success).toBe(false);
  });
});
