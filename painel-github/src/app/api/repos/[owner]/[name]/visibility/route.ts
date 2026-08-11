import "server-only";
import { NextResponse } from "next/server";
import { requireSession, requireSameOrigin, GuardError } from "@/server/guards";
import { RepoParamsSchema } from "@/server/schemas/github";
import { SetVisibilitySchema } from "@/server/schemas/repo-settings";
import { setRepoVisibility } from "@/server/github/repo-settings";
import { logError } from "@/server/log";

/*
 * Ação destrutiva — ver docs/SECURITY.md, ameaça A9. requireDestructiveAllowed()
 * é chamado dentro de setRepoVisibility() (não aqui na rota) para que a
 * checagem viva junto da lógica que ela protege, não espalhada. A
 * segunda camada de confirmação (nome completo do repo digitado) é
 * validada aqui, no schema — confirmRepoName precisa bater com o
 * parâmetro da URL antes de chegar na chamada ao GitHub.
 */
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
    const parsedBody = SetVisibilitySchema.safeParse(body);
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

    const expectedFullName = `${parsedParams.data.owner}/${parsedParams.data.name}`;
    if (parsedBody.data.confirmRepoName !== expectedFullName) {
      return NextResponse.json(
        {
          error: {
            code: "CONFIRMATION_MISMATCH",
            message: `O nome digitado não confere com "${expectedFullName}".`,
          },
        },
        { status: 400 },
      );
    }

    await setRepoVisibility(
      { owner: parsedParams.data.owner, name: parsedParams.data.name },
      parsedBody.data.isPrivate,
    );

    return NextResponse.json({ updated: true });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    logError("Erro inesperado em PUT /api/repos/[owner]/[name]/visibility", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        error: {
          code: "GITHUB_REQUEST_FAILED",
          message: "Não foi possível alterar a visibilidade. Tente novamente em instantes.",
        },
      },
      { status: 502 },
    );
  }
}
