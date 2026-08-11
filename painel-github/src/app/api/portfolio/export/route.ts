import "server-only";
import { NextResponse } from "next/server";
import { requireSession, requireSameOrigin, GuardError } from "@/server/guards";
import { exportPortfolio } from "@/server/portfolio-export";
import { logAction } from "@/server/activity-log";
import { logError } from "@/server/log";

export async function POST(req: Request) {
  try {
    await requireSession();
    requireSameOrigin(req);

    const result = await exportPortfolio();
    return NextResponse.json({ outDir: result.outDir, itemCount: result.itemCount });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }

    const message = err instanceof Error ? err.message : String(err);
    logAction({ action: "portfolio.export", target: "out/portfolio", result: "failure", error: message });
    logError("Erro inesperado em POST /api/portfolio/export", { error: message });
    return NextResponse.json(
      { error: { code: "PORTFOLIO_EXPORT_FAILED", message: "Erro ao exportar o portfólio." } },
      { status: 500 },
    );
  }
}
