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

/*
 * A1/A5/A6 — Content-Security-Policy.
 * A CSP (incluindo script-src) é definida em src/middleware.ts, não
 * aqui — ela precisa de um nonce gerado por requisição para permitir o
 * script inline que o próprio Next.js App Router injeta em cada página,
 * sem abrir mão de bloquear script injetado por XSS (ver comentário em
 * middleware.ts para o raciocínio completo e o bug que motivou a
 * mudança). Os headers abaixo não dependem de nonce — continuam
 * estáticos aqui.
 *
 * 'unsafe-eval' NUNCA é permitido, em nenhum modo — instrução explícita
 * do prompt original (§4.9).
 */
const securityHeaders = [
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
