import { sqliteTable, text, integer, primaryKey, index, unique } from "drizzle-orm/sqlite-core";

/*
 * Sem "import server-only" aqui de propósito: este arquivo só declara
 * definições de tabela (sem lógica, sem segredo) e drizzle-kit precisa
 * importá-lo fora do bundler do Next (generate/migrate rodam em Node
 * puro) — "server-only" lança erro nesse contexto porque detecta o
 * bundler, não o ambiente de execução. A fronteira real está em
 * src/server/db/index.ts (o client do banco) e em qualquer módulo que
 * o importe, todos com "server-only" no topo.
 *
 * Esquema do banco local (SQLite + Drizzle). Ver prompt original §6 para
 * o desenho de referência e docs/ARCHITECTURE.md para decisões.
 *
 * Nenhuma tabela guarda o token do GitHub em texto plano — ele vive só
 * em data/vault.enc (cifrado) e em memória depois de destravado. Ver
 * src/server/vault/crypto.ts e docs/SECURITY.md, ameaça A1/A8.
 */

// Configuração da aplicação (chave/valor) — flags como ALLOW_DESTRUCTIVE
// quando definidas via UI em vez de env var.
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

// Autenticação local — senha mestra. Nunca guarda a senha, só o hash e
// os parâmetros de derivação necessários para reproduzi-lo.
// Ver docs/SECURITY.md, ameaça A8.
export const auth = sqliteTable("auth", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  passwordSalt: text("password_salt").notNull(),
  passwordHash: text("password_hash").notNull(),
  // JSON: { N, r, p, keylen } — permite migrar parâmetros de custo no
  // futuro sem invalidar hashes existentes.
  scryptParams: text("scrypt_params").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

// Sessões — guarda só o hash SHA-256 do token de sessão, nunca o token
// em si. Um dump do banco não permite forjar uma sessão válida.
export const sessions = sqliteTable(
  "sessions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tokenHash: text("token_hash").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    lastSeenAt: integer("last_seen_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    unique("sessions_token_hash_unique").on(table.tokenHash),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ],
);

// Tentativas de login — trava por 15min após 5 erradas (ver
// docs/SECURITY.md §4.4 / ameaça A8).
export const loginAttempts = sqliteTable("login_attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  at: integer("at", { mode: "timestamp_ms" }).notNull(),
  success: integer("success", { mode: "boolean" }).notNull(),
  lockedUntil: integer("locked_until", { mode: "timestamp_ms" }),
});

// Cache das respostas do GitHub — chega na Fase 2, schema definido aqui
// porque a migration desta fase já cria a tabela.
export const apiCache = sqliteTable(
  "api_cache",
  {
    key: text("key").primaryKey(),
    etag: text("etag"),
    payload: text("payload").notNull(),
    fetchedAt: integer("fetched_at", { mode: "timestamp_ms" }).notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("api_cache_expires_at_idx").on(table.expiresAt)],
);

export const rateLimitSnapshot = sqliteTable("rate_limit_snapshot", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  remaining: integer("remaining").notNull(),
  limit: integer("limit").notNull(),
  resetAt: integer("reset_at", { mode: "timestamp_ms" }).notNull(),
  recordedAt: integer("recorded_at", { mode: "timestamp_ms" }).notNull(),
});

// Dados só meus — nunca sobem pro GitHub (ver /notes, §7.7 do prompt original).
export const pinned = sqliteTable("pinned", {
  repoId: integer("repo_id").primaryKey(),
  position: integer("position").notNull(),
  pinnedAt: integer("pinned_at", { mode: "timestamp_ms" }).notNull(),
});

export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  color: text("color").notNull(),
});

export const repoTags = sqliteTable(
  "repo_tags",
  {
    repoId: integer("repo_id").notNull(),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.repoId, table.tagId] })],
);

export const notes = sqliteTable(
  "notes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    // null = nota geral, não vinculada a um repositório específico.
    repoId: integer("repo_id"),
    title: text("title").notNull(),
    body: text("body").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("notes_repo_id_idx").on(table.repoId)],
);

// Marca issues/PRs como lidos localmente — vive só aqui, nunca sincroniza
// com o GitHub. Ver §7.6 do prompt original (inbox unificada).
export const readState = sqliteTable(
  "read_state",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    kind: text("kind", { enum: ["issue", "pr"] }).notNull(),
    repoFullName: text("repo_full_name").notNull(),
    number: integer("number").notNull(),
    readAt: integer("read_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    unique("read_state_kind_repo_number_unique").on(table.kind, table.repoFullName, table.number),
  ],
);

// Auditoria — toda ação destrutiva é gravada aqui (ver docs/SECURITY.md,
// ameaça A9).
export const activityLog = sqliteTable(
  "activity_log",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    at: integer("at", { mode: "timestamp_ms" }).notNull(),
    action: text("action").notNull(),
    target: text("target").notNull(),
    payload: text("payload"),
    result: text("result", { enum: ["success", "failure"] }).notNull(),
    error: text("error"),
  },
  (table) => [index("activity_log_at_idx").on(table.at)],
);

// Portfólio — §7.8 do prompt original.
export const portfolioConfig = sqliteTable("portfolio_config", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  headline: text("headline").notNull(),
  bio: text("bio").notNull(),
  // JSON: array de { platform, url }
  socials: text("socials").notNull(),
  theme: text("theme").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const portfolioItems = sqliteTable("portfolio_items", {
  repoId: integer("repo_id").primaryKey(),
  position: integer("position").notNull(),
  customTitle: text("custom_title"),
  customBlurb: text("custom_blurb"),
  coverPath: text("cover_path"),
  visible: integer("visible", { mode: "boolean" }).notNull().default(true),
});
