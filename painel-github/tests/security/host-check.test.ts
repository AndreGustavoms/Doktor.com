import { describe, it, expect } from "vitest";
import { isAllowedHost } from "@/lib/host-check";

/*
 * Ver docs/SECURITY.md — ameaça A3 (DNS rebinding). Este teste garante
 * que a checagem de Host feita em src/middleware.ts recusa qualquer coisa
 * que não seja explicitamente loopback — é a peça central da defesa
 * contra rebinding, então precisa estar coberta antes de qualquer outra
 * feature ser construída em cima.
 */
describe("isAllowedHost", () => {
  it("aceita 127.0.0.1 com e sem porta", () => {
    expect(isAllowedHost("127.0.0.1")).toBe(true);
    expect(isAllowedHost("127.0.0.1:3000")).toBe(true);
  });

  it("aceita localhost com e sem porta", () => {
    expect(isAllowedHost("localhost")).toBe(true);
    expect(isAllowedHost("localhost:3000")).toBe(true);
  });

  it("aceita [::1] (IPv6 loopback) com e sem porta", () => {
    expect(isAllowedHost("[::1]")).toBe(true);
    expect(isAllowedHost("[::1]:3000")).toBe(true);
  });

  it("rejeita domínio de atacante — o cenário central de DNS rebinding", () => {
    expect(isAllowedHost("evil.com")).toBe(false);
    expect(isAllowedHost("evil.com:3000")).toBe(false);
  });

  it("rejeita IP da LAN — não é loopback mesmo sendo uma rede privada", () => {
    expect(isAllowedHost("192.168.1.10:3000")).toBe(false);
  });

  it("rejeita host nulo ou vazio", () => {
    expect(isAllowedHost(null)).toBe(false);
    expect(isAllowedHost("")).toBe(false);
  });

  it("rejeita subdomínio que tenta se passar por loopback", () => {
    expect(isAllowedHost("127.0.0.1.evil.com")).toBe(false);
    expect(isAllowedHost("localhost.evil.com")).toBe(false);
  });
});
