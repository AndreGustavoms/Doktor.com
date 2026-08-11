import "server-only";
import { NextResponse } from "next/server";
import { requireSession, requireSameOrigin, GuardError } from "@/server/guards";
import { UpdateNoteSchema } from "@/server/schemas/notes";
import { updateNote, deleteNote } from "@/server/notes";
import { logError } from "@/server/log";
import { z } from "zod";

const IdParamSchema = z.object({ id: z.coerce.number().int().positive() });

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    requireSameOrigin(req);

    const params = await context.params;
    const parsedParams = IdParamSchema.safeParse(params);
    if (!parsedParams.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "ID de nota inválido." } },
        { status: 400 },
      );
    }

    const body = await req.json();
    const parsedBody = UpdateNoteSchema.safeParse(body);
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

    const note = updateNote(parsedParams.data.id, parsedBody.data);
    if (!note) {
      return NextResponse.json(
        { error: { code: "NOTE_NOT_FOUND", message: "Nota não encontrada." } },
        { status: 404 },
      );
    }

    return NextResponse.json({ note });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    logError("Erro inesperado em PATCH /api/notes/[id]", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Erro ao atualizar nota." } },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    requireSameOrigin(req);

    const params = await context.params;
    const parsed = IdParamSchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "ID de nota inválido." } },
        { status: 400 },
      );
    }

    deleteNote(parsed.data.id);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    logError("Erro inesperado em DELETE /api/notes/[id]", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Erro ao apagar nota." } },
      { status: 500 },
    );
  }
}
