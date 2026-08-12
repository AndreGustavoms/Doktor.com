"use client";

import { useState } from "react";
import {
  useActivityLog,
  useChangePassword,
  useClearCache,
  useRunSecurityAudit,
  ApiError,
  type AuditItem,
} from "@/hooks/useSettings";
import { LockButton } from "@/components/layout/LockButton";
import { relativeTime } from "@/lib/format";
import { SkeletonLista } from "@/components/feedback/Skeleton";

/**
 * Rotacionar token · trocar senha mestra · limpar cache · exportar
 * dados · log de atividade — ver prompt original §7.9. Rotação de
 * token não é feita pela UI web de propósito (ver
 * scripts/rotate-token.ts) — é a única ação desta tela que sai da web.
 */
export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-360 px-8 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-(family-name:--font-display) text-3xl font-bold text-chalk">
          Ajustes
        </h1>
        <LockButton />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChangePasswordCard />
        <MaintenanceCard />
        <TokenRotationCard />
        <SecurityAuditCard />
        <ActivityLogCard />
      </div>
    </main>
  );
}

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const changePassword = useChangePassword();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "As senhas novas não conferem." });
      return;
    }

    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      setMessage({ type: "success", text: "Senha mestra alterada com sucesso." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof ApiError ? err.message : "Erro ao trocar a senha.",
      });
    }
  }

  return (
    <section className="rounded border border-ink-700 bg-ink-800 p-5">
      <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim">
        Senha mestra
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Senha atual"
          required
          className="rounded border border-ink-600 bg-ink-900 px-3 py-1.5 text-sm text-chalk outline-none focus-visible:border-blueprint"
        />
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Nova senha (mínimo 12 caracteres)"
          required
          className="rounded border border-ink-600 bg-ink-900 px-3 py-1.5 text-sm text-chalk outline-none focus-visible:border-blueprint"
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirmar nova senha"
          required
          className="rounded border border-ink-600 bg-ink-900 px-3 py-1.5 text-sm text-chalk outline-none focus-visible:border-blueprint"
        />
        {message && (
          <p className={`text-sm ${message.type === "success" ? "text-jade" : "text-coral"}`}>
            {message.text}
          </p>
        )}
        <button
          type="submit"
          disabled={changePassword.isPending}
          className="self-start rounded bg-blueprint px-3 py-1.5 font-mono text-xs uppercase tracking-[0.08em] text-ink-900 disabled:opacity-40"
        >
          {changePassword.isPending ? "Trocando…" : "Trocar senha"}
        </button>
      </form>
    </section>
  );
}

function MaintenanceCard() {
  const clearCache = useClearCache();
  const [cleared, setCleared] = useState(false);

  return (
    <section className="rounded border border-ink-700 bg-ink-800 p-5">
      <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim">
        Manutenção
      </h2>
      <div className="flex flex-col gap-3">
        <div>
          <button
            type="button"
            onClick={async () => {
              await clearCache.mutateAsync();
              setCleared(true);
            }}
            disabled={clearCache.isPending}
            className="rounded border border-ink-600 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim hover:border-blueprint hover:text-chalk disabled:opacity-40"
          >
            {clearCache.isPending ? "Limpando…" : "Limpar cache"}
          </button>
          {cleared && <p className="mt-1 text-xs text-jade">Cache limpo.</p>}
        </div>
        <div>
          <a
            href="/api/settings/export"
            download
            className="inline-block rounded border border-ink-600 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim hover:border-blueprint hover:text-chalk"
          >
            Exportar dados locais (JSON)
          </a>
        </div>
      </div>
    </section>
  );
}

function TokenRotationCard() {
  return (
    <section className="rounded border border-ink-700 bg-ink-800 p-5">
      <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim">
        Rotacionar token
      </h2>
      <p className="mb-2 text-sm text-chalk-dim">
        Por segurança, a rotação de token roda via terminal, não pela web — ela pede a senha
        mestra e o token novo diretamente, sem passar por nenhuma camada HTTP.
      </p>
      <code className="block rounded border border-ink-600 bg-ink-900 px-3 py-2 font-mono text-xs text-chalk">
        npx tsx scripts/rotate-token.ts
      </code>
      <p className="mt-2 text-xs text-chalk-dim">
        Depois de rotacionar, revogue o token antigo em github.com/settings/tokens.
      </p>
    </section>
  );
}

const STATUS_META: Record<AuditItem["status"], { icon: string; className: string }> = {
  pass: { icon: "✓", className: "text-jade" },
  warn: { icon: "!", className: "text-amber" },
  fail: { icon: "✗", className: "text-coral" },
};

function SecurityAuditCard() {
  const runAudit = useRunSecurityAudit();
  const [items, setItems] = useState<AuditItem[] | null>(null);

  return (
    <section className="rounded border border-ink-700 bg-ink-800 p-5">
      <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim">
        Auditoria de segurança
      </h2>
      <p className="mb-3 text-sm text-chalk-dim">
        Roda ao vivo, sem chamada de rede: bind em loopback, vault cifrado, .gitignore, hooks do
        gitleaks, flag de ações destrutivas e headers de segurança. Não substitui{" "}
        <code className="text-chalk">npm run check</code>, que também cobre testes e
        vulnerabilidades de dependências.
      </p>
      <button
        type="button"
        onClick={async () => {
          const res = await runAudit.mutateAsync();
          setItems(res.items);
        }}
        disabled={runAudit.isPending}
        className="rounded border border-ink-600 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim hover:border-blueprint hover:text-chalk disabled:opacity-40"
      >
        {runAudit.isPending ? "Rodando…" : "Rodar auditoria"}
      </button>

      {items && (
        <ul className="mt-3 flex flex-col gap-1.5">
          {items.map((item) => {
            const meta = STATUS_META[item.status];
            return (
              <li key={item.id} className="flex items-start gap-2 text-sm">
                <span className={`shrink-0 font-mono ${meta.className}`}>{meta.icon}</span>
                <div>
                  <span className="text-chalk">{item.label}</span>
                  <p className="text-xs text-chalk-dim">{item.detail}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function ActivityLogCard() {
  const { data, isLoading } = useActivityLog();

  return (
    <section className="rounded border border-ink-700 bg-ink-800 p-5 lg:col-span-2">
      <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim">
        Log de atividade
      </h2>
      {isLoading && <SkeletonLista itens={3} />}
      {!isLoading && data?.activity.length === 0 && (
        <p className="text-sm text-chalk-dim">Nenhuma atividade registrada ainda.</p>
      )}
      <ul className="flex flex-col gap-1">
        {data?.activity.map((entry) => (
          <li
            key={entry.id}
            className="flex items-center gap-3 border-b border-ink-700/50 py-1.5 text-sm last:border-0"
          >
            <span className={entry.result === "success" ? "text-jade" : "text-coral"}>
              {entry.result === "success" ? "✓" : "✗"}
            </span>
            <span className="font-mono text-xs text-chalk">{entry.action}</span>
            <span className="truncate text-chalk-dim">{entry.target}</span>
            <span className="ml-auto shrink-0 font-mono text-xs text-chalk-dim">
              {relativeTime(entry.at)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
