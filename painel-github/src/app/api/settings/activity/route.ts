import "server-only";
import { NextResponse } from "next/server";
import { requireSession, GuardError } from "@/server/guards";
import { listRecentActivity } from "@/server/activity-log";
import { logError } from "@/server/log";

export async function GET() {
  try {
    await requireSession();
    return NextResponse.json({ activity: listRecentActivity(50) });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    logError("Erro inesperado em GET /api/settings/activity", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Erro ao carregar log de atividade." } },
      { status: 500 },
    );
  }
}
