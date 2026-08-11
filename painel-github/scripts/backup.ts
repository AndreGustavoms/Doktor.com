/*
 * Dump do SQLite com timestamp — referenciado desde a Fase 0
 * (package.json → db:backup), implementado na Fase 5 junto com o resto
 * de "ajustes" do prompt original §7.9. Copia data/app.db para
 * data/backups/app-<timestamp>.db; NÃO faz backup de vault.enc (a cópia
 * do vault cifrado em outro lugar não é mais segura que o original —
 * se alguém tem acesso ao backup, tem acesso ao mesmo vault.enc; o
 * ganho de um backup separado seria só redundância contra corrupção de
 * disco, que fica fora do escopo de um `npm run db:backup` simples).
 */
import { existsSync, copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const DATA_DIR = process.env.PAINEL_DATA_DIR ?? join(process.cwd(), "data");
const DB_PATH = join(DATA_DIR, "app.db");
const BACKUP_DIR = join(DATA_DIR, "backups");

function main() {
  if (!existsSync(DB_PATH)) {
    console.error(`Banco não encontrado em ${DB_PATH} — rode o painel ao menos uma vez antes.`);
    process.exit(1);
  }

  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = join(BACKUP_DIR, `app-${timestamp}.db`);

  copyFileSync(DB_PATH, backupPath);
  console.log(`Backup criado em ${backupPath}`);
}

main();
