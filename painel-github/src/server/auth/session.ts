import "server-only";
import { randomBytes, createHash } from "node:crypto";
import { getDb } from "../db";
import { sessions } from "../db/schema";
import { eq, lt } from "drizzle-orm";

export const SESSION_COOKIE_NAME = "painel_session";
const SESSION_TOKEN_BYTES = 32;
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8h
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30min

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface CreatedSession {
  token: string; // valor cru — vai só no cookie, nunca no banco
  expiresAt: Date;
}

/**
 * Cria uma nova sessão após unlock bem-sucedido. O banco guarda apenas o
 * hash SHA-256 do token — um dump do banco não permite forjar uma
 * sessão válida. Ver docs/SECURITY.md §4.4, ameaça A8.
 */
export async function createSession(): Promise<CreatedSession> {
  const token = randomBytes(SESSION_TOKEN_BYTES).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

  getDb()
    .insert(sessions)
    .values({
      tokenHash: hashToken(token),
      createdAt: now,
      expiresAt,
      lastSeenAt: now,
    })
    .run();

  return { token, expiresAt };
}

export type SessionValidation =
  | { valid: true }
  | { valid: false; reason: "not_found" | "expired" | "inactive" };

/**
 * Valida um token de sessão: existe, não expirou (8h desde criação), e
 * não ficou inativo por mais de 30min. Renovação deslizante: toda
 * validação bem-sucedida atualiza lastSeenAt, então uso contínuo do
 * painel nunca expira por inatividade — só 8h de idade absoluta ou 30min
 * de silêncio total encerram a sessão.
 */
export async function validateSession(token: string): Promise<SessionValidation> {
  const db = getDb();
  const tokenHash = hashToken(token);
  const row = db.select().from(sessions).where(eq(sessions.tokenHash, tokenHash)).get();

  if (!row) return { valid: false, reason: "not_found" };

  const now = new Date();

  if (row.expiresAt < now) {
    db.delete(sessions).where(eq(sessions.id, row.id)).run();
    return { valid: false, reason: "expired" };
  }

  const inactiveSince = now.getTime() - row.lastSeenAt.getTime();
  if (inactiveSince > INACTIVITY_TIMEOUT_MS) {
    db.delete(sessions).where(eq(sessions.id, row.id)).run();
    return { valid: false, reason: "inactive" };
  }

  db.update(sessions).set({ lastSeenAt: now }).where(eq(sessions.id, row.id)).run();
  return { valid: true };
}

export async function destroySession(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  getDb().delete(sessions).where(eq(sessions.tokenHash, tokenHash)).run();
}

/**
 * Remove sessões expiradas do banco. Chamado no boot e periodicamente —
 * não é crítico para segurança (validateSession já rejeita sessões
 * expiradas), é higiene para não acumular linhas indefinidamente.
 */
export async function pruneExpiredSessions(): Promise<void> {
  getDb().delete(sessions).where(lt(sessions.expiresAt, new Date())).run();
}
