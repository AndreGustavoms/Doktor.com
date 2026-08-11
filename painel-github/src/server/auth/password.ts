import "server-only";
import { deriveKey, generateSalt, safeEqual, SCRYPT_PARAMS } from "../vault/crypto";
import { getDb } from "../db";
import { auth, loginAttempts } from "../db/schema";
import { desc, eq } from "drizzle-orm";
import { readVault, writeVault } from "../vault/store";

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

export async function hasMasterPassword(): Promise<boolean> {
  const row = getDb().select().from(auth).limit(1).all();
  return row.length > 0;
}

/**
 * Cria a senha mestra no primeiro boot. Chamado uma única vez pelo
 * wizard de setup — não há endpoint de "trocar senha" que reutilize
 * isto sem antes deletar a linha existente (ver Fase 5, settings).
 */
export async function createMasterPassword(password: string): Promise<void> {
  const salt = generateSalt();
  const hash = await deriveKey(password, salt);

  getDb()
    .insert(auth)
    .values({
      passwordSalt: salt.toString("hex"),
      passwordHash: hash.toString("hex"),
      scryptParams: JSON.stringify(SCRYPT_PARAMS),
      createdAt: new Date(),
    })
    .run();
}

/**
 * Verifica a senha mestra em tempo constante. Deriva a chave de novo com
 * o salt guardado e compara byte a byte via timingSafeEqual — nunca
 * compara strings hex diretamente, o que vazaria informação por timing.
 */
export async function verifyMasterPassword(password: string): Promise<boolean> {
  const row = getDb().select().from(auth).limit(1).get();
  if (!row) return false;

  const salt = Buffer.from(row.passwordSalt, "hex");
  const storedHash = Buffer.from(row.passwordHash, "hex");
  const candidateHash = await deriveKey(password, salt);

  return safeEqual(candidateHash, storedHash);
}

/**
 * Trava por LOCKOUT_DURATION_MS após LOCKOUT_THRESHOLD tentativas
 * seguidas malsucedidas. Ver docs/SECURITY.md §4.4, ameaça A8.
 */
export async function isLockedOut(): Promise<Date | null> {
  const recentFailures = getDb()
    .select()
    .from(loginAttempts)
    .orderBy(desc(loginAttempts.at))
    .limit(LOCKOUT_THRESHOLD)
    .all();

  if (recentFailures.length < LOCKOUT_THRESHOLD) return null;
  if (recentFailures.some((a) => a.success)) return null;

  const mostRecentFailure = recentFailures[0];
  if (!mostRecentFailure) return null;

  const lockedUntil = new Date(mostRecentFailure.at.getTime() + LOCKOUT_DURATION_MS);
  return lockedUntil > new Date() ? lockedUntil : null;
}

export async function recordLoginAttempt(success: boolean): Promise<void> {
  getDb()
    .insert(loginAttempts)
    .values({
      at: new Date(),
      success,
      lockedUntil: null,
    })
    .run();
}

/**
 * Troca a senha mestra — precisa recifrar o vault junto, porque a
 * chave de cifra do token é derivada da senha mestra (ver
 * src/server/vault/crypto.ts). Decifra com a senha atual ANTES de
 * qualquer escrita: se currentPassword estiver errada, nada é alterado
 * (nem a linha de auth, nem o vault). Ver prompt original §7.9.
 */
export async function changeMasterPassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const existingRow = getDb().select().from(auth).limit(1).get();
  if (!existingRow) {
    throw new Error("Senha mestra atual incorreta.");
  }

  const isCurrentValid = await verifyMasterPassword(currentPassword);
  if (!isCurrentValid) {
    throw new Error("Senha mestra atual incorreta.");
  }

  // Decifra o vault com a senha atual antes de qualquer mudança — se
  // isso falhar (vault corrompido, dessincronizado da senha), abortamos
  // sem ter tocado a tabela auth.
  const token = await readVault(currentPassword);

  const salt = generateSalt();
  const hash = await deriveKey(newPassword, salt);

  getDb()
    .update(auth)
    .set({
      passwordSalt: salt.toString("hex"),
      passwordHash: hash.toString("hex"),
      scryptParams: JSON.stringify(SCRYPT_PARAMS),
    })
    .where(eq(auth.id, existingRow.id))
    .run();

  await writeVault(token, newPassword);
}
