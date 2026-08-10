import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, validateSession } from "./auth/session";
import { isUnlocked } from "./vault/session-state";

export class GuardError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Primeira checagem de todo Route Handler autenticado (ver
 * docs/API.md — forma de todo Route Handler, passo 1). Lança 401 se não
 * houver cookie de sessão válido, ou 423 se a sessão existe mas o vault
 * está bloqueado (sessão de cookie e unlock do vault são independentes —
 * ver README/ARCHITECTURE sobre o botão "Bloquear painel").
 */
export async function requireSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    throw new GuardError(401, "NO_SESSION", "Sessão não encontrada. Destrave o painel.");
  }

  const result = await validateSession(token);
  if (!result.valid) {
    const messages: Record<typeof result.reason, string> = {
      not_found: "Sessão inválida. Destrave o painel novamente.",
      expired: "Sessão expirada após 8 horas. Destrave o painel novamente.",
      inactive: "Sessão encerrada por 30 minutos de inatividade. Destrave o painel novamente.",
    };
    throw new GuardError(401, "SESSION_INVALID", messages[result.reason]);
  }

  if (!isUnlocked()) {
    throw new GuardError(
      423,
      "VAULT_LOCKED",
      "O painel está bloqueado. Digite a senha mestra para continuar.",
    );
  }
}

/**
 * Segunda camada de verificação de origem — reforça o que
 * src/middleware.ts já checou (ver docs/SECURITY.md, ameaça A3). Existe
 * separadamente porque o middleware roda em Edge runtime e não tem
 * acesso à sessão validada contra o banco; aqui, com a sessão já
 * confirmada por requireSession, uma requisição sem Origin/Sec-Fetch-Site
 * pode ser aceita SE apresentar X-Local-Client — esse é o único lugar
 * onde essa combinação é avaliada.
 */
export function requireSameOrigin(req: Request): void {
  const secFetchSite = req.headers.get("sec-fetch-site");
  if (secFetchSite === "same-origin" || secFetchSite === "none") return;

  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host) {
    const allowed = new Set([`http://${host}`, `https://${host}`]);
    if (allowed.has(origin)) return;
  }

  const isLocalClient = req.headers.get("x-local-client") === "1";
  if (!secFetchSite && !origin && isLocalClient) return;

  throw new GuardError(
    403,
    "CROSS_SITE_REQUEST_BLOCKED",
    "Requisição rejeitada: origem não confiável.",
  );
}
