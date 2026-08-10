import "server-only";
import { NextResponse } from "next/server";
import { requireSameOrigin } from "@/server/guards";
import { SetupSchema } from "@/server/schemas/auth";
import { hasMasterPassword, createMasterPassword } from "@/server/auth/password";
import { createSession, SESSION_COOKIE_NAME } from "@/server/auth/session";
import { writeVault, vaultExists } from "@/server/vault/store";
import { setUnlockedToken } from "@/server/vault/session-state";
import { registerSecretForRedaction } from "@/server/log";
import { logInfo, logError } from "@/server/log";

export async function POST(req: Request) {
  try {
    requireSameOrigin(req);

    // Setup só roda uma vez — se já existe senha mestra ou vault, o
    // fluxo correto é /unlock, não /setup de novo. Isto evita que
    // alguém sobrescreva o vault existente por engano ou má-fé (A9).
    if ((await hasMasterPassword()) || vaultExists()) {
      return NextResponse.json(
        {
          error: {
            code: "ALREADY_SETUP",
            message: "O painel já foi configurado. Use /unlock para destravar.",
          },
        },
        { status: 409 },
      );
    }

    const body = await req.json();
    const parsed = SetupSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: firstIssue?.message ?? "Entrada inválida.",
            field: firstIssue?.path.join("."),
          },
        },
        { status: 400 },
      );
    }

    const { password, githubToken } = parsed.data;

    // Valida o token chamando GET /user antes de gravar qualquer coisa —
    // não faz sentido persistir um token que nem autentica. Ver prompt
    // original §7.1, passo 2. A camada GitHub completa (Octokit,
    // throttling, DTOs) chega na Fase 2 — aqui usamos fetch diretamente
    // porque é uma única chamada de validação, não vale antecipar toda
    // a fábrica do Octokit por isso.
    const githubResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "User-Agent": "painel-github-setup",
        Accept: "application/vnd.github+json",
      },
    });

    if (!githubResponse.ok) {
      logError("Falha ao validar token do GitHub no setup", { status: githubResponse.status });
      return NextResponse.json(
        {
          error: {
            code: "GITHUB_TOKEN_INVALID",
            message:
              "O token não autenticou com o GitHub. Verifique se ele foi colado corretamente e não expirou.",
            field: "githubToken",
          },
        },
        { status: 400 },
      );
    }

    const githubUser = await githubResponse.json();

    await createMasterPassword(password);
    await writeVault(githubToken, password);

    setUnlockedToken(githubToken);
    registerSecretForRedaction(githubToken);

    const session = await createSession();

    logInfo("Setup concluído", { githubLogin: githubUser.login });

    const response = NextResponse.json({
      login: githubUser.login as string,
      avatarUrl: githubUser.avatar_url as string,
    });

    response.cookies.set(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      secure: req.url.startsWith("https://"),
      expires: session.expiresAt,
    });

    return response;
  } catch (err) {
    logError("Erro inesperado no setup", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Erro interno ao configurar o painel." } },
      { status: 500 },
    );
  }
}
