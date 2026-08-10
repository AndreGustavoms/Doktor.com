import { describe, it, expect } from "vitest";
import { toRepoDTO } from "@/server/github/dto";

/*
 * Ver docs/SECURITY.md, ameaça A1 — allowlist, não denylist. Critério da
 * Seção 10 do prompt original: campo extra na resposta simulada do
 * GitHub não passa para a saída.
 */
describe("toRepoDTO", () => {
  const validRawRepo = {
    id: 12345,
    name: "meu-repo",
    full_name: "usuario/meu-repo",
    description: "Um repositório de exemplo",
    private: false,
    fork: false,
    archived: false,
    default_branch: "main",
    language: "TypeScript",
    topics: ["cli", "tooling"],
    stargazers_count: 10,
    forks_count: 2,
    open_issues_count: 3,
    pushed_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-02T00:00:00Z",
    html_url: "https://github.com/usuario/meu-repo",
    license: { key: "mit" },
  };

  it("mapeia campos conhecidos corretamente", () => {
    const dto = toRepoDTO(validRawRepo);
    expect(dto.id).toBe(12345);
    expect(dto.fullName).toBe("usuario/meu-repo");
    expect(dto.isPrivate).toBe(false);
    expect(dto.hasLicense).toBe(true);
  });

  it("campo extra na resposta crua não vaza para o DTO — allowlist real", () => {
    const rawWithExtraFields = {
      ...validRawRepo,
      // Campos que o GitHub de fato inclui em alguns endpoints e que
      // NUNCA deveriam chegar ao client.
      owner: { email: "dono@example.com", login: "usuario" },
      permissions: { admin: true, push: true, pull: true },
      installation: { id: 999, access_tokens_url: "https://api.github.com/..." },
      clone_url: "https://x-access-token:ghs_secreto@github.com/usuario/meu-repo.git",
    };

    const dto = toRepoDTO(rawWithExtraFields);
    const serialized = JSON.stringify(dto);

    expect(serialized).not.toContain("owner");
    expect(serialized).not.toContain("permissions");
    expect(serialized).not.toContain("installation");
    expect(serialized).not.toContain("clone_url");
    expect(serialized).not.toContain("ghs_secreto");
    expect(serialized).not.toContain("dono@example.com");
  });

  it("description e language nulos viram null, não undefined", () => {
    const dto = toRepoDTO({ ...validRawRepo, description: null, language: null });
    expect(dto.description).toBeNull();
    expect(dto.language).toBeNull();
  });

  it("hasLicense é false quando license é null", () => {
    const dto = toRepoDTO({ ...validRawRepo, license: null });
    expect(dto.hasLicense).toBe(false);
  });

  it("lança se um campo obrigatório do schema estiver ausente ou com tipo errado", () => {
    const broken = { ...validRawRepo, id: "não-é-um-número" };
    expect(() => toRepoDTO(broken)).toThrow();
  });
});
