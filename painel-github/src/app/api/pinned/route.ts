import "server-only";
import { NextResponse } from "next/server";
import { requireSession, requireSameOrigin, GuardError } from "@/server/guards";
import { PinnedBodySchema } from "@/server/schemas/pinned";
import { listPinnedRepoIds, pinRepo, unpinRepo } from "@/server/pinned";
import { logError } from "@/server/log";

export async function GET() {
  try {
    await requireSession();
    return NextResponse.json({ repoIds: listPinnedRepoIds() });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    logError("Erro inesperado em GET /api/pinned", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Erro ao carregar repositórios fixados." } },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireSession();
    requireSameOrigin(req);

    const body = await req.json();
    const parsed = PinnedBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "ID de repositório inválido." } },
        { status: 400 },
      );
    }

    pinRepo(parsed.data.repoId);
    return NextResponse.json({ pinned: true });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    logError("Erro inesperado em POST /api/pinned", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Erro ao fixar repositório." } },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    await requireSession();
    requireSameOrigin(req);

    const body = await req.json();
    const parsed = PinnedBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "ID de repositório inválido." } },
        { status: 400 },
      );
    }

    unpinRepo(parsed.data.repoId);
    return NextResponse.json({ pinned: false });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    logError("Erro inesperado em DELETE /api/pinned", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Erro ao desfixar repositório." } },
      { status: 500 },
    );
  }
}
