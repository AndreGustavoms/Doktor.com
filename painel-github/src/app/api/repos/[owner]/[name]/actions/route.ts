import "server-only";
import { NextResponse } from "next/server";
import { requireSession, requireSameOrigin, GuardError } from "@/server/guards";
import { RepoParamsSchema } from "@/server/schemas/github";
import { listWorkflows, listWorkflowRuns } from "@/server/github/actions";
import { logError } from "@/server/log";

export async function GET(req: Request, context: { params: Promise<{ owner: string; name: string }> }) {
  try {
    await requireSession();
    requireSameOrigin(req);

    const params = await context.params;
    const parsed = RepoParamsSchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Parâmetros inválidos." } },
        { status: 400 },
      );
    }

    const identity = { owner: parsed.data.owner, name: parsed.data.name };
    const [workflowsResult, runsResult] = await Promise.all([
      listWorkflows(identity),
      listWorkflowRuns(identity),
    ]);

    return NextResponse.json({
      workflows: workflowsResult.workflows,
      runs: runsResult.runs,
    });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    logError("Erro inesperado em GET /api/repos/[owner]/[name]/actions", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        error: {
          code: "GITHUB_REQUEST_FAILED",
          message: "Não foi possível carregar workflows. Tente novamente em instantes.",
        },
      },
      { status: 502 },
    );
  }
}
