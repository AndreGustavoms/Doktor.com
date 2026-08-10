import "server-only";
import { NextResponse } from "next/server";
import { requireSession, requireSameOrigin, GuardError } from "@/server/guards";
import { RepoParamsSchema, RepoListQuerySchema } from "@/server/schemas/github";
import { listCommits } from "@/server/github/repo-detail";
import { logError } from "@/server/log";

export async function GET(req: Request, context: { params: Promise<{ owner: string; name: string }> }) {
  try {
    await requireSession();
    requireSameOrigin(req);

    const params = await context.params;
    const parsedParams = RepoParamsSchema.safeParse(params);

    if (!parsedParams.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsedParams.error.issues[0]?.message ?? "Parâmetros inválidos.",
            field: parsedParams.error.issues[0]?.path.join("."),
          },
        },
        { status: 400 },
      );
    }

    const url = new URL(req.url);
    const parsedQuery = RepoListQuerySchema.safeParse({
      page: url.searchParams.get("page") ?? undefined,
      perPage: url.searchParams.get("perPage") ?? undefined,
    });

    if (!parsedQuery.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsedQuery.error.issues[0]?.message ?? "Parâmetros inválidos.",
          },
        },
        { status: 400 },
      );
    }

    const result = await listCommits(
      { owner: parsedParams.data.owner, name: parsedParams.data.name },
      parsedQuery.data.page,
      parsedQuery.data.perPage,
    );

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }

    logError("Erro inesperado em GET /api/repos/[owner]/[name]/commits", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        error: {
          code: "GITHUB_REQUEST_FAILED",
          message: "Não foi possível carregar os commits. Tente novamente em instantes.",
        },
      },
      { status: 502 },
    );
  }
}
