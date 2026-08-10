import "server-only";
import { NextResponse } from "next/server";
import { requireSameOrigin } from "@/server/guards";
import { UnlockSchema } from "@/server/schemas/auth";
import { verifyMasterPassword, isLockedOut, recordLoginAttempt, hasMasterPassword } from "@/server/auth/password";
import { createSession, SESSION_COOKIE_NAME } from "@/server/auth/session";
import { readVault, vaultExists } from "@/server/vault/store";
import { setUnlockedToken } from "@/server/vault/session-state";
import { registerSecretForRedaction, logInfo, logWarn, logError } from "@/server/log";

export async function POST(req: Request) {
  try {
    requireSameOrigin(req);

    if (!(await hasMasterPassword()) || !vaultExists()) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_SETUP",
            message: "O painel ainda não foi configurado. Rode o wizard de setup primeiro.",
          },
        },
        { status: 409 },
      );
    }

    const lockedUntil = await isLockedOut();
    if (lockedUntil) {
      return NextResponse.json(
        {
          error: {
            code: "LOCKED_OUT",
            message: `Muitas tentativas erradas. Tente de novo às ${lockedUntil.toLocaleTimeString("pt-BR")}.`,
          },
        },
        { status: 429 },
      );
    }

    const body = await req.json();
    const parsed = UnlockSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message ?? "Entrada inválida.",
          },
        },
        { status: 400 },
      );
    }

    const { password } = parsed.data;
    const isValid = await verifyMasterPassword(password);

    await recordLoginAttempt(isValid);

    if (!isValid) {
      logWarn("Tentativa de unlock com senha incorreta");
      return NextResponse.json(
        { error: { code: "WRONG_PASSWORD", message: "Senha mestra incorreta." } },
        { status: 401 },
      );
    }

    // Decifra o vault com a mesma senha já verificada. Não deveria
    // falhar aqui (a senha já bateu contra o hash da tabela auth), mas
    // se o vault.enc estiver corrompido ou salvo com uma senha diferente
    // por algum motivo, o authTag do GCM vai rejeitar — tratado como
    // erro interno, não como senha errada (a senha estava certa).
    const token = await readVault(password);
    setUnlockedToken(token);
    registerSecretForRedaction(token);

    const session = await createSession();

    logInfo("Painel destravado");

    const response = NextResponse.json({ unlocked: true });
    response.cookies.set(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      secure: req.url.startsWith("https://"),
      expires: session.expiresAt,
    });

    return response;
  } catch (err) {
    logError("Erro inesperado no unlock", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Erro interno ao destravar o painel." } },
      { status: 500 },
    );
  }
}
