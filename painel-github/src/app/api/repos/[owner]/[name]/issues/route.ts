import "server-only";
import { NextResponse } from "next/server";
import { requireSession, requireSameOrigin, GuardError } from "@/server/guards";
import { RepoParamsSchema } from "@/server/schemas/github";
import { IssueListQuerySchema, CreateIssueSchema } from "@/server/schemas/issues";
import { listIssues, createIssue } from "@/server/github/issues";
import { logError } from "@/server/log";

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
    const parsedQuery = IssueListQuerySchema.safeParse({
      page: url.searchParams.get("page") ?? undefined,
      perPage: url.searchParams.get("perPage") ?? undefined,
      state: url.searchParams.get("state") ?? undefined,
    });
    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Parâmetros inválidos." } },
        { status: 400 },
      );
    }

    const result = await listIssues(
      { owner: parsedParams.data.owner, name: parsedParams.data.name },
      parsedQuery.data.page,
      parsedQuery.data.perPage,
      parsedQuery.data.state,
    );

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    logError("Erro inesperado em GET /api/repos/[owner]/[name]/issues", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        error: {
          code: "GITHUB_REQUEST_FAILED",
          message: "Não foi possível carregar as issues. Tente novamente em instantes.",
        },
      },
      { status: 502 },
    );
  }
}

export async function POST(req: Request, context: { params: Promise<{ owner: string; name: string }> }) {
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
    const parsedBody = CreateIssueSchema.safeParse(body);
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

    const issue = await createIssue(
      { owner: parsedParams.data.owner, name: parsedParams.data.name },
      parsedBody.data,
    );

    return NextResponse.json({ issue });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    logError("Erro inesperado em POST /api/repos/[owner]/[name]/issues", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        error: {
          code: "GITHUB_REQUEST_FAILED",
          message: "Não foi possível criar a issue. Tente novamente em instantes.",
        },
      },
      { status: 502 },
    );
  }
}
