import "server-only";
import { NextResponse } from "next/server";
import { requireSession, requireSameOrigin, GuardError } from "@/server/guards";
import { ChangePasswordSchema } from "@/server/schemas/settings";
import { changeMasterPassword } from "@/server/auth/password";
import { logError } from "@/server/log";

export async function POST(req: Request) {
  try {
    await requireSession();
    requireSameOrigin(req);

    const body = await req.json();
    const parsed = ChangePasswordSchema.safeParse(body);
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

    await changeMasterPassword(parsed.data.currentPassword, parsed.data.newPassword);
    return NextResponse.json({ changed: true });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }

    if (err instanceof Error && err.message === "Senha mestra atual incorreta.") {
      return NextResponse.json(
        { error: { code: "WRONG_PASSWORD", message: err.message } },
        { status: 401 },
      );
    }

    logError("Erro inesperado em POST /api/settings/change-password", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Erro ao trocar a senha mestra." } },
      { status: 500 },
    );
  }
}
