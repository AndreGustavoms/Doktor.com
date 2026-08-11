import "server-only";
import { NextResponse } from "next/server";
import { requireSession, requireSameOrigin, GuardError } from "@/server/guards";
import { RepoParamsSchema } from "@/server/schemas/github";
import { UpdateRepoSettingsSchema } from "@/server/schemas/repo-settings";
import { updateRepoSettings } from "@/server/github/repo-settings";
import { logError } from "@/server/log";

export async function PATCH(req: Request, context: { params: Promise<{ owner: string; name: string }> }) {
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
    const parsedBody = UpdateRepoSettingsSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsedBody.error.issues[0]?.message ?? "Entrada inválida.",
            field: parsedBody.error.issues[0]?.path.join("."),
          },
        },
        { status: 400 },
      );
    }

    await updateRepoSettings(
      { owner: parsedParams.data.owner, name: parsedParams.data.name },
      parsedBody.data,
    );

    return NextResponse.json({ updated: true });
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

    if (status === 403) {
      return NextResponse.json(
        {
          error: {
            code: "GITHUB_FORBIDDEN",
            message:
              "O token não tem permissão de escrita em Administration neste repositório. Atualize as permissões nos ajustes do token.",
          },
        },
        { status: 403 },
      );
    }

    logError("Erro inesperado em PATCH /api/repos/[owner]/[name]/settings", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        error: {
          code: "GITHUB_REQUEST_FAILED",
          message: "Não foi possível salvar os ajustes. Tente novamente em instantes.",
        },
      },
      { status: 502 },
    );
  }
}
