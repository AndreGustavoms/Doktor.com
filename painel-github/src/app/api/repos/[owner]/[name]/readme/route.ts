import "server-only";
import { NextResponse } from "next/server";
import { requireSession, requireSameOrigin, GuardError } from "@/server/guards";
import { RepoParamsSchema } from "@/server/schemas/github";
import { getReadme } from "@/server/github/repo-detail";
import { renderMarkdown } from "@/server/markdown";
import { logError } from "@/server/log";

/*
 * A5 — o endpoint devolve HTML já sanitizado, nunca o markdown cru. Isso
 * é defesa em profundidade: mesmo que um bug futuro no client tentasse
 * renderizar a resposta sem passar por MarkdownView, não haveria
 * markdown/HTML não sanitizado circulando pela rede — só o resultado já
 * processado por renderMarkdown().
 */
export async function GET(req: Request, context: { params: Promise<{ owner: string; name: string }> }) {
  try {
    await requireSession();
    requireSameOrigin(req);

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

    const { markdown, fromCache } = await getReadme({ owner: parsed.data.owner, name: parsed.data.name });

    if (markdown === null) {
      return NextResponse.json({ html: null, fromCache });
    }

    const { html } = await renderMarkdown(markdown);
    return NextResponse.json({ html, fromCache });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }

    logError("Erro inesperado em GET /api/repos/[owner]/[name]/readme", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        error: {
          code: "GITHUB_REQUEST_FAILED",
          message: "Não foi possível carregar o README. Tente novamente em instantes.",
        },
      },
      { status: 502 },
    );
  }
}
