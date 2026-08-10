import "server-only";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { existsSync, mkdirSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import * as schema from "./schema";

/*
 * PAINEL_DATA_DIR permite isolar o diretório de dados — usado pelos
 * testes de integração (tests/unit/auth-flow.test.ts) para não
 * conflitar com o data/ real de desenvolvimento. Fora de teste, sempre
 * data/ na raiz do projeto.
 */
const DATA_DIR = process.env.PAINEL_DATA_DIR ?? join(process.cwd(), "data");
const DB_PATH = join(DATA_DIR, "app.db");
const MIGRATIONS_FOLDER = join(process.cwd(), "src", "server", "db", "migrations");

function ensureDataDir() {
  const dir = dirname(DB_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function backupBeforeMigrate() {
  if (!existsSync(DB_PATH)) return;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = join(dirname(DB_PATH), `app.db.pre-migrate-${timestamp}.bak`);
  copyFileSync(DB_PATH, backupPath);
}

let instance: BetterSQLite3Database<typeof schema> | undefined;

/*
 * Lazy singleton por processo — de propósito, NÃO abre o banco no
 * top-level do módulo. `next build` importa módulos de rota em paralelo
 * (múltiplos workers) para coletar metadata, mesmo de páginas dinâmicas
 * (ver docs/ARCHITECTURE.md) — se a abertura/migration do SQLite
 * acontecesse no import, workers concorrentes disputariam a criação do
 * mesmo arquivo .db e o build falhava com SQLITE_BUSY. Adiando para a
 * primeira chamada real de getDb() (que só acontece em runtime, dentro
 * de um Route Handler ou Server Component sendo de fato executado), o
 * import do módulo vira inócuo e a corrida desaparece.
 */
export function getDb(): BetterSQLite3Database<typeof schema> {
  if (instance) return instance;

  ensureDataDir();
  backupBeforeMigrate();

  const sqlite = new Database(DB_PATH, { timeout: 5000 });
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  instance = drizzle(sqlite, { schema });
  migrate(instance, { migrationsFolder: MIGRATIONS_FOLDER });

  return instance;
}
