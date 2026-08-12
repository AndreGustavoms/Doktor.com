import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { hasMasterPassword } from "@/server/auth/password";
import { vaultExists } from "@/server/vault/store";
import { SESSION_COOKIE_NAME, validateSession } from "@/server/auth/session";
import { isUnlocked } from "@/server/vault/session-state";
import { listRepos } from "@/server/github/repos";
import { LockButton } from "@/components/layout/LockButton";
import { SyncRuler } from "@/components/repos/SyncRuler";

/*
 * Sem isto, o Next 16 prerenderiza esta rota no build e serve o
 * redirect resultante do cache (x-nextjs-cache: HIT, Cache-Control:
 * s-maxage=31536000) em vez de reavaliar hasMasterPassword()/sessão a
 * cada requisição — verificado ao vivo com next start + curl. O estado
 * de setup/sessão muda depois do build (setup concluído, unlock,
 * expiração), então esta rota NUNCA pode ser estática. Ver
 * docs/SECURITY.md, ameaça A8.
 */
export const dynamic = "force-dynamic";

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;

/*
 * Função pura de módulo, fora do componente — Date.now() chamado direto
 * no corpo de um componente é sinalizado pelo React Compiler como
 * "impuro" (react-hooks/purity), mesmo em Server Component onde a
 * preocupação de re-render inconsistente não se aplica da mesma forma.
 * Extrair resolve o lint e também é a forma mais testável de qualquer
 * jeito.
 */
function isStale(pushedAt: string | null): boolean {
  if (!pushedAt) return true;
  return new Date(pushedAt).getTime() < Date.now() - SIX_MONTHS_MS;
}

export default async function DashboardPage() {
  const isSetup = (await hasMasterPassword()) && vaultExists();
  if (!isSetup) {
    redirect("/setup");
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const sessionResult = token ? await validateSession(token) : { valid: false as const };

  if (!sessionResult.valid || !isUnlocked()) {
    redirect("/unlock");
  }

  // Página inteira de 100 repos — limitação conhecida documentada em
  // docs/ARCHITECTURE.md: usuários com mais repos que isso não veem os
  // excedentes nos cards agregados até a Fase 5 trazer paginação
  // completa de dashboard.
  const { repos } = await listRepos({ page: 1, perPage: 100 });

  const totalRepos = repos.length;
  const privateCount = repos.filter((r) => r.isPrivate).length;
  const publicCount = totalRepos - privateCount;
  const totalStars = repos.reduce((sum, r) => sum + r.stars, 0);
  const totalOpenIssues = repos.reduce((sum, r) => sum + r.openIssues, 0);

  const needsAttention = {
    noReadme: repos.filter((r) => r.hasReadme === false).length,
    noDescription: repos.filter((r) => !r.description).length,
    noLicense: repos.filter((r) => !r.hasLicense).length,
    stale: repos.filter((r) => isStale(r.pushedAt)).length,
  };

  return (
    <main className="mx-auto max-w-360 px-4 py-5 sm:px-6 md:px-8 md:py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-(family-name:--font-display) text-3xl font-bold text-chalk">
            Painel GitHub
          </h1>
          <p className="font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim">
            {totalRepos} repositórios
          </p>
        </div>
        <LockButton />
      </div>

      <div className="mb-6">
        <SyncRuler />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Repositórios" value={totalRepos} />
        <StatCard label="Públicos / Privados" value={`${publicCount} / ${privateCount}`} />
        <StatCard label="Estrelas" value={totalStars} />
        <StatCard label="Issues abertas" value={totalOpenIssues} />
        <StatCard label="Sem push há 6+ meses" value={needsAttention.stale} tone="warning" />
      </div>

      {(needsAttention.noDescription > 0 ||
        needsAttention.noLicense > 0 ||
        needsAttention.stale > 0) && (
        <div className="rounded border border-amber/30 bg-amber/5 p-4">
          <h2 className="mb-2 font-mono text-xs uppercase tracking-[0.08em] text-amber">
            Precisa de atenção
          </h2>
          <ul className="flex flex-col gap-1 text-sm text-chalk-dim">
            {needsAttention.noDescription > 0 && (
              <li>{needsAttention.noDescription} repositório(s) sem descrição</li>
            )}
            {needsAttention.noLicense > 0 && (
              <li>{needsAttention.noLicense} repositório(s) sem licença</li>
            )}
            {needsAttention.stale > 0 && (
              <li>{needsAttention.stale} repositório(s) parado(s) há mais de 6 meses</li>
            )}
          </ul>
        </div>
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "warning";
}) {
  return (
    <div className="rounded border border-ink-700 bg-ink-800 p-4">
      <p className="font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim">{label}</p>
      <p
        className={`mt-1 font-(family-name:--font-display) text-2xl font-bold ${
          tone === "warning" && Number(value) > 0 ? "text-amber" : "text-chalk"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
