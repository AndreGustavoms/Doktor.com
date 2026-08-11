import "server-only";
import { NextResponse } from "next/server";
import { requireSession, requireSameOrigin, GuardError } from "@/server/guards";
import { CreateNoteSchema } from "@/server/schemas/notes";
import { listNotes, createNote } from "@/server/notes";
import { logError } from "@/server/log";

export async function GET(req: Request) {
  try {
    await requireSession();

    const url = new URL(req.url);
    const repoIdParam = url.searchParams.get("repoId");
    const repoId = repoIdParam === null ? undefined : repoIdParam === "null" ? null : Number(repoIdParam);

    return NextResponse.json({ notes: listNotes(repoId) });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    logError("Erro inesperado em GET /api/notes", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Erro ao carregar notas." } },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireSession();
    requireSameOrigin(req);

    const body = await req.json();
    const parsed = CreateNoteSchema.safeParse(body);
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

    const note = createNote(parsed.data);
    return NextResponse.json({ note });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    logError("Erro inesperado em POST /api/notes", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Erro ao criar nota." } },
      { status: 500 },
    );
  }
}
