import "server-only";
import { NextResponse } from "next/server";
import { requireSession, requireSameOrigin, GuardError } from "@/server/guards";
import { RepoParamsSchema } from "@/server/schemas/github";
import { RerunWorkflowSchema } from "@/server/schemas/actions";
import { reRunWorkflowRun } from "@/server/github/actions";
import { logError } from "@/server/log";

export async function POST(req: Request, context: { params: Promise<{ owner: string; name: string }> }) {
  try {
    await requireSession();
    requireSameOrigin(req);

    const params = await context.params;
    const parsedParams = RepoParamsSchema.safeParse(params);
    if (!parsedParams.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Parâmetros inválidos." } },
        { status: 400 },
      );
    }

    const body = await req.json();
    const parsedBody = RerunWorkflowSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "ID de execução inválido." } },
        { status: 400 },
      );
    }

    await reRunWorkflowRun(
      { owner: parsedParams.data.owner, name: parsedParams.data.name },
      parsedBody.data.runId,
    );

    return NextResponse.json({ reRun: true });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    logError("Erro inesperado em POST /api/repos/[owner]/[name]/actions/rerun", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        error: {
          code: "GITHUB_REQUEST_FAILED",
          message: "Não foi possível re-executar o workflow. Tente novamente em instantes.",
        },
      },
      { status: 502 },
    );
  }
}
