import { NextResponse, type NextRequest } from "next/server";
import { isAllowedHost } from "@/lib/host-check";

/*
 * Este middleware roda no Edge runtime do Next, que não tem node:crypto
 * nem better-sqlite3 — por isso ele só faz checagens de string (Host,
 * Origin, Sec-Fetch-Site). A validação real de sessão (hash SHA-256
 * contra o banco) acontece em src/server/guards.ts, chamada por todo
 * Route Handler antes de qualquer lógica de negócio. A ordem completa
 * é: Host check (aqui) → sessão (no handler) → origem (no handler,
 * reforçando o que já é checado aqui) → input (no handler).
 *
 * A3 — DNS rebinding. isAllowedHost() (src/lib/host-check.ts) é a defesa:
 * um site malicioso pode registrar um domínio que resolve para 127.0.0.1
 * e fazer o browser da vítima mandar requisições para o painel, mas o
 * browser da vítima manda o Host do domínio do atacante (ex: evil.com),
 * não 127.0.0.1 — então rejeitamos qualquer Host que não seja loopback.
 */

const STATE_CHANGING_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

/*
 * A3 — CSRF.
 * Sec-Fetch-Site é enviado pelo browser e não pode ser falsificado por
 * JavaScript de página — é a defesa mais forte disponível. Origin é
 * reforço para browsers antigos que não mandam Sec-Fetch-Site. Uma
 * requisição sem nenhum dos dois (curl, scripts locais — ver A8) só
 * passa com X-Local-Client + sessão válida, verificado no Route Handler.
 */
function hasLegitimateOrigin(req: NextRequest): boolean {
  const secFetchSite = req.headers.get("sec-fetch-site");
  if (secFetchSite) {
    return secFetchSite === "same-origin" || secFetchSite === "none";
  }

  const origin = req.headers.get("origin");
  if (origin) {
    const allowedOrigins = new Set([
      `http://${req.headers.get("host")}`,
      `https://${req.headers.get("host")}`,
    ]);
    return allowedOrigins.has(origin);
  }

  // Nem Sec-Fetch-Site nem Origin presentes (ex: curl). O Route Handler
  // decide se X-Local-Client + sessão válida compensam essa ausência —
  // aqui apenas deixamos passar para essa checagem mais completa.
  return true;
}

export function middleware(req: NextRequest) {
  const hostHeader = req.headers.get("host");

  if (!isAllowedHost(hostHeader)) {
    return new NextResponse(null, { status: 421 });
  }

  if (STATE_CHANGING_METHODS.has(req.method) && !hasLegitimateOrigin(req)) {
    return NextResponse.json(
      {
        error: {
          code: "CROSS_SITE_REQUEST_BLOCKED",
          message:
            "Requisição rejeitada: origem não confiável. Se isto é uma chamada local legítima, inclua o header X-Local-Client.",
        },
      },
      { status: 403 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Roda em tudo, exceto assets estáticos internos do Next — esses não
     * mudam estado e não precisam da checagem de origem/host repetida a
     * cada asset.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
