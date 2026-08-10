import "server-only";
import { NextResponse } from "next/server";
import { requireSameOrigin } from "@/server/guards";
import { SESSION_COOKIE_NAME, destroySession } from "@/server/auth/session";
import { clearUnlockedToken } from "@/server/vault/session-state";
import { clearRegisteredSecret, logInfo } from "@/server/log";

export async function POST(req: Request) {
  requireSameOrigin(req);

  const cookieStore = req.headers.get("cookie") ?? "";
  const match = cookieStore.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  const token = match?.[1];

  if (token) {
    await destroySession(token);
  }

  // A ordem importa: limpa o secret registrado para redação DEPOIS de
  // parar de precisar dele para logar, mas antes de qualquer outra
  // requisição poder ler o estado em memória.
  clearUnlockedToken();

  logInfo("Painel bloqueado");
  clearRegisteredSecret();

  const response = NextResponse.json({ locked: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
