import { describe, it, expect } from "vitest";
import { requireSameOrigin, GuardError } from "@/server/guards";

/*
 * Ver docs/SECURITY.md, ameaça A3 (CSRF) — critério da Seção 10 do
 * prompt original: POST com Sec-Fetch-Site: cross-site recebe 403.
 * src/middleware.ts já faz essa checagem na borda (Edge runtime), mas
 * roda em processo separado dos testes de unidade — este arquivo cobre
 * requireSameOrigin() (src/server/guards.ts), a segunda camada que roda
 * dentro de todo Route Handler e é o que os testes de unidade conseguem
 * exercitar diretamente sem subir um servidor HTTP.
 */
function makeRequest(headers: Record<string, string>): Request {
  return new Request("http://127.0.0.1:3000/api/repos", {
    method: "POST",
    headers,
  });
}

describe("requireSameOrigin — defesa contra CSRF", () => {
  it("bloqueia Sec-Fetch-Site: cross-site com 403", () => {
    const req = makeRequest({ "sec-fetch-site": "cross-site" });
    expect(() => requireSameOrigin(req)).toThrow(GuardError);
    try {
      requireSameOrigin(req);
    } catch (err) {
      expect(err).toBeInstanceOf(GuardError);
      expect((err as GuardError).status).toBe(403);
    }
  });

  it("aceita Sec-Fetch-Site: same-origin", () => {
    const req = makeRequest({ "sec-fetch-site": "same-origin" });
    expect(() => requireSameOrigin(req)).not.toThrow();
  });

  it("aceita Sec-Fetch-Site: none (navegação direta, extensão local)", () => {
    const req = makeRequest({ "sec-fetch-site": "none" });
    expect(() => requireSameOrigin(req)).not.toThrow();
  });

  it("bloqueia Sec-Fetch-Site: same-site (subdomínio distinto não é same-origin)", () => {
    const req = makeRequest({ "sec-fetch-site": "same-site" });
    expect(() => requireSameOrigin(req)).toThrow(GuardError);
  });

  it("sem Sec-Fetch-Site, aceita Origin que bate com Host", () => {
    const req = makeRequest({ origin: "http://127.0.0.1:3000", host: "127.0.0.1:3000" });
    expect(() => requireSameOrigin(req)).not.toThrow();
  });

  it("sem Sec-Fetch-Site, bloqueia Origin de um domínio de atacante", () => {
    const req = makeRequest({ origin: "https://evil.com", host: "127.0.0.1:3000" });
    expect(() => requireSameOrigin(req)).toThrow(GuardError);
  });

  it("sem Sec-Fetch-Site nem Origin, bloqueia por padrão (curl sem X-Local-Client)", () => {
    const req = makeRequest({});
    expect(() => requireSameOrigin(req)).toThrow(GuardError);
  });

  it("sem Sec-Fetch-Site nem Origin, aceita com X-Local-Client — caminho documentado para clientes locais", () => {
    const req = makeRequest({ "x-local-client": "1" });
    expect(() => requireSameOrigin(req)).not.toThrow();
  });

  it("X-Local-Client sozinho não sobrepõe um Sec-Fetch-Site cross-site explícito", () => {
    const req = makeRequest({ "sec-fetch-site": "cross-site", "x-local-client": "1" });
    expect(() => requireSameOrigin(req)).toThrow(GuardError);
  });
});
