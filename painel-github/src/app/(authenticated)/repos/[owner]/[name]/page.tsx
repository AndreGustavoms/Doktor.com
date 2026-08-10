import { redirect, notFound } from "next/navigation";
import { cookies } from "next/headers";
import { hasMasterPassword } from "@/server/auth/password";
import { vaultExists } from "@/server/vault/store";
import { SESSION_COOKIE_NAME, validateSession } from "@/server/auth/session";
import { isUnlocked } from "@/server/vault/session-state";
import { RepoParamsSchema } from "@/server/schemas/github";
import { getRepo, getReadme, listCommits } from "@/server/github/repo-detail";
import { renderMarkdown } from "@/server/markdown";
import { MarkdownView } from "@/components/markdown/MarkdownView";
import { LockButton } from "@/components/layout/LockButton";
import { languageColor } from "@/lib/language-colors";
import { relativeTime, formatNumber } from "@/lib/format";

/*
 * Mesma razão da página raiz (Fase 1, docs/ARCHITECTURE.md): decide
 * autenticação e busca dados que mudam a cada visita — não pode ser
 * prerenderizada.
 */
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ owner: string; name: string }>;
}

export default async function RepoDetailPage({ params }: PageProps) {
  const isSetup = (await hasMasterPassword()) && vaultExists();
  if (!isSetup) redirect("/setup");

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const sessionResult = token ? await validateSession(token) : { valid: false as const };
  if (!sessionResult.valid || !isUnlocked()) redirect("/unlock");

  const resolvedParams = await params;
  const parsed = RepoParamsSchema.safeParse(resolvedParams);
  if (!parsed.success) notFound();

  const identity = { owner: parsed.data.owner, name: parsed.data.name };

  let repoResult;
  try {
    repoResult = await getRepo(identity);
  } catch (err) {
    const status =
      typeof err === "object" && err !== null && "status" in err
        ? Number((err as { status: unknown }).status)
        : undefined;
    if (status === 404) notFound();
    throw err;
  }

  const { repo } = repoResult;
  const [{ markdown }, { commits }] = await Promise.all([
    getReadme(identity),
    listCommits(identity, 1, 5),
  ]);

  const readmeHtml = markdown ? (await renderMarkdown(markdown)).html : null;

  return (
    <main className="mx-auto max-w-[1440px] px-8 py-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim">
            {repo.fullName}
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold text-chalk">
            {repo.name}
          </h1>
          {repo.description && <p className="mt-2 text-chalk-dim">{repo.description}</p>}
        </div>
        <LockButton />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-6">
          <section className="rounded border border-ink-700 bg-ink-800 p-5">
            <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim">
              README
            </h2>
            {readmeHtml ? (
              <MarkdownView html={readmeHtml} />
            ) : (
              <p className="text-sm text-chalk-dim">Este repositório não tem README.</p>
            )}
          </section>

          <section className="rounded border border-ink-700 bg-ink-800 p-5">
            <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim">
              Últimos commits
            </h2>
            {commits.length === 0 ? (
              <p className="text-sm text-chalk-dim">Nenhum commit encontrado.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {commits.map((commit) => (
                  <li key={commit.sha} className="flex items-baseline gap-3 text-sm">
                    <a
                      href={commit.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="shrink-0 font-mono text-xs text-blueprint"
                    >
                      {commit.sha.slice(0, 7)}
                    </a>
                    <span className="truncate text-chalk">{commit.message.split("\n")[0]}</span>
                    <span className="ml-auto shrink-0 font-mono text-xs text-chalk-dim">
                      {relativeTime(commit.authorDate)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded border border-ink-700 bg-ink-800 p-4">
            <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim">
              Metadados
            </h2>
            <dl className="flex flex-col gap-2 text-sm">
              {repo.language && (
                <div className="flex items-center justify-between">
                  <dt className="text-chalk-dim">Linguagem</dt>
                  <dd className="flex items-center gap-1.5 text-chalk">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: languageColor(repo.language) }}
                      aria-hidden
                    />
                    {repo.language}
                  </dd>
                </div>
              )}
              <div className="flex items-center justify-between">
                <dt className="text-chalk-dim">Estrelas</dt>
                <dd className="text-chalk">{formatNumber(repo.stars)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-chalk-dim">Forks</dt>
                <dd className="text-chalk">{formatNumber(repo.forks)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-chalk-dim">Issues abertas</dt>
                <dd className="text-chalk">{repo.openIssues}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-chalk-dim">Branch padrão</dt>
                <dd className="font-mono text-xs text-chalk">{repo.defaultBranch}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-chalk-dim">Licença</dt>
                <dd className="text-chalk">{repo.hasLicense ? "Sim" : "Não"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-chalk-dim">Último push</dt>
                <dd className="text-chalk">{relativeTime(repo.pushedAt)}</dd>
              </div>
            </dl>
          </div>

          {repo.topics.length > 0 && (
            <div className="rounded border border-ink-700 bg-ink-800 p-4">
              <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim">
                Topics
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {repo.topics.map((topic) => (
                  <span
                    key={topic}
                    className="rounded border border-ink-600 px-2 py-0.5 font-mono text-xs text-chalk-dim"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          <a
            href={repo.htmlUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="rounded border border-ink-600 px-3 py-2 text-center font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim transition-colors hover:border-blueprint hover:text-chalk"
          >
            Abrir no GitHub
          </a>
        </aside>
      </div>
    </main>
  );
}
