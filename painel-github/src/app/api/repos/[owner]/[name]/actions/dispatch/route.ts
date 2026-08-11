import "server-only";
import { NextResponse } from "next/server";
import { requireSession, requireSameOrigin, GuardError } from "@/server/guards";
import { RepoParamsSchema } from "@/server/schemas/github";
import { DispatchWorkflowSchema } from "@/server/schemas/actions";
import { dispatchWorkflow } from "@/server/github/actions";
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
    const parsedBody = DispatchWorkflowSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsedBody.error.issues[0]?.message ?? "Entrada inválida.",
          },
        },
        { status: 400 },
      );
    }

    await dispatchWorkflow(
      { owner: parsedParams.data.owner, name: parsedParams.data.name },
      parsedBody.data.workflowId,
      parsedBody.data.ref,
      parsedBody.data.inputs,
    );

    return NextResponse.json({ dispatched: true });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }

    const status =
      typeof err === "object" && err !== null && "status" in err
        ? Number((err as { status: unknown }).status)
        : undefined;

    if (status === 422) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_WORKFLOW_REF",
            message:
              "A branch/tag informada não existe, ou o workflow não tem workflow_dispatch habilitado.",
          },
        },
        { status: 422 },
      );
    }

    logError("Erro inesperado em POST /api/repos/[owner]/[name]/actions/dispatch", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        error: {
          code: "GITHUB_REQUEST_FAILED",
          message: "Não foi possível disparar o workflow. Tente novamente em instantes.",
        },
      },
      { status: 502 },
    );
  }
}
