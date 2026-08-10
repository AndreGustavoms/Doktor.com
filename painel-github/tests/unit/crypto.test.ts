import { describe, it, expect } from "vitest";
import { deriveKey, generateSalt, encrypt, decrypt, safeEqual } from "@/server/vault/crypto";

/*
 * Ver docs/SECURITY.md — camada 2 da guarda do token do GitHub (A1/A2).
 * Estes testes cobrem exatamente os três critérios da Seção 10 do
 * prompt original: ida e volta funciona, senha errada falha na
 * verificação do authTag, e IV nunca se repete entre duas cifras.
 */
describe("vault crypto", () => {
  it("cifra e decifra corretamente (ida e volta)", async () => {
    const salt = generateSalt();
    const key = await deriveKey("senha-de-teste-forte", salt);
    const plaintext = "github_pat_valorSecretoDeExemplo123456789";

    const payload = encrypt(plaintext, key);
    const decrypted = decrypt(payload, key);

    expect(decrypted).toBe(plaintext);
  });

  it("falha na verificação do authTag quando a chave (senha) está errada", async () => {
    const salt = generateSalt();
    const correctKey = await deriveKey("senha-correta", salt);
    const wrongKey = await deriveKey("senha-errada", salt);

    const payload = encrypt("segredo", correctKey);

    expect(() => decrypt(payload, wrongKey)).toThrow();
  });

  it("nunca reutiliza o IV entre duas cifras com a mesma chave", async () => {
    const salt = generateSalt();
    const key = await deriveKey("senha", salt);

    const ivs = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const payload = encrypt(`mensagem-${i}`, key);
      ivs.add(payload.iv);
    }

    expect(ivs.size).toBe(50);
  });

  it("deriva chaves diferentes para salts diferentes com a mesma senha", async () => {
    const key1 = await deriveKey("mesma-senha", generateSalt());
    const key2 = await deriveKey("mesma-senha", generateSalt());

    expect(key1.equals(key2)).toBe(false);
  });

  it("deriva a mesma chave para o mesmo salt e senha (determinístico)", async () => {
    const salt = generateSalt();
    const key1 = await deriveKey("senha-fixa", salt);
    const key2 = await deriveKey("senha-fixa", salt);

    expect(key1.equals(key2)).toBe(true);
  });

  it("safeEqual compara corretamente buffers iguais e diferentes", () => {
    const a = Buffer.from("valor-identico");
    const b = Buffer.from("valor-identico");
    const c = Buffer.from("valor-diferente");
    const d = Buffer.from("tamanho-diferente-maior-ainda");

    expect(safeEqual(a, b)).toBe(true);
    expect(safeEqual(a, c)).toBe(false);
    expect(safeEqual(a, d)).toBe(false);
  });
});
