import "server-only";
import { NextResponse } from "next/server";
import { requireSession, requireSameOrigin, GuardError } from "@/server/guards";
import { TagRepoAssociationSchema } from "@/server/schemas/tags";
import { listAllRepoTagAssociations, addTagToRepo, removeTagFromRepo } from "@/server/tags";
import { logError } from "@/server/log";

export async function GET() {
  try {
    await requireSession();
    return NextResponse.json({ associations: listAllRepoTagAssociations() });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    logError("Erro inesperado em GET /api/repo-tags", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Erro ao carregar associações." } },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireSession();
    requireSameOrigin(req);

    const body = await req.json();
    const parsed = TagRepoAssociationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Entrada inválida." } },
        { status: 400 },
      );
    }

    addTagToRepo(parsed.data.repoId, parsed.data.tagId);
    return NextResponse.json({ added: true });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    logError("Erro inesperado em POST /api/repo-tags", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Erro ao associar tag." } },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    await requireSession();
    requireSameOrigin(req);

    const body = await req.json();
    const parsed = TagRepoAssociationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Entrada inválida." } },
        { status: 400 },
      );
    }

    removeTagFromRepo(parsed.data.repoId, parsed.data.tagId);
    return NextResponse.json({ removed: true });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    logError("Erro inesperado em DELETE /api/repo-tags", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Erro ao remover associação." } },
      { status: 500 },
    );
  }
}
