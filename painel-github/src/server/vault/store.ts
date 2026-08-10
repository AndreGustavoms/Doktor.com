import "server-only";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { deriveKey, generateSalt, encrypt, decrypt, type EncryptedPayload } from "./crypto";

// Ver PAINEL_DATA_DIR em src/server/db/index.ts — mesmo mecanismo de
// isolamento para testes de integração.
const DATA_DIR = process.env.PAINEL_DATA_DIR ?? join(process.cwd(), "data");
const VAULT_PATH = join(DATA_DIR, "vault.enc");

interface VaultFile {
  salt: string; // hex — separado do salt da senha mestra (ver crypto.ts)
  payload: EncryptedPayload;
}

function ensureDataDir() {
  const dir = dirname(VAULT_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export function vaultExists(): boolean {
  return existsSync(VAULT_PATH);
}

/**
 * Cifra `token` sob uma chave derivada de `password` e grava em
 * data/vault.enc. Chamado uma vez no wizard de setup, e de novo em
 * rotate-token (Fase 5). Sobrescreve qualquer vault existente.
 */
export async function writeVault(token: string, password: string): Promise<void> {
  ensureDataDir();
  const salt = generateSalt();
  const key = await deriveKey(password, salt);
  const payload = encrypt(token, key);

  const file: VaultFile = { salt: salt.toString("hex"), payload };
  writeFileSync(VAULT_PATH, JSON.stringify(file), { mode: 0o600 });
}

/**
 * Decifra o vault com `password` e retorna o token do GitHub em texto
 * plano. Lança se a senha estiver errada (falha na verificação do
 * authTag do GCM) ou se o vault não existir. O chamador é responsável
 * por só manter o retorno em memória, nunca escrevê-lo em disco — ver
 * src/server/vault/session-state.ts.
 */
export async function readVault(password: string): Promise<string> {
  if (!vaultExists()) {
    throw new Error("Vault não encontrado — rode o wizard de setup primeiro.");
  }

  const raw = readFileSync(VAULT_PATH, "utf8");
  const file: VaultFile = JSON.parse(raw);
  const salt = Buffer.from(file.salt, "hex");
  const key = await deriveKey(password, salt);

  return decrypt(file.payload, key);
}
