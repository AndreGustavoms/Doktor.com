import { defineConfig, devices } from "@playwright/test";
import { join } from "node:path";

/*
 * PAINEL_DATA_DIR isolado para o e2e — mesmo mecanismo usado pelos
 * testes de integração em tests/unit/ (ver auth-flow.test.ts). Sem
 * isso, "npm run test:e2e" reaproveitaria data/app.db do uso manual do
 * painel em desenvolvimento, e o teste de setup falharia com 409
 * ("já configurado") em qualquer execução após a primeira.
 */
const E2E_DATA_DIR = join(process.cwd(), "data-test-e2e");

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // um único servidor de dev/teste, sem paralelismo de estado
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  use: {
    // O painel só existe em loopback — nunca aponte isto para outro host.
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    env: {
      PAINEL_DATA_DIR: E2E_DATA_DIR,
    },
  },
});
