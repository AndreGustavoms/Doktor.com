import "server-only";
import { NextResponse } from "next/server";
import { requireSession, requireSameOrigin, GuardError } from "@/server/guards";
import { RepoParamsSchema } from "@/server/schemas/github";
import { getRepo } from "@/server/github/repo-detail";
import { logError } from "@/server/log";

export async function GET(req: Request, context: { params: Promise<{ owner: string; name: string }> }) {
  try {
    await requireSession();
    requireSameOrigin(req);

    // params é sempre Promise no Next 16 — ver docs/ARCHITECTURE.md.
    const params = await context.params;
    const parsed = RepoParamsSchema.safeParse(params);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message ?? "Parâmetros inválidos.",
            field: parsed.error.issues[0]?.path.join("."),
          },
        },
        { status: 400 },
      );
    }

    const result = await getRepo({ owner: parsed.data.owner, name: parsed.data.name });
    return NextResponse.json(result);
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

    if (status === 404) {
      return NextResponse.json(
        { error: { code: "REPO_NOT_FOUND", message: "Repositório não encontrado." } },
        { status: 404 },
      );
    }

    logError("Erro inesperado em GET /api/repos/[owner]/[name]", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        error: {
          code: "GITHUB_REQUEST_FAILED",
          message: "Não foi possível carregar o repositório. Tente novamente em instantes.",
        },
      },
      { status: 502 },
    );
  }
}
