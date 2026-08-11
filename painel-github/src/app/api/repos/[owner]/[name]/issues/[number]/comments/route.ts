import "server-only";
import { NextResponse } from "next/server";
import { requireSession, requireSameOrigin, GuardError } from "@/server/guards";
import { CommentIssueSchema, IssueNumberParamsSchema } from "@/server/schemas/issues";
import { commentOnIssue } from "@/server/github/issues";
import { logError } from "@/server/log";

export async function POST(
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
    const parsedBody = CommentIssueSchema.safeParse(body);
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

    await commentOnIssue(
      { owner: parsedParams.data.owner, name: parsedParams.data.name },
      parsedParams.data.number,
      parsedBody.data.body,
    );

    return NextResponse.json({ commented: true });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    logError("Erro inesperado em POST /api/repos/[owner]/[name]/issues/[number]/comments", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        error: {
          code: "GITHUB_REQUEST_FAILED",
          message: "Não foi possível comentar. Tente novamente em instantes.",
        },
      },
      { status: 502 },
    );
  }
}
