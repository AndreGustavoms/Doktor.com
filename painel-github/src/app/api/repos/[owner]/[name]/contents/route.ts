import "server-only";
import { NextResponse } from "next/server";
import { requireSession, requireSameOrigin, GuardError } from "@/server/guards";
import { RepoParamsSchema } from "@/server/schemas/github";
import { FilePathQuerySchema, CommitFileBodySchema } from "@/server/schemas/contents";
import { getFileContent, commitFile } from "@/server/github/contents";
import { logError } from "@/server/log";

/*
 * Não é ação destrutiva (não passa por requireDestructiveAllowed) —
 * commitar um arquivo é reversível via histórico do Git no próprio
 * GitHub. A defesa aqui é o diff obrigatório antes de confirmar (UI) e
 * a mensagem de commit obrigatória (schema) — ver prompt original
 * §4.13, último item: "Antes de sobrescrever arquivo via API, mostre
 * um diff e exija confirmação."
 */

export async function GET(req: Request, context: { params: Promise<{ owner: string; name: string }> }) {
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

    const url = new URL(req.url);
    const parsedQuery = FilePathQuerySchema.safeParse({
      path: url.searchParams.get("path") ?? undefined,
      branch: url.searchParams.get("branch") ?? undefined,
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

    const file = await getFileContent(
      { owner: parsedParams.data.owner, name: parsedParams.data.name },
      parsedQuery.data.path,
      parsedQuery.data.branch,
    );

    if (file === null) {
      return NextResponse.json({ file: null });
    }

    return NextResponse.json({ file });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    logError("Erro inesperado em GET /api/repos/[owner]/[name]/contents", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        error: {
          code: "GITHUB_REQUEST_FAILED",
          message: "Não foi possível carregar o arquivo. Tente novamente em instantes.",
        },
      },
      { status: 502 },
    );
  }
}

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
    const parsedBody = CommitFileBodySchema.safeParse(body);
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

    const result = await commitFile(
      { owner: parsedParams.data.owner, name: parsedParams.data.name },
      parsedBody.data,
    );

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

    if (status === 409) {
      return NextResponse.json(
        {
          error: {
            code: "SHA_CONFLICT",
            message:
              "O arquivo foi modificado por outra pessoa desde que você o abriu. Recarregue e tente de novo.",
          },
        },
        { status: 409 },
      );
    }

    if (status === 403) {
      return NextResponse.json(
        {
          error: {
            code: "GITHUB_FORBIDDEN",
            message:
              "O token não tem permissão de escrita em Contents neste repositório. Atualize as permissões nos ajustes do token.",
          },
        },
        { status: 403 },
      );
    }

    logError("Erro inesperado em PUT /api/repos/[owner]/[name]/contents", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        error: {
          code: "GITHUB_REQUEST_FAILED",
          message: "Não foi possível commitar o arquivo. Tente novamente em instantes.",
        },
      },
      { status: 502 },
    );
  }
}
