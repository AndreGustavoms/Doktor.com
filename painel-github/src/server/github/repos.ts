import "server-only";
import { getOctokit } from "./client";
import { toRepoDTO, type RepoDTO } from "./dto";
import { readCache, writeCache, touchCache } from "../cache";
import { logInfo } from "../log";

export interface ListReposParams {
  page: number;
  perPage: number;
}

export interface ListReposResult {
  repos: RepoDTO[];
  fromCache: boolean;
}

function cacheKey(params: ListReposParams): string {
  return `repos:list:${params.page}:${params.perPage}`;
}

/**
 * Lista os repositórios do usuário autenticado. Fluxo: cache dentro do
 * TTL → devolve sem chamar o GitHub; cache vencido → revalida com
 * If-None-Match (304 não conta contra o rate limit — ver prompt
 * original, notas sobre ETag); sem cache → busca do zero. Ver
 * docs/API.md para a forma geral de todo Route Handler.
 */
export async function listRepos(params: ListReposParams): Promise<ListReposResult> {
  const key = cacheKey(params);
  const cached = readCache<unknown[]>(key);

  if (cached?.fresh) {
    return { repos: cached.payload.map(toRepoDTO), fromCache: true };
  }

  const octokit = getOctokit();
  const headers: Record<string, string> = {};
  if (cached?.etag) {
    headers["if-none-match"] = cached.etag;
  }

  try {
    const response = await octokit.repos.listForAuthenticatedUser({
      page: params.page,
      per_page: params.perPage,
      sort: "updated",
      headers,
    });

    const etag = response.headers.etag ?? null;
    writeCache(key, response.data, etag, "repoList");

    return { repos: response.data.map(toRepoDTO), fromCache: false };
  } catch (err) {
    // Octokit lança para 304 (não é um "sucesso" HTTP na visão do
    // cliente) — isso é o caminho feliz do cache aqui, não um erro.
    if (isNotModified(err) && cached) {
      touchCache(key, "repoList");
      logInfo("github_cache_revalidated", { key });
      return { repos: cached.payload.map(toRepoDTO), fromCache: true };
    }
    throw err;
  }
}

function isNotModified(err: unknown): boolean {
  return typeof err === "object" && err !== null && "status" in err && (err as { status: unknown }).status === 304;
}
