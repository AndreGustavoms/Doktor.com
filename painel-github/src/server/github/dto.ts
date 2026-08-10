import "server-only";
import { z } from "zod";

/*
 * A1 — allowlist, não denylist. As respostas do GitHub carregam dezenas
 * de campos não pedidos — e-mails de committer, URLs internas, blocos
 * `permissions`, em alguns endpoints até tokens de instalação. Repassar
 * o objeto inteiro é como um token vaza sem ninguém perceber. Toda
 * resposta de API passa por parse() do DTO antes de sair — ver
 * docs/SECURITY.md, ameaça A1, e prompt original §4.6.
 */
export const RepoDTO = z.object({
  id: z.number(),
  name: z.string(),
  fullName: z.string(),
  description: z.string().nullable(),
  isPrivate: z.boolean(),
  isFork: z.boolean(),
  isArchived: z.boolean(),
  defaultBranch: z.string(),
  language: z.string().nullable(),
  topics: z.array(z.string()),
  stars: z.number(),
  forks: z.number(),
  openIssues: z.number(),
  pushedAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
  htmlUrl: z.string().url(),
  hasReadme: z.boolean().nullable(),
  hasLicense: z.boolean(),
});

export type RepoDTO = z.infer<typeof RepoDTO>;

/**
 * Mapeamento explícito campo a campo — nunca um spread do objeto cru.
 * `raw` é tipado `unknown` de propósito: o chamador não deveria confiar
 * no shape do Octokit sem passar por este mapeamento primeiro.
 */
export function toRepoDTO(raw: unknown): RepoDTO {
  const r = raw as Record<string, unknown>;

  return RepoDTO.parse({
    id: r.id,
    name: r.name,
    fullName: r.full_name,
    description: r.description ?? null,
    isPrivate: r.private,
    isFork: r.fork,
    isArchived: r.archived,
    defaultBranch: r.default_branch,
    language: r.language ?? null,
    topics: Array.isArray(r.topics) ? r.topics : [],
    stars: r.stargazers_count,
    forks: r.forks_count,
    openIssues: r.open_issues_count,
    pushedAt: r.pushed_at ?? null,
    updatedAt: r.updated_at ?? null,
    htmlUrl: r.html_url,
    // has_readme não vem do endpoint de listagem — só o exibimos como
    // conhecido quando o chamador já checou (Fase 3, tela de detalhe).
    hasReadme: null,
    hasLicense: r.license !== null && r.license !== undefined,
  });
}
