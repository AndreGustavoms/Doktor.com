import "server-only";
import { NextResponse } from "next/server";
import { requireSession, requireSameOrigin, GuardError } from "@/server/guards";
import {
  AddPortfolioItemSchema,
  UpdatePortfolioItemSchema,
  ReorderPortfolioItemsSchema,
} from "@/server/schemas/portfolio";
import {
  addPortfolioItem,
  removePortfolioItem,
  updatePortfolioItem,
  reorderPortfolioItems,
} from "@/server/portfolio";
import { logError } from "@/server/log";

export async function POST(req: Request) {
  try {
    await requireSession();
    requireSameOrigin(req);

    const body = await req.json();
    const parsed = AddPortfolioItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Entrada inválida." } },
        { status: 400 },
      );
    }

    addPortfolioItem(parsed.data.repoId);
    return NextResponse.json({ added: true });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    logError("Erro inesperado em POST /api/portfolio/items", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Erro ao adicionar item ao portfólio." } },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    await requireSession();
    requireSameOrigin(req);

    const body = await req.json();
    const parsed = UpdatePortfolioItemSchema.safeParse(body);
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

    updatePortfolioItem(parsed.data);
    return NextResponse.json({ updated: true });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    logError("Erro inesperado em PATCH /api/portfolio/items", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Erro ao atualizar item do portfólio." } },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    await requireSession();
    requireSameOrigin(req);

    const body = await req.json();
    const parsed = ReorderPortfolioItemsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Entrada inválida." } },
        { status: 400 },
      );
    }

    reorderPortfolioItems(parsed.data.repoIds);
    return NextResponse.json({ reordered: true });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    logError("Erro inesperado em PUT /api/portfolio/items", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Erro ao reordenar itens do portfólio." } },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    await requireSession();
    requireSameOrigin(req);

    const body = await req.json();
    const parsed = AddPortfolioItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Entrada inválida." } },
        { status: 400 },
      );
    }

    removePortfolioItem(parsed.data.repoId);
    return NextResponse.json({ removed: true });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    logError("Erro inesperado em DELETE /api/portfolio/items", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Erro ao remover item do portfólio." } },
      { status: 500 },
    );
  }
}
