import "server-only";
import { getOctokit } from "./client";
import { logAction } from "../activity-log";
import { deleteCache } from "../cache";
import { requireDestructiveAllowed } from "../guards";

interface RepoIdentity {
  owner: string;
  name: string;
}

function detailCacheKey({ owner, name }: RepoIdentity): string {
  return `repo:detail:${owner}/${name}`;
}

export interface UpdateRepoInput {
  description?: string;
  homepage?: string;
  hasIssues?: boolean;
  hasWiki?: boolean;
  hasProjects?: boolean;
}

/**
 * Editar descrição, homepage, e alternar issues/wiki/projects — ver
 * prompt original §7.5, "Ajustes". Não passa por
 * requireDestructiveAllowed(): é reversível (edita de novo para
 * desfazer) e de baixo risco, diferente de alternar visibilidade
 * (pública/privada), que fica atrás da flag destrutiva conforme o
 * prompt pede explicitamente.
 */
export async function updateRepoSettings(identity: RepoIdentity, input: UpdateRepoInput): Promise<void> {
  const octokit = getOctokit();
  const target = `${identity.owner}/${identity.name}`;

  try {
    await octokit.repos.update({
      owner: identity.owner,
      repo: identity.name,
      description: input.description,
      homepage: input.homepage,
      has_issues: input.hasIssues,
      has_wiki: input.hasWiki,
      has_projects: input.hasProjects,
    });

    logAction({ action: "update_repo_settings", target, payload: input, result: "success" });
    // Sem isto, a UI mostraria a descrição antiga por até 2min (TTL de
    // repoDetail) depois de uma edição confirmada — ver src/server/cache.ts.
    deleteCache(detailCacheKey(identity));
  } catch (err) {
    logAction({
      action: "update_repo_settings",
      target,
      payload: input,
      result: "failure",
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

/**
 * Substitui a lista completa de topics — o GitHub não tem "adicionar
 * um topic", só "definir a lista inteira" (PUT, não PATCH). Ver prompt
 * original §7.5.
 */
export async function updateRepoTopics(identity: RepoIdentity, topics: string[]): Promise<void> {
  const octokit = getOctokit();
  const target = `${identity.owner}/${identity.name}`;

  try {
    await octokit.repos.replaceAllTopics({
      owner: identity.owner,
      repo: identity.name,
      names: topics,
    });

    logAction({ action: "update_repo_topics", target, payload: { topics }, result: "success" });
    deleteCache(detailCacheKey(identity));
  } catch (err) {
    logAction({
      action: "update_repo_topics",
      target,
      payload: { topics },
      result: "failure",
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

/**
 * Alternar visibilidade (público/privado) fica atrás da flag
 * destrutiva com dupla confirmação — ver prompt original §4.13/§7.5 e
 * docs/SECURITY.md, ameaça A9. Tornar um repo privado público (ou
 * vice-versa) tem consequências reais e pouco óbvias: código privado
 * exposto, ou um repo público perdendo estrelas/forks/watchers ao
 * virar privado. requireDestructiveAllowed() lança se
 * ALLOW_DESTRUCTIVE != "true" — a UI exige digitar o nome completo do
 * repo antes mesmo de chegar aqui (ConfirmDestructive.tsx), então esta
 * é a segunda camada, não a única.
 */
export async function setRepoVisibility(identity: RepoIdentity, isPrivate: boolean): Promise<void> {
  requireDestructiveAllowed();

  const octokit = getOctokit();
  const target = `${identity.owner}/${identity.name}`;

  try {
    await octokit.repos.update({
      owner: identity.owner,
      repo: identity.name,
      private: isPrivate,
    });

    logAction({ action: "set_repo_visibility", target, payload: { isPrivate }, result: "success" });
    deleteCache(detailCacheKey(identity));
  } catch (err) {
    logAction({
      action: "set_repo_visibility",
      target,
      payload: { isPrivate },
      result: "failure",
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
