import "server-only";
import { NextResponse } from "next/server";
import { requireSession, requireSameOrigin, GuardError } from "@/server/guards";
import { UpdatePortfolioConfigSchema } from "@/server/schemas/portfolio";
import { getPortfolioConfig, updatePortfolioConfig, listPortfolioItems } from "@/server/portfolio";
import { logError } from "@/server/log";

export async function GET() {
  try {
    await requireSession();
    return NextResponse.json({
      config: getPortfolioConfig(),
      items: listPortfolioItems(),
    });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    logError("Erro inesperado em GET /api/portfolio", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Erro ao carregar portfólio." } },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    await requireSession();
    requireSameOrigin(req);

    const body = await req.json();
    const parsed = UpdatePortfolioConfigSchema.safeParse(body);
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

    const config = updatePortfolioConfig(parsed.data);
    return NextResponse.json({ config });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    logError("Erro inesperado em PUT /api/portfolio", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Erro ao salvar configuração do portfólio." } },
      { status: 500 },
    );
  }
}
