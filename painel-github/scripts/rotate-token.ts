/*
 * Troca o token no vault sem refazer o setup inteiro — referenciado
 * desde a Fase 0 (docs/SECURITY.md, procedimento de incidente A2) e
 * pedido no prompt original §7.9/§13 ("rotacionar token").
 *
 * Roda via CLI (fora do processo do painel) porque pedir a senha mestra
 * e o token novo por stdin é mais simples e mais seguro que expor essa
 * operação como Route Handler HTTP: rotação de token já assume que
 * você tem acesso à máquina, então não há ganho de segurança em fazer
 * isso pela UI web — e um script CLI evita qualquer risco de CSRF ou
 * XSS nesse fluxo particularmente sensível.
 */
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

async function main() {
  const rl = createInterface({ input: stdin, output: stdout });

  console.log("Rotação de token — troca o token do GitHub no vault cifrado.\n");

  const password = await rl.question("Senha mestra atual: ");
  const newToken = await rl.question("Novo token do GitHub: ");
  rl.close();

  if (!password || !newToken) {
    console.error("Senha e token são obrigatórios.");
    process.exit(1);
  }

  const tokenPattern = /^(ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{22,})$/;
  if (!tokenPattern.test(newToken)) {
    console.error("Formato de token inválido — esperado ghp_... ou github_pat_...");
    process.exit(1);
  }

  // Import dinâmico depois da validação de input — evita carregar
  // node:crypto/melhor-sqlite3 se a validação básica já falhou.
  const { readVault, writeVault } = await import("../src/server/vault/store");

  try {
    // readVault confirma que a senha está correta antes de qualquer
    // escrita — se a senha estiver errada, isso lança e nada é tocado.
    await readVault(password);
  } catch {
    console.error("Senha mestra incorreta. Nada foi alterado.");
    process.exit(1);
  }

  await writeVault(newToken, password);
  console.log("\nToken rotacionado com sucesso. Reinicie o painel para usar o token novo.");
  console.log("Lembre-se de revogar o token antigo em github.com/settings/tokens.");
}

main().catch((err) => {
  console.error("Erro inesperado:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
