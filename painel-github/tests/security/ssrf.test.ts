import { describe, it, expect } from "vitest";
import { RepoParamsSchema, RepoListQuerySchema } from "@/server/schemas/github";

/*
 * Ver docs/SECURITY.md, ameaça A6/A8 — prevenção de SSRF e path
 * traversal. Critério da Seção 10 do prompt original: parâmetros com
 * ../, URL absoluta e caractere de controle são todos rejeitados.
 */
describe("RepoParamsSchema — validação de owner/repo", () => {
  it("aceita nomes válidos de owner/repo", () => {
    const result = RepoParamsSchema.safeParse({ owner: "octocat", name: "hello-world" });
    expect(result.success).toBe(true);
  });

  it("rejeita path traversal (../)", () => {
    const result = RepoParamsSchema.safeParse({ owner: "..", name: "repo" });
    expect(result.success).toBe(false);
  });

  it("rejeita path traversal embutido", () => {
    const result = RepoParamsSchema.safeParse({ owner: "octocat", name: "../../etc/passwd" });
    expect(result.success).toBe(false);
  });

  it("rejeita barra (/) — impediria escapar do segmento de rota", () => {
    const result = RepoParamsSchema.safeParse({ owner: "octocat/evil", name: "repo" });
    expect(result.success).toBe(false);
  });

  it("rejeita barra invertida (\\)", () => {
    const result = RepoParamsSchema.safeParse({ owner: "octocat", name: "repo\\evil" });
    expect(result.success).toBe(false);
  });

  it("rejeita URL absoluta como valor de owner", () => {
    const result = RepoParamsSchema.safeParse({
      owner: "https://internal.metadata.service",
      name: "repo",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita caractere de controle (null byte)", () => {
    const result = RepoParamsSchema.safeParse({ owner: "octocat\x00", name: "repo" });
    expect(result.success).toBe(false);
  });

  it("rejeita porcentagem (encoding disfarçado)", () => {
    const result = RepoParamsSchema.safeParse({ owner: "octocat%2e%2e", name: "repo" });
    expect(result.success).toBe(false);
  });

  it("rejeita string vazia", () => {
    const result = RepoParamsSchema.safeParse({ owner: "", name: "repo" });
    expect(result.success).toBe(false);
  });
});

describe("RepoListQuerySchema — clamp de paginação", () => {
  it("aceita valores padrão quando nada é passado", () => {
    const result = RepoListQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.perPage).toBe(30);
  });

  it("faz clamp de perPage acima de 100", () => {
    const result = RepoListQuerySchema.safeParse({ perPage: "500" });
    expect(result.success).toBe(false);
  });

  it("rejeita page negativo", () => {
    const result = RepoListQuerySchema.safeParse({ page: "-1" });
    expect(result.success).toBe(false);
  });

  it("rejeita valores não numéricos", () => {
    const result = RepoListQuerySchema.safeParse({ page: "não-é-numero" });
    expect(result.success).toBe(false);
  });
});
