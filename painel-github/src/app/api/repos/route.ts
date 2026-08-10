import "server-only";
import { NextResponse } from "next/server";
import { requireSession, requireSameOrigin, GuardError } from "@/server/guards";
import { RepoListQuerySchema } from "@/server/schemas/github";
import { listRepos } from "@/server/github/repos";
import { logError } from "@/server/log";

export async function GET(req: Request) {
  try {
    // 1. Sessão válida? Senão 401/423.
    await requireSession();

    // 2. Origem legítima? (GET não muda estado, mas valida sempre —
    // ver docs/API.md, forma de todo Route Handler.)
    requireSameOrigin(req);

    // 3. Input validado com Zod.
    const url = new URL(req.url);
    const parsed = RepoListQuerySchema.safeParse({
      page: url.searchParams.get("page") ?? undefined,
      perPage: url.searchParams.get("perPage") ?? undefined,
    });

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

    // 4-6: cache/ETag/DTO — encapsulados em listRepos().
    const result = await listRepos({ page: parsed.data.page, perPage: parsed.data.perPage });

    return NextResponse.json({
      repos: result.repos,
      fromCache: result.fromCache,
      page: parsed.data.page,
      perPage: parsed.data.perPage,
    });
  } catch (err) {
    // 7: log já acontece dentro da camada GitHub (client.ts) — aqui só
    // tratamos o erro para a resposta ao client.
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }

    // 8: mensagem sanitizada — nunca stack trace, nunca corpo da
    // resposta do GitHub.
    logError("Erro inesperado em GET /api/repos", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        error: {
          code: "GITHUB_REQUEST_FAILED",
          message: "Não foi possível carregar os repositórios. Tente novamente em instantes.",
        },
      },
      { status: 502 },
    );
  }
}
