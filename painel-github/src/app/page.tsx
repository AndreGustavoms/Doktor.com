import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { hasMasterPassword } from "@/server/auth/password";
import { vaultExists } from "@/server/vault/store";
import { SESSION_COOKIE_NAME, validateSession } from "@/server/auth/session";
import { isUnlocked } from "@/server/vault/session-state";
import { LockButton } from "@/components/layout/LockButton";

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

  return (
    <main className="mx-auto max-w-[1440px] px-8 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-chalk">
            Painel GitHub
          </h1>
          <p className="font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim">
            Fase 1 — vault e sessão
          </p>
        </div>
        <LockButton />
      </div>
      <p className="text-sm text-chalk-dim">
        Painel destravado. A camada GitHub (listagem de repositórios) chega na Fase 2.
      </p>
    </main>
  );
}
