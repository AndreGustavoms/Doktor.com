import "server-only";
import {
  scrypt,
  randomBytes,
  createCipheriv,
  createDecipheriv,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto";

/*
 * util.promisify(scrypt) só infere a sobrecarga de 4 argumentos (sem
 * options) — a sobrecarga com ScryptOptions fica inacessível ao
 * promisify por como o TypeScript resolve overloads via inferência.
 * Envolvendo manualmente preservamos a sobrecarga que precisamos (com
 * maxmem, obrigatório para N=2^17 — ver abaixo).
 */
function scryptAsync(password: string, salt: Buffer, keylen: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, options, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

/*
 * Parâmetros de derivação de chave — ver prompt original §4.4/4.5 e
 * docs/SECURITY.md, ameaças A2/A8. N=2^17 é o custo que faz brute-force
 * offline caro sem tornar o unlock perceptivelmente lento (~300-500ms
 * numa máquina comum).
 */
export const SCRYPT_PARAMS = {
  N: 2 ** 17,
  r: 8,
  p: 1,
  keylen: 32,
} as const;

/*
 * scrypt exige maxmem >= Blen + Vlen, onde Blen = p*128*r e
 * Vlen = 32*r*(N+2)*4. Para N=2^17, r=8, p=1: Blen=1024,
 * Vlen=134.219.776, total=134.220.800 bytes. O padrão do Node (32MB) é
 * insuficiente para esses parâmetros e a chamada falharia sem isto.
 */
const SCRYPT_MAXMEM = 150 * 1024 * 1024;

const AES_ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const SALT_LENGTH = 16;

/**
 * Deriva uma chave de 32 bytes a partir de uma senha e salt, usando os
 * parâmetros de custo definidos acima. Usado tanto para a senha mestra
 * (auth.passwordHash não usa isto — ver password.ts) quanto para a
 * chave de cifra do vault.
 */
export async function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return scryptAsync(password, salt, SCRYPT_PARAMS.keylen, {
    N: SCRYPT_PARAMS.N,
    r: SCRYPT_PARAMS.r,
    p: SCRYPT_PARAMS.p,
    maxmem: SCRYPT_MAXMEM,
  });
}

export function generateSalt(): Buffer {
  return randomBytes(SALT_LENGTH);
}

export interface EncryptedPayload {
  iv: string; // hex
  authTag: string; // hex
  ciphertext: string; // hex
}

/**
 * Cifra `plaintext` com AES-256-GCM sob `key`. IV aleatório de 12 bytes
 * por chamada — nunca reutilizado entre duas cifras com a mesma chave,
 * o que quebraria a garantia de confidencialidade do GCM. Ver
 * docs/SECURITY.md §4.5 (guarda do token do GitHub, camada 2).
 */
export function encrypt(plaintext: string, key: Buffer): EncryptedPayload {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(AES_ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
    ciphertext: ciphertext.toString("hex"),
  };
}

/**
 * Decifra um payload gerado por encrypt(). Lança se a chave estiver
 * errada ou o payload tiver sido adulterado — o GCM verifica o authTag
 * antes de retornar qualquer byte de plaintext, então não há risco de
 * decifrar parcialmente um payload corrompido.
 */
export function decrypt(payload: EncryptedPayload, key: Buffer): string {
  const iv = Buffer.from(payload.iv, "hex");
  const authTag = Buffer.from(payload.authTag, "hex");
  const ciphertext = Buffer.from(payload.ciphertext, "hex");

  const decipher = createDecipheriv(AES_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}

/**
 * Compara dois buffers em tempo constante — usado para comparar hashes
 * de senha/sessão sem vazar informação por timing attack. Buffers de
 * tamanhos diferentes nunca são iguais, mas timingSafeEqual exige mesmo
 * tamanho, então checamos isso primeiro (o próprio length não é segredo).
 */
export function safeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
