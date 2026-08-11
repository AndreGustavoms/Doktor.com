import "server-only";
import { getOctokit } from "./client";
import { logAction } from "../activity-log";
import { readCache, writeCache, touchCache } from "../cache";

interface RepoIdentity {
  owner: string;
  name: string;
}

export interface ReleaseDTO {
  id: number;
  tagName: string;
  name: string | null;
  body: string | null;
  isDraft: boolean;
  isPrerelease: boolean;
  htmlUrl: string;
  publishedAt: string | null;
}

function toReleaseDTO(raw: unknown): ReleaseDTO {
  const r = raw as Record<string, unknown>;
  return {
    id: Number(r.id),
    tagName: String(r.tag_name),
    name: (r.name as string) ?? null,
    body: (r.body as string) ?? null,
    isDraft: Boolean(r.draft),
    isPrerelease: Boolean(r.prerelease),
    htmlUrl: String(r.html_url),
    publishedAt: (r.published_at as string) ?? null,
  };
}

function listCacheKey({ owner, name }: RepoIdentity): string {
  return `repo:releases:${owner}/${name}`;
}

export async function listReleases(
  identity: RepoIdentity,
): Promise<{ releases: ReleaseDTO[]; fromCache: boolean }> {
  const key = listCacheKey(identity);
  const cached = readCache<unknown[]>(key);

  if (cached?.fresh) {
    return { releases: cached.payload.map(toReleaseDTO), fromCache: true };
  }

  const octokit = getOctokit();
  const headers: Record<string, string> = {};
  if (cached?.etag) headers["if-none-match"] = cached.etag;

  try {
    const response = await octokit.repos.listReleases({
      owner: identity.owner,
      repo: identity.name,
      per_page: 10,
      headers,
    });

    const etag = response.headers.etag ?? null;
    writeCache(key, response.data, etag, "repoDetail");
    return { releases: response.data.map(toReleaseDTO), fromCache: false };
  } catch (err) {
    if (isNotModified(err) && cached) {
      touchCache(key, "repoDetail");
      return { releases: cached.payload.map(toReleaseDTO), fromCache: true };
    }
    throw err;
  }
}

function isNotModified(err: unknown): boolean {
  return typeof err === "object" && err !== null && "status" in err && (err as { status: unknown }).status === 304;
}

export interface CreateReleaseInput {
  tagName: string;
  name?: string;
  body?: string;
  isPrerelease?: boolean;
  targetCommitish?: string;
}

/**
 * Criar release não é destrutiva — é uma publicação, reversível (dá
 * pra apagar a release, que este painel não implementa por decisão
 * deliberada — ver prompt original §4.13: "Não implemente exclusão de
 * repositório", e por extensão de espírito, releases também não têm
 * exclusão implementada aqui).
 */
export async function createRelease(
  identity: RepoIdentity,
  input: CreateReleaseInput,
): Promise<ReleaseDTO> {
  const octokit = getOctokit();
  const target = `${identity.owner}/${identity.name}`;

  try {
    const response = await octokit.repos.createRelease({
      owner: identity.owner,
      repo: identity.name,
      tag_name: input.tagName,
      name: input.name,
      body: input.body,
      prerelease: input.isPrerelease ?? false,
      target_commitish: input.targetCommitish,
    });

    logAction({
      action: "create_release",
      target,
      payload: { tagName: input.tagName, prerelease: input.isPrerelease ?? false },
      result: "success",
    });

    return toReleaseDTO(response.data);
  } catch (err) {
    logAction({
      action: "create_release",
      target,
      payload: { tagName: input.tagName },
      result: "failure",
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
