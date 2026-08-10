import "server-only";
import { NextResponse } from "next/server";
import { requireSession, requireSameOrigin, GuardError } from "@/server/guards";
import { listPinnedRepoIds } from "@/server/pinned";
import { listRepos } from "@/server/github/repos";
import { getCommitActivity } from "@/server/github/repo-detail";
import { logError } from "@/server/log";

export interface RepoActivity {
  repoId: number;
  fullName: string;
  activity: Record<string, number>; // YYYY-MM-DD -> contagem de commits
}

/**
 * Dado bruto da régua de sincronia (Fase 3, elemento assinatura). Cruza
 * repoIds fixados (src/server/pinned.ts) com a lista completa de repos
 * (já cacheada por listRepos — não dispara chamada extra ao GitHub só
 * para resolver owner/name) e busca a atividade de commits de cada um
 * em paralelo.
 */
export async function GET(req: Request) {
  try {
    await requireSession();
    requireSameOrigin(req);

    const pinnedIds = listPinnedRepoIds();
    if (pinnedIds.length === 0) {
      return NextResponse.json({ repos: [] satisfies RepoActivity[] });
    }

    const { repos } = await listRepos({ page: 1, perPage: 100 });
    const pinnedRepos = repos.filter((r) => pinnedIds.includes(r.id));

    const activities = await Promise.all(
      pinnedRepos.map(async (repo) => {
        const [owner, name] = repo.fullName.split("/");
        if (!owner || !name) return null;
        const activity = await getCommitActivity({ owner, name }, 90);
        return { repoId: repo.id, fullName: repo.fullName, activity } satisfies RepoActivity;
      }),
    );

    return NextResponse.json({
      repos: activities.filter((a): a is RepoActivity => a !== null),
    });
  } catch (err) {
    if (err instanceof GuardError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    logError("Erro inesperado em GET /api/stats/activity", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        error: {
          code: "GITHUB_REQUEST_FAILED",
          message: "Não foi possível carregar a atividade dos repositórios fixados.",
        },
      },
      { status: 502 },
    );
  }
}
