import "server-only";
import { NextResponse } from "next/server";
import { requireSession, requireSameOrigin, GuardError } from "@/server/guards";
import { CreateTagSchema } from "@/server/schemas/tags";
import { listTags, createTag } from "@/server/tags";
import { logError } from "@/server/log";

export async function GET() {
  try {
    await requireSession();
    return NextResponse.json({ tags: listTags() });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    logError("Erro inesperado em GET /api/tags", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Erro ao carregar tags." } },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireSession();
    requireSameOrigin(req);

    const body = await req.json();
    const parsed = CreateTagSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message ?? "Entrada inválida.",
          },
        },
        { status: 400 },
      );
    }

    const tag = createTag(parsed.data.name, parsed.data.color);
    return NextResponse.json({ tag });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }

    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("UNIQUE constraint failed")) {
      return NextResponse.json(
        { error: { code: "TAG_ALREADY_EXISTS", message: "Já existe uma tag com esse nome." } },
        { status: 409 },
      );
    }

    logError("Erro inesperado em POST /api/tags", { error: message });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Erro ao criar tag." } },
      { status: 500 },
    );
  }
}
