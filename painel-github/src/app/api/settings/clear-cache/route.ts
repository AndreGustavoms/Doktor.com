import "server-only";
import { NextResponse } from "next/server";
import { requireSession, requireSameOrigin, GuardError } from "@/server/guards";
import { clearAllCache } from "@/server/cache";
import { logError } from "@/server/log";

export async function POST(req: Request) {
  try {
    await requireSession();
    requireSameOrigin(req);

    clearAllCache();
    return NextResponse.json({ cleared: true });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    logError("Erro inesperado em POST /api/settings/clear-cache", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Erro ao limpar cache." } },
      { status: 500 },
    );
  }
}
