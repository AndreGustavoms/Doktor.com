import "server-only";
import { NextResponse } from "next/server";
import { requireSession, requireSameOrigin, GuardError } from "@/server/guards";
import { RepoParamsSchema } from "@/server/schemas/github";
import { CreateReleaseSchema } from "@/server/schemas/releases";
import { listReleases, createRelease } from "@/server/github/releases";
import { logError } from "@/server/log";

export async function GET(req: Request, context: { params: Promise<{ owner: string; name: string }> }) {
  try {
    await requireSession();
    requireSameOrigin(req);

    const params = await context.params;
    const parsed = RepoParamsSchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Parâmetros inválidos." } },
        { status: 400 },
      );
    }

    const result = await listReleases({ owner: parsed.data.owner, name: parsed.data.name });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    logError("Erro inesperado em GET /api/repos/[owner]/[name]/releases", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        error: {
          code: "GITHUB_REQUEST_FAILED",
          message: "Não foi possível carregar as releases. Tente novamente em instantes.",
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
    const parsedBody = CreateReleaseSchema.safeParse(body);
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

    const release = await createRelease(
      { owner: parsedParams.data.owner, name: parsedParams.data.name },
      parsedBody.data,
    );

    return NextResponse.json({ release });
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

    if (status === 422) {
      return NextResponse.json(
        {
          error: {
            code: "TAG_ALREADY_EXISTS",
            message: "Já existe uma release com essa tag.",
          },
        },
        { status: 422 },
      );
    }

    logError("Erro inesperado em POST /api/repos/[owner]/[name]/releases", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        error: {
          code: "GITHUB_REQUEST_FAILED",
          message: "Não foi possível criar a release. Tente novamente em instantes.",
        },
      },
      { status: 502 },
    );
  }
}
