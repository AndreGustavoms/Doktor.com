import type { NextConfig } from "next";

/*
 * A4 — Exposição na rede local.
 * `next dev`/`next start` sem -H já são vinculados via package.json scripts,
 * mas essa checagem é a última linha de defesa: se alguém definir HOST no
 * ambiente (deploy script, systemd unit, docker-compose mal configurado)
 * para qualquer coisa que não seja loopback, abortamos o processo em vez de
 * escutar silenciosamente numa interface exposta.
 */
const host = process.env.HOST;
const loopbackHosts = new Set(["127.0.0.1", "localhost", "::1"]);
if (host && !loopbackHosts.has(host)) {
  throw new Error(
    `HOST="${host}" não é loopback. Este painel nunca deve escutar fora de 127.0.0.1 — ` +
      `ver docs/SECURITY.md §4.1 (ameaça A4). Abortando para evitar exposição na rede local.`,
  );
}

const isProd = process.env.NODE_ENV === "production";

/*
 * A1/A5/A6 — Content-Security-Policy.
 * script-src sem 'unsafe-inline' em produção é o que torna XSS (A5) inerte
 * mesmo que o sanitizador de markdown falhe em algum caso — defesa em
 * profundidade. connect-src 'self' impede que JS injetado exfiltre dados
 * para um host externo (relevante também para A6, SSRF client-side).
 *
 * 'unsafe-eval' NUNCA é permitido, em nenhum modo — instrução explícita
 * do prompt original (§4.9). 'unsafe-inline' em script-src fica restrito
 * a dev, onde o Next injeta scripts inline para o HMR (hot module reload);
 * se o overlay de erro do dev quebrar por causa disso, ainda assim não
 * afrouxe 'unsafe-eval' — resolva de outra forma.
 */
const csp = [
  "default-src 'self'",
  isProd ? "script-src 'self'" : "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://avatars.githubusercontent.com",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "form-action 'none'",
  "base-uri 'none'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  {
    key: "Permissions-Policy",
    value: "geolocation=(), microphone=(), camera=(), payment=(), usb=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
