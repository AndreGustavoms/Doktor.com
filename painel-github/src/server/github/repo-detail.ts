import "server-only";
import { getOctokit } from "./client";
import { toRepoDTO, type RepoDTO } from "./dto";
import { readCache, writeCache, touchCache } from "../cache";
import { logInfo } from "../log";

interface RepoIdentity {
  owner: string;
  name: string;
}

function isNotModified(err: unknown): boolean {
  return typeof err === "object" && err !== null && "status" in err && (err as { status: unknown }).status === 304;
}

function detailCacheKey({ owner, name }: RepoIdentity): string {
  return `repo:detail:${owner}/${name}`;
}

/**
 * Detalhe de um repositório específico — mesmo fluxo de cache/ETag de
 * listRepos() (Fase 2), TTL mais curto (repoDetail: 2min) porque é uma
 * página que o usuário revisita com mais frequência que a lista geral.
 */
export async function getRepo(identity: RepoIdentity): Promise<{ repo: RepoDTO; fromCache: boolean }> {
  const key = detailCacheKey(identity);
  const cached = readCache<unknown>(key);

  if (cached?.fresh) {
    return { repo: toRepoDTO(cached.payload), fromCache: true };
  }

  const octokit = getOctokit();
  const headers: Record<string, string> = {};
  if (cached?.etag) headers["if-none-match"] = cached.etag;

  try {
    const response = await octokit.repos.get({ owner: identity.owner, repo: identity.name, headers });
    const etag = response.headers.etag ?? null;
    writeCache(key, response.data, etag, "repoDetail");
    return { repo: toRepoDTO(response.data), fromCache: false };
  } catch (err) {
    if (isNotModified(err) && cached) {
      touchCache(key, "repoDetail");
      return { repo: toRepoDTO(cached.payload), fromCache: true };
    }
    throw err;
  }
}

export interface ReadmeResult {
  markdown: string | null; // null = repositório não tem README
  fromCache: boolean;
}

function readmeCacheKey({ owner, name }: RepoIdentity): string {
  return `repo:readme:${owner}/${name}`;
}

/**
 * README decodificado de base64 para texto — o Octokit retorna o
 * conteúdo bruto do endpoint /readme já em base64 (ver
 * response.data.content). 404 (sem README) não é um erro de verdade
 * aqui, é um estado válido — devolvido como markdown: null, não lançado.
 */
export async function getReadme(identity: RepoIdentity): Promise<ReadmeResult> {
  const key = readmeCacheKey(identity);
  const cached = readCache<string | null>(key);

  if (cached?.fresh) {
    return { markdown: cached.payload, fromCache: true };
  }

  const octokit = getOctokit();
  const headers: Record<string, string> = {};
  if (cached?.etag) headers["if-none-match"] = cached.etag;

  try {
    const response = await octokit.repos.getReadme({
      owner: identity.owner,
      repo: identity.name,
      headers,
    });

    const markdown = Buffer.from(response.data.content, "base64").toString("utf-8");
    const etag = response.headers.etag ?? null;
    writeCache(key, markdown, etag, "readme");
    return { markdown, fromCache: false };
  } catch (err) {
    if (isNotModified(err) && cached) {
      touchCache(key, "readme");
      return { markdown: cached.payload, fromCache: true };
    }

    const status =
      typeof err === "object" && err !== null && "status" in err
        ? Number((err as { status: unknown }).status)
        : undefined;

    if (status === 404) {
      logInfo("github_readme_not_found", { owner: identity.owner, name: identity.name });
      writeCache(key, null, null, "readme");
      return { markdown: null, fromCache: false };
    }

    throw err;
  }
}

export interface CommitDTO {
  sha: string;
  message: string;
  authorName: string | null;
  authorDate: string | null;
  htmlUrl: string;
}

function toCommitDTO(raw: unknown): CommitDTO {
  const r = raw as Record<string, unknown>;
  const commit = r.commit as Record<string, unknown> | undefined;
  const author = commit?.author as Record<string, unknown> | undefined;

  return {
    sha: String(r.sha),
    message: String(commit?.message ?? ""),
    authorName: (author?.name as string) ?? null,
    authorDate: (author?.date as string) ?? null,
    htmlUrl: String(r.html_url),
  };
}

