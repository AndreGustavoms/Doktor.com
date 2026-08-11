import "server-only";
import { NextResponse } from "next/server";
import { requireSession, requireSameOrigin, GuardError } from "@/server/guards";
import { RepoParamsSchema } from "@/server/schemas/github";
import { UpdateRepoTopicsSchema } from "@/server/schemas/repo-settings";
import { updateRepoTopics } from "@/server/github/repo-settings";
import { logError } from "@/server/log";

export async function PUT(req: Request, context: { params: Promise<{ owner: string; name: string }> }) {
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
    const parsedBody = UpdateRepoTopicsSchema.safeParse(body);
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

    await updateRepoTopics(
      { owner: parsedParams.data.owner, name: parsedParams.data.name },
      parsedBody.data.topics,
    );

    return NextResponse.json({ updated: true });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    logError("Erro inesperado em PUT /api/repos/[owner]/[name]/topics", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        error: {
          code: "GITHUB_REQUEST_FAILED",
          message: "Não foi possível salvar os topics. Tente novamente em instantes.",
        },
      },
      { status: 502 },
    );
  }
}
