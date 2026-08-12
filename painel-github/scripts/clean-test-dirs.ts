/*
 * Remove os diretórios data-test-* órfãos antes da suíte rodar.
 *
 * Cada teste de integração isola seu banco via PAINEL_DATA_DIR e tenta
 * limpar o próprio diretório no afterAll — mas no Windows o
 * better-sqlite3 mantém o arquivo aberto até o processo encerrar (o
 * getDb() é um singleton pensado para viver a vida inteira do processo,
 * ver src/server/db/index.ts), então esse rmSync falha em silêncio com
 * EPERM e o diretório sobrevive.
 *
 * O efeito é uma falha intermitente e confusa: tests/unit/auth-flow.test.ts
 * começa afirmando hasMasterPassword() === false, mas encontra a senha
 * mestra que a execução ANTERIOR deixou para trás — o teste passa
 * sozinho e falha na suíte completa, o que parece bug de ordem de
 * execução e não é. Limpar aqui, antes de tudo, elimina a classe
 * inteira de problema em vez de depender de lembrar do rm -rf manual.
 */
import { readdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const PREFIX = "data-test-";

function main() {
  const removed: string[] = [];
  const failed: string[] = [];

  for (const entry of readdirSync(ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith(PREFIX)) continue;

    const full = join(ROOT, entry.name);
    try {
      rmSync(full, { recursive: true, force: true });
      if (!existsSync(full)) removed.push(entry.name);
      else failed.push(entry.name);
    } catch {
      failed.push(entry.name);
    }
  }

  if (removed.length > 0) {
    console.log(`[clean-test-dirs] removidos: ${removed.join(", ")}`);
  }

  /*
   * Falha ruidosamente em vez de seguir: um diretório que não pôde ser
   * apagado (processo Node ainda vivo segurando o .db) faria a suíte
   * falhar depois, de um jeito bem menos óbvio que esta mensagem.
   */
  if (failed.length > 0) {
    console.error(
      `[clean-test-dirs] NÃO foi possível remover: ${failed.join(", ")}\n` +
        `Provavelmente há um processo Node ainda segurando o banco. Encerre-o ` +
        `(no Windows: taskkill /F /IM node.exe) e rode de novo.`,
    );
    process.exit(1);
  }
}

main();
