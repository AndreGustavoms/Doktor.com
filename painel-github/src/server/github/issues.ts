import "server-only";
import { getOctokit } from "./client";
import { logAction } from "../activity-log";
import { readCache, writeCache, touchCache } from "../cache";

interface RepoIdentity {
  owner: string;
  name: string;
}

export interface IssueDTO {
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  labels: string[];
  authorLogin: string | null;
  htmlUrl: string;
  createdAt: string;
  commentsCount: number;
}

function toIssueDTO(raw: unknown): IssueDTO {
  const r = raw as Record<string, unknown>;
  const user = r.user as Record<string, unknown> | null;
  const labels = Array.isArray(r.labels)
    ? r.labels.map((l) => (typeof l === "string" ? l : ((l as Record<string, unknown>).name as string)))
    : [];

  return {
    number: Number(r.number),
    title: String(r.title),
    body: (r.body as string) ?? null,
    state: r.state === "closed" ? "closed" : "open",
    labels,
    authorLogin: (user?.login as string) ?? null,
    htmlUrl: String(r.html_url),
    createdAt: String(r.created_at),
    commentsCount: Number(r.comments ?? 0),
  };
}

function listCacheKey({ owner, name }: RepoIdentity, page: number): string {
  return `repo:issues:${owner}/${name}:${page}`;
}

/**
 * Lista issues (abertas por padrão) — usado tanto na aba de Issues do
 * repositório quanto, futuramente, na inbox unificada (Fase 5). Nota:
 * a API de issues do GitHub também retorna Pull Requests nesse mesmo
 * endpoint (PRs são issues internamente) — filtramos "pull_request" in
 * raw fora deste módulo quando necessário; aqui devolvemos tudo que a
 * API retorna, mapeado.
 */
export async function listIssues(
  identity: RepoIdentity,
  page: number = 1,
  perPage: number = 30,
  state: "open" | "closed" | "all" = "open",
): Promise<{ issues: IssueDTO[]; fromCache: boolean }> {
  const key = `${listCacheKey(identity, page)}:${state}`;
  const cached = readCache<unknown[]>(key);

  if (cached?.fresh) {
    return { issues: cached.payload.map(toIssueDTO), fromCache: true };
  }

  const octokit = getOctokit();
  const headers: Record<string, string> = {};
  if (cached?.etag) headers["if-none-match"] = cached.etag;

  try {
    const response = await octokit.issues.listForRepo({
      owner: identity.owner,
      repo: identity.name,
      state,
      page,
      per_page: perPage,
      headers,
    });

    const etag = response.headers.etag ?? null;
    writeCache(key, response.data, etag, "issues");
    return { issues: response.data.map(toIssueDTO), fromCache: false };
  } catch (err) {
    if (isNotModified(err) && cached) {
      touchCache(key, "issues");
      return { issues: cached.payload.map(toIssueDTO), fromCache: true };
    }
    throw err;
  }
}

function isNotModified(err: unknown): boolean {
  return typeof err === "object" && err !== null && "status" in err && (err as { status: unknown }).status === 304;
}

export interface CreateIssueInput {
  title: string;
  body?: string;
  labels?: string[];
}

export async function createIssue(identity: RepoIdentity, input: CreateIssueInput): Promise<IssueDTO> {
  const octokit = getOctokit();
  const target = `${identity.owner}/${identity.name}`;

  try {
    const response = await octokit.issues.create({
      owner: identity.owner,
      repo: identity.name,
      title: input.title,
      body: input.body,
      labels: input.labels,
    });

    logAction({
      action: "create_issue",
      target,
      payload: { title: input.title, number: response.data.number },
      result: "success",
    });

    return toIssueDTO(response.data);
  } catch (err) {
    logAction({
      action: "create_issue",
      target,
      payload: { title: input.title },
      result: "failure",
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

export async function commentOnIssue(
  identity: RepoIdentity,
  issueNumber: number,
  body: string,
): Promise<void> {
  const octokit = getOctokit();
  const target = `${identity.owner}/${identity.name}#${issueNumber}`;

  try {
    await octokit.issues.createComment({
      owner: identity.owner,
      repo: identity.name,
      issue_number: issueNumber,
      body,
    });
    logAction({ action: "comment_issue", target, result: "success" });
  } catch (err) {
    logAction({
      action: "comment_issue",
      target,
      result: "failure",
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

/**
 * Fechar/reabrir não passa por requireDestructiveAllowed() — é
 * facilmente reversível (reabrir de novo) e é uma ação de gestão normal
 * de issue, diferente do que o prompt original classifica como
 * destrutivo (branch/push/arquivar/release — ver §4.13).
 */
export async function setIssueState(
  identity: RepoIdentity,
  issueNumber: number,
  state: "open" | "closed",
): Promise<void> {
  const octokit = getOctokit();
  const target = `${identity.owner}/${identity.name}#${issueNumber}`;

  try {
    await octokit.issues.update({
      owner: identity.owner,
      repo: identity.name,
      issue_number: issueNumber,
      state,
    });
    logAction({ action: "set_issue_state", target, payload: { state }, result: "success" });
  } catch (err) {
    logAction({
      action: "set_issue_state",
      target,
      payload: { state },
      result: "failure",
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

export async function setIssueLabels(
  identity: RepoIdentity,
  issueNumber: number,
  labels: string[],
): Promise<void> {
  const octokit = getOctokit();
  const target = `${identity.owner}/${identity.name}#${issueNumber}`;

  try {
    await octokit.issues.setLabels({
      owner: identity.owner,
      repo: identity.name,
      issue_number: issueNumber,
      labels,
    });
    logAction({ action: "set_issue_labels", target, payload: { labels }, result: "success" });
  } catch (err) {
    logAction({
      action: "set_issue_labels",
      target,
      payload: { labels },
      result: "failure",
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
