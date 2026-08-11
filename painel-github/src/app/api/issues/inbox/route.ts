import "server-only";
import { NextResponse } from "next/server";
import { requireSession, GuardError } from "@/server/guards";
import { getUnifiedInbox } from "@/server/github/inbox";
import { logError } from "@/server/log";

export async function GET() {
  try {
    await requireSession();
    const items = await getUnifiedInbox();
    return NextResponse.json({ items });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    logError("Erro inesperado em GET /api/issues/inbox", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        error: {
          code: "GITHUB_REQUEST_FAILED",
          message: "Não foi possível carregar a inbox. Tente novamente em instantes.",
        },
      },
      { status: 502 },
    );
  }
}
