import "server-only";
import { listRepos } from "./repos";
import { listIssues, type IssueDTO } from "./issues";
import { getDb } from "../db";
import { readState } from "../db/schema";
import { eq, and } from "drizzle-orm";

export interface InboxItem extends IssueDTO {
  repoFullName: string;
  isRead: boolean;
}

/**
 * Todas as issues abertas de todos os repositórios, num lugar só — ver
 * prompt original §7.6. Cruza com listRepos() (cacheada — não dispara
 * nova chamada além do já orçado pela Fase 2) e chama listIssues() por
 * repo em paralelo. Mesma limitação de paginação documentada em
 * docs/ARCHITECTURE.md (Fase 3): só a primeira página de 100 repos.
 *
 * A API de issues do GitHub também retorna Pull Requests (PRs são
 * issues internamente) — filtramos raw.pull_request fora, mas como
 * listIssues() já mapeia para IssueDTO antes de chegar aqui, não temos
 * mais o campo raw disponível. Isso é aceito como limitação: PRs
 * aparecem misturados na inbox de "issues" nesta implementação. Uma
 * inbox separada de PRs de verdade (usando octokit.pulls.list) fica
 * para refinamento futuro — ver docs/ARCHITECTURE.md.
 */
export async function getUnifiedInbox(): Promise<InboxItem[]> {
  const { repos } = await listRepos({ page: 1, perPage: 100 });

  const results = await Promise.allSettled(
    repos.map(async (repo) => {
      const [owner, name] = repo.fullName.split("/");
      if (!owner || !name) return [];
      const { issues } = await listIssues({ owner, name }, 1, 20, "open");
      return issues.map((issue) => ({ ...issue, repoFullName: repo.fullName }));
    }),
  );

  const allIssues = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  const readSet = getReadSet();

  return allIssues
    .map((issue) => ({
      ...issue,
      isRead: readSet.has(readKey("issue", issue.repoFullName, issue.number)),
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function readKey(kind: "issue" | "pr", repoFullName: string, number: number): string {
  return `${kind}:${repoFullName}:${number}`;
}

function getReadSet(): Set<string> {
  const rows = getDb().select().from(readState).all();
  return new Set(rows.map((r) => readKey(r.kind, r.repoFullName, r.number)));
}

export function markAsRead(kind: "issue" | "pr", repoFullName: string, number: number): void {
  getDb()
    .insert(readState)
    .values({ kind, repoFullName, number, readAt: new Date() })
    .onConflictDoNothing()
    .run();
}

export function markAsUnread(kind: "issue" | "pr", repoFullName: string, number: number): void {
  getDb()
    .delete(readState)
    .where(
      and(
        eq(readState.kind, kind),
        eq(readState.repoFullName, repoFullName),
        eq(readState.number, number),
      ),
    )
    .run();
}
