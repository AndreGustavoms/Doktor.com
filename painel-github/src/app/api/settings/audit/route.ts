import "server-only";
import { NextResponse } from "next/server";
import { requireSession, requireSameOrigin, GuardError } from "@/server/guards";
import { runSecurityAudit } from "@/server/security-audit";
import { logAction } from "@/server/activity-log";
import { logError } from "@/server/log";

/*
 * POST em vez de GET porque a auditoria é uma ação explícita do usuário
 * (botão "Rodar auditoria" em /settings), não um dado que a página busca
 * ao carregar — e fica registrada no log de atividade, o que só faz
 * sentido para uma ação, não uma leitura passiva.
 */
export async function POST(req: Request) {
  try {
    await requireSession();
    requireSameOrigin(req);

    const items = runSecurityAudit();
    const failed = items.filter((item) => item.status === "fail");

    logAction({
      action: "settings.security_audit",
      target: "painel-github",
      payload: { failedCount: failed.length, total: items.length },
      result: failed.length === 0 ? "success" : "failure",
    });

    return NextResponse.json({ items });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    logError("Erro inesperado em POST /api/settings/audit", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Erro ao rodar auditoria de segurança." } },
      { status: 500 },
    );
  }
}
