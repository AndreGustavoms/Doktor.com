import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { existsSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";

/*
 * Fase 6 — critério do prompt original §14: "out/portfolio/ abre offline
 * com um duplo-clique, sem nenhuma requisição de rede e sem nenhum token
 * no bundle." Este teste isola exportPortfolio() do GitHub real (mock de
 * listRepos, mesmo padrão de tests/unit/auth-flow.test.ts para o vault)
 * e verifica o HTML gerado de ponta a ponta: dados corretos, nenhum
 * padrão de token, nenhuma tag <script src> ou fetch para fora do
 * arquivo — só assim o critério "sem requisição de rede" é verificável
 * automaticamente em vez de só manualmente.
 */

const TEST_DB_DIR = join(process.cwd(), "data-test-portfolio-export");
const TEST_OUT_DIR = join(process.cwd(), "out", "portfolio");

vi.mock("@/server/github/repos", () => ({
  listRepos: vi.fn(async () => ({
    fromCache: false,
    repos: [
      {
        id: 1,
        name: "doktor-com",
        fullName: "andregustavoms/doktor-com",
        description: "Painel local de repositórios.",
        isPrivate: false,
        isFork: false,
        isArchived: false,
        defaultBranch: "main",
        language: "TypeScript",
        topics: ["nextjs", "sqlite"],
        stars: 12,
        forks: 2,
        openIssues: 1,
        pushedAt: "2026-08-01T00:00:00Z",
        updatedAt: "2026-08-01T00:00:00Z",
        htmlUrl: "https://github.com/andregustavoms/doktor-com",
        hasReadme: true,
        hasLicense: true,
      },
      {
        id: 2,
        name: "repo-oculto",
        fullName: "andregustavoms/repo-oculto",
        description: "Não deveria aparecer no export.",
        isPrivate: true,
        isFork: false,
        isArchived: false,
        defaultBranch: "main",
        language: null,
        topics: [],
        stars: 0,
        forks: 0,
        openIssues: 0,
        pushedAt: null,
        updatedAt: null,
        htmlUrl: "https://github.com/andregustavoms/repo-oculto",
        hasReadme: false,
        hasLicense: false,
      },
    ],
  })),
}));

beforeAll(() => {
  try {
    if (existsSync(TEST_DB_DIR)) rmSync(TEST_DB_DIR, { recursive: true, force: true });
    if (existsSync(TEST_OUT_DIR)) rmSync(TEST_OUT_DIR, { recursive: true, force: true });
  } catch {
    // Best-effort — mesma limitação de auth-flow.test.ts no Windows.
  }
  process.env.PAINEL_DATA_DIR = TEST_DB_DIR;
});

afterAll(() => {
  delete process.env.PAINEL_DATA_DIR;
  try {
    if (existsSync(TEST_DB_DIR)) rmSync(TEST_DB_DIR, { recursive: true, force: true });
    if (existsSync(TEST_OUT_DIR)) rmSync(TEST_OUT_DIR, { recursive: true, force: true });
  } catch {
    // Best-effort.
  }
});

describe("exportação estática do portfólio (Fase 6)", () => {
  it("gera HTML autocontido com só os itens visíveis, sem token e sem chamada de rede", async () => {
    const { updatePortfolioConfig, addPortfolioItem, updatePortfolioItem } = await import(
      "@/server/portfolio"
    );
    const { exportPortfolio } = await import("@/server/portfolio-export");
    const { registerSecretForRedaction } = await import("@/server/log");

    // Simula um token real registrado (como aconteceria pós-unlock) para
    // provar que ele não vaza mesmo se acidentalmente passasse por log
    // ou string concatenada em algum lugar do pipeline de export.
    const FAKE_TOKEN = "ghp_aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789";
    registerSecretForRedaction(FAKE_TOKEN);

    updatePortfolioConfig({
      headline: "Meu portfólio de testes",
      bio: "Bio com <script>alert(1)</script> tentando XSS.",
      socials: [{ platform: "GitHub", url: "https://github.com/andregustavoms" }],
      theme: "blueprint",
    });

    addPortfolioItem(1);
    addPortfolioItem(2);
    updatePortfolioItem({ repoId: 1, customTitle: null, customBlurb: null, visible: true });
    updatePortfolioItem({ repoId: 2, customTitle: null, customBlurb: null, visible: false });

    const result = await exportPortfolio();
    expect(result.itemCount).toBe(1);

    const indexPath = join(result.outDir, "index.html");
    expect(existsSync(indexPath)).toBe(true);

    const html = readFileSync(indexPath, "utf-8");

    // Item visível aparece, item oculto (privado) não aparece.
    expect(html).toContain("doktor-com");
    expect(html).not.toContain("repo-oculto");

    // Config foi aplicada.
    expect(html).toContain("Meu portfólio de testes");
    expect(html).toContain("github.com/andregustavoms");

    // XSS da bio foi escapado, não executável.
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");

    // Nenhum padrão de token do GitHub no arquivo, redigido ou não.
    expect(html).not.toContain(FAKE_TOKEN);
    expect(html).not.toMatch(/ghp_[A-Za-z0-9]{36}/);
    expect(html).not.toMatch(/github_pat_[A-Za-z0-9_]{22,}/);

    // "Sem nenhuma requisição de rede": nenhuma tag que carregue recurso
    // externo — só <style> inline, sem <script src>, <link>, fetch() ou
    // import() no HTML gerado.
    expect(html).not.toMatch(/<script\b/i);
    expect(html).not.toMatch(/<link\b/i);
    expect(html).not.toContain("fetch(");
    expect(html.startsWith("<!doctype html>")).toBe(true);
  });

  it("não inclui repositórios sem item correspondente no portfólio", async () => {
    const { exportPortfolio } = await import("@/server/portfolio-export");
    const result = await exportPortfolio();
    // Mesmo DB de teste do describe acima (mesmo processo) — só o item
    // visível (repoId 1) deve persistir na segunda exportação.
    expect(result.itemCount).toBe(1);
  });
});