function commitsCacheKey({ owner, name }: RepoIdentity, page: number): string {
  return `repo:commits:${owner}/${name}:${page}`;
}

/**
 * Últimos commits — usado tanto na visão geral (últimos 5, Fase 3.5)
 * quanto na aba dedicada de commits com paginação (Fase 5+). TTL mais
 * curto (issues: 1min, reaproveitado aqui) porque commits mudam com
 * mais frequência que metadados do repositório.
 */
export async function listCommits(
  identity: RepoIdentity,
  page: number = 1,
  perPage: number = 5,
): Promise<{ commits: CommitDTO[]; fromCache: boolean }> {
  const key = commitsCacheKey(identity, page);
  const cached = readCache<unknown[]>(key);

  if (cached?.fresh) {
    return { commits: cached.payload.map(toCommitDTO), fromCache: true };
  }

  const octokit = getOctokit();
  const headers: Record<string, string> = {};
  if (cached?.etag) headers["if-none-match"] = cached.etag;

  try {
    const response = await octokit.repos.listCommits({
      owner: identity.owner,
      repo: identity.name,
      page,
      per_page: perPage,
      headers,
    });

    const etag = response.headers.etag ?? null;
    writeCache(key, response.data, etag, "issues");
    return { commits: response.data.map(toCommitDTO), fromCache: false };
  } catch (err) {
    if (isNotModified(err) && cached) {
      touchCache(key, "issues");
      return { commits: cached.payload.map(toCommitDTO), fromCache: true };
    }
    throw err;
  }
}

/**
 * Agrega commits por dia (YYYY-MM-DD → contagem) nos últimos `days`
 * dias — dado bruto da régua de sincronia (Fase 3, elemento assinatura,
 * ver prompt original §8). Usa paginação via since= em vez de puxar
 * páginas indefinidamente: o GitHub filtra no servidor deles, então uma
 * única chamada (com paginação se o repo tiver muita atividade) já
 * chega filtrada, ao contrário de listCommits() que sempre busca do
 * commit mais recente sem filtro de data.
 */
export async function getCommitActivity(
  identity: RepoIdentity,
  days: number = 90,
): Promise<Record<string, number>> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const key = `repo:activity:${identity.owner}/${identity.name}:${days}`;
  const cached = readCache<Record<string, number>>(key);

  if (cached?.fresh) return cached.payload;

  const octokit = getOctokit();
  const headers: Record<string, string> = {};
  if (cached?.etag) headers["if-none-match"] = cached.etag;

  try {
    /*
     * per_page máximo (100) — repos ativos podem ter centenas de commits
     * em 90 dias, mas paginar indefinidamente para um widget de
     * dashboard não vale o orçamento de API. 3 páginas (300 commits) é
     * um teto razoável para "mostrar intensidade de atividade".
     * If-None-Match só se aplica à primeira página — cada página é uma
     * URL diferente com seu próprio ETag, então não há um único ETag
     * válido para o conjunto paginado inteiro; revalidar só a primeira
     * página é a aproximação prática (se ela não mudou, as seguintes
     * quase sempre também não mudaram).
     */
    const commits: unknown[] = [];
    for (let page = 1; page <= 3; page++) {
      const response = await octokit.repos.listCommits({
        owner: identity.owner,
        repo: identity.name,
        since,
        per_page: 100,
        page,
        headers: page === 1 ? headers : {},
      });
      commits.push(...response.data);
      if (response.data.length < 100) break; // última página
    }

    const activity: Record<string, number> = {};
    for (const raw of commits) {
      const dto = toCommitDTO(raw);
      if (!dto.authorDate) continue;
      const day = dto.authorDate.slice(0, 10); // YYYY-MM-DD
      activity[day] = (activity[day] ?? 0) + 1;
    }

    writeCache(key, activity, null, "repoDetail");
    return activity;
  } catch (err) {
    if (isNotModified(err) && cached) {
      touchCache(key, "repoDetail");
      return cached.payload;
    }
    throw err;
  }
}
