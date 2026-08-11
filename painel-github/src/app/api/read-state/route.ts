import "server-only";
import { NextResponse } from "next/server";
import { requireSession, requireSameOrigin, GuardError } from "@/server/guards";
import { MarkReadSchema } from "@/server/schemas/inbox";
import { markAsRead, markAsUnread } from "@/server/github/inbox";
import { logError } from "@/server/log";

/*
 * Marcar como lido é local — vive no meu banco, não no GitHub. Ver
 * prompt original §7.6.
 */
export async function POST(req: Request) {
  try {
    await requireSession();
    requireSameOrigin(req);

    const body = await req.json();
    const parsed = MarkReadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Entrada inválida." } },
        { status: 400 },
      );
    }

    const { kind, repoFullName, number, read } = parsed.data;
    if (read) {
      markAsRead(kind, repoFullName, number);
    } else {
      markAsUnread(kind, repoFullName, number);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    logError("Erro inesperado em POST /api/read-state", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Erro ao marcar como lido." } },
      { status: 500 },
    );
  }
}
