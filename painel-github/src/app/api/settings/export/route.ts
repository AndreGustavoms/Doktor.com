import "server-only";
import { NextResponse } from "next/server";
import { requireSession, GuardError } from "@/server/guards";
import { exportLocalData } from "@/server/data-export";
import { logError } from "@/server/log";

export async function GET() {
  try {
    await requireSession();
    const data = exportLocalData();

    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="painel-github-export.json"',
      },
    });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    logError("Erro inesperado em GET /api/settings/export", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Erro ao exportar dados." } },
      { status: 500 },
    );
  }
}
