import { test, expect } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/*
 * E2E completo — critério da Seção 10 do prompt original: "setup
 * completo → destravar → listar repos → abrir um → editar README →
 * verificar commit → bloquear". Roda contra a API real do GitHub (não
 * mockada) usando um token e repositório de teste fornecidos via
 * .env.local (nunca commitado — ver .gitignore). Se GITHUB_TOKEN ou
 * E2E_TEST_REPO não estiverem definidos, os testes são pulados: este
 * arquivo não deveria quebrar CI de quem não tem essas credenciais
 * configuradas.
 *
 * O comando `npm run start` (usado pelo webServer do Playwright, ver
 * playwright.config.ts) carrega .env.local automaticamente — mas este
 * processo de teste em si é um processo Node separado, sem esse
 * carregamento automático. Não adicionamos a dependência `dotenv` só
 * para isto: um parser mínimo de KEY=VALUE resolve sem dependência nova.
 *
 * O commit real criado no README do repositório de teste inclui um
 * marcador com timestamp no corpo, para ser identificável e não colidir
 * com o conteúdo anterior.
 */

function loadEnvLocal(): Record<string, string> {
  const path = join(process.cwd(), ".env.local");
  if (!existsSync(path)) return {};

  const result: Record<string, string> = {};
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    result[trimmed.slice(0, eqIndex).trim()] = trimmed.slice(eqIndex + 1).trim();
  }
  return result;
}

const envLocal = loadEnvLocal();
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? envLocal.GITHUB_TOKEN;
const TEST_REPO = process.env.E2E_TEST_REPO ?? envLocal.E2E_TEST_REPO ?? "AndreGustavoms/PrismaTest";
const [TEST_OWNER, TEST_REPO_NAME] = TEST_REPO.split("/");

const MASTER_PASSWORD = "senha-e2e-teste-bem-forte-2026";

test.describe("fluxo completo (Fase 7)", () => {
  test.skip(!GITHUB_TOKEN, "GITHUB_TOKEN não definido em .env.local — pulando e2e com API real.");

  test("setup → unlock → listar → abrir → editar README → verificar commit → bloquear", async ({
    page,
  }) => {
    // 1. Setup completo.
    await page.goto("/setup");
    await expect(page.getByText("passo 1 de 4")).toBeVisible();

    await page.getByLabel("Senha mestra", { exact: true }).fill(MASTER_PASSWORD);
    await page.getByLabel("Confirmar senha").fill(MASTER_PASSWORD);
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page.getByText("passo 2 de 4")).toBeVisible();
    await page.getByLabel("Token do GitHub").fill(GITHUB_TOKEN!);
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page.getByText("passo 3 de 4")).toBeVisible();
    await page.getByRole("button", { name: "Finalizar setup" }).click();

    await expect(page.getByText("Token validado com sucesso")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "Entrar no painel" }).click();

    // 2. Dashboard carregou (sessão criada, vault destravado no boot do setup).
    await expect(page).toHaveURL("/");

    // 3. Bloquear e destravar de novo — prova que /unlock funciona
    // independentemente do fluxo de setup.
    await page.getByRole("button", { name: "Bloquear painel" }).click();
    await expect(page).toHaveURL("/unlock");

    await page.locator('input[type="password"]').fill(MASTER_PASSWORD);
    await page.getByRole("button", { name: "Destravar" }).click();
    await expect(page).toHaveURL("/");

    // 4. Listar repositórios.
    await page.goto("/repos");
    await expect(page.getByText("Carregando repositórios…")).toBeHidden({ timeout: 15_000 });

    const repoLink = page.getByRole("link").filter({ hasText: TEST_REPO_NAME }).first();
    await expect(repoLink).toBeVisible({ timeout: 15_000 });

    // 5. Abrir o repositório de teste.
    await repoLink.click();
    await expect(page).toHaveURL(new RegExp(`/repos/${TEST_OWNER}/${TEST_REPO_NAME}$`));

    // 6. Editar README — escopado à seção README (há outro botão
    // "Editar" na sidebar de metadados, ex: descrição/topics).
    const readmeSection = page.locator("section").filter({ hasText: "README" }).first();
    const editButton = readmeSection.getByRole("button", { name: /Editar|Criar README/ });
    await editButton.click();
    await expect(page.getByText("Editando README")).toBeVisible({ timeout: 10_000 });

    const marker = `e2e-painel-github-${Date.now()}`;
    const textarea = page.locator("textarea");
    const existing = await textarea.inputValue();
    await textarea.fill(`${existing}\n\n<!-- ${marker} -->\n`);

    await page.getByPlaceholder("Atualiza README").fill(`test: marcador e2e ${marker}`);

    const commitButton = page.getByRole("button", { name: "Commitar README" });
    await expect(commitButton).toBeEnabled();
    await commitButton.click();

    // 7. Verificar commit — a UI volta para modo "view" só após o PUT
    // retornar 200 (ver ReadmeEditor.handleCommit); confirmamos também
    // contra a API do GitHub que o commit chegou de verdade.
    await expect(page.getByText("Editando README")).toBeHidden({ timeout: 15_000 });

    const commitsResponse = await fetch(
      `https://api.github.com/repos/${TEST_OWNER}/${TEST_REPO_NAME}/commits?per_page=1`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          "User-Agent": "painel-github-e2e-verification",
          Accept: "application/vnd.github+json",
        },
      },
    );
    expect(commitsResponse.ok).toBe(true);
    const commits = await commitsResponse.json();
    expect(commits[0]?.commit?.message).toContain(marker);

    // 8. Bloquear o painel ao final do fluxo.
    await page.getByRole("button", { name: "Bloquear painel" }).click();
    await expect(page).toHaveURL("/unlock");
  });
});
