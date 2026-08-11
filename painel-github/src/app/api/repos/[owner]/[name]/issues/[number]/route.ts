import "server-only";
import { NextResponse } from "next/server";
import { requireSession, requireSameOrigin, GuardError } from "@/server/guards";
import { UpdateIssueSchema, IssueNumberParamsSchema } from "@/server/schemas/issues";
import { setIssueState, setIssueLabels } from "@/server/github/issues";
import { logError } from "@/server/log";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ owner: string; name: string; number: string }> },
) {
  try {
    await requireSession();
    requireSameOrigin(req);

    const params = await context.params;
    const parsedParams = IssueNumberParamsSchema.safeParse(params);
    if (!parsedParams.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Parâmetros inválidos." } },
        { status: 400 },
      );
    }

    const body = await req.json();
    const parsedBody = UpdateIssueSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Entrada inválida." } },
        { status: 400 },
      );
    }

    const identity = { owner: parsedParams.data.owner, name: parsedParams.data.name };
    const { number } = parsedParams.data;

    if (parsedBody.data.state) {
      await setIssueState(identity, number, parsedBody.data.state);
    }
    if (parsedBody.data.labels) {
      await setIssueLabels(identity, number, parsedBody.data.labels);
    }

    return NextResponse.json({ updated: true });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    logError("Erro inesperado em PATCH /api/repos/[owner]/[name]/issues/[number]", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        error: {
          code: "GITHUB_REQUEST_FAILED",
          message: "Não foi possível atualizar a issue. Tente novamente em instantes.",
        },
      },
      { status: 502 },
    );
  }
}
