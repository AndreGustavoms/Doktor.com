import "server-only";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { hasMasterPassword } from "@/server/auth/password";
import { vaultExists } from "@/server/vault/store";
import { SESSION_COOKIE_NAME, validateSession } from "@/server/auth/session";
import { isUnlocked } from "@/server/vault/session-state";

/**
 * Rota de leitura, sem mutação de estado — usada pelas páginas
 * (setup/unlock/dashboard) para decidir o que renderizar. Não exige
 * sessão (é o próprio mecanismo que decide se uma sessão é necessária),
 * mas não devolve nenhum dado sensível: apenas booleanos de estado.
 */
export async function GET() {
  const isSetup = (await hasMasterPassword()) && vaultExists();

  if (!isSetup) {
    return NextResponse.json({ setup: false, sessionValid: false, unlocked: false });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const sessionResult = token ? await validateSession(token) : { valid: false as const };

  return NextResponse.json({
    setup: true,
    sessionValid: sessionResult.valid,
    unlocked: sessionResult.valid && isUnlocked(),
  });
}
