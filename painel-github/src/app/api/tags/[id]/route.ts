import "server-only";
import { NextResponse } from "next/server";
import { requireSession, requireSameOrigin, GuardError } from "@/server/guards";
import { deleteTag } from "@/server/tags";
import { logError } from "@/server/log";
import { z } from "zod";

const IdParamSchema = z.object({ id: z.coerce.number().int().positive() });

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    requireSameOrigin(req);

    const params = await context.params;
    const parsed = IdParamSchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "ID de tag inválido." } },
        { status: 400 },
      );
    }

    deleteTag(parsed.data.id);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    logError("Erro inesperado em DELETE /api/tags/[id]", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Erro ao apagar tag." } },
      { status: 500 },
    );
  }
}
