"use client";

import { useMemo, useState } from "react";
import { useInbox, useMarkRead } from "@/hooks/useInbox";
import { LockButton } from "@/components/layout/LockButton";
import { relativeTime } from "@/lib/format";
import type { InboxItem } from "@/lib/types-inbox";
import { SkeletonLista } from "@/components/feedback/Skeleton";

type GroupBy = "repo" | "none";

/**
 * Inbox unificada — todas as issues abertas de todos os repos, num
 * lugar só. Agrupamento por repositório, filtro por label, marcar como
 * lido localmente. Ver prompt original §7.6.
 */
export default function IssuesInboxPage() {
  const { data, isLoading, isError } = useInbox();
  const [groupBy, setGroupBy] = useState<GroupBy>("repo");
  const [labelFilter, setLabelFilter] = useState<string | null>(null);
  const [hideRead, setHideRead] = useState(true);

  const items = useMemo(() => data?.items ?? [], [data]);

  const allLabels = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      for (const label of item.labels) set.add(label);
    }
    return [...set].sort();
  }, [items]);

  const filtered = items.filter((item) => {
    if (hideRead && item.isRead) return false;
    if (labelFilter && !item.labels.includes(labelFilter)) return false;
    return true;
  });

  const grouped = useMemo(() => {
    if (groupBy === "none") return { "Todas": filtered };
    const map: Record<string, InboxItem[]> = {};
    for (const item of filtered) {
      (map[item.repoFullName] ??= []).push(item);
    }
    return map;
  }, [filtered, groupBy]);

  return (
    <main className="mx-auto max-w-360 px-4 py-5 sm:px-6 md:px-8 md:py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-(family-name:--font-display) text-3xl font-bold text-chalk">
            Issues
          </h1>
          <p className="font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim">
            {filtered.length} de {items.length} — todos os repositórios
          </p>
        </div>
        <LockButton />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex overflow-hidden rounded border border-ink-600">
          <button
            type="button"
            onClick={() => setGroupBy("repo")}
            className={`px-2.5 py-1.5 font-mono text-xs uppercase tracking-[0.08em] ${
              groupBy === "repo" ? "bg-ink-800 text-blueprint" : "text-chalk-dim"
            }`}
          >
            Por repositório
          </button>
          <button
            type="button"
            onClick={() => setGroupBy("none")}
            className={`px-2.5 py-1.5 font-mono text-xs uppercase tracking-[0.08em] ${
              groupBy === "none" ? "bg-ink-800 text-blueprint" : "text-chalk-dim"
            }`}
          >
            Lista única
          </button>
        </div>

        {allLabels.length > 0 && (
          <select
            aria-label="Filtrar por label"
            value={labelFilter ?? ""}
            onChange={(e) => setLabelFilter(e.target.value || null)}
            className="rounded border border-ink-600 bg-ink-900 px-3 py-1.5 font-mono text-xs text-chalk-dim outline-none focus-visible:border-blueprint"
          >
            <option value="">Todas as labels</option>
            {allLabels.map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
        )}

        <label className="flex items-center gap-1.5 font-mono text-xs text-chalk-dim">
          <input type="checkbox" checked={hideRead} onChange={(e) => setHideRead(e.target.checked)} />
          Ocultar lidas
        </label>
      </div>

      {isLoading && <SkeletonLista itens={5} />}
      {isError && <p className="text-sm text-coral">Não foi possível carregar a inbox.</p>}
      {!isLoading && !isError && filtered.length === 0 && (
        <p className="text-sm text-chalk-dim">Nada por aqui.</p>
      )}

      <div className="flex flex-col gap-6">
        {Object.entries(grouped).map(([group, groupItems]) => (
          <section key={group}>
            {groupBy === "repo" && (
              <h2 className="mb-2 font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim">
                {group}
              </h2>
            )}
            <ul className="flex flex-col gap-1.5">
              {groupItems.map((item) => (
                <InboxRow key={`${item.repoFullName}#${item.number}`} item={item} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}

function InboxRow({ item }: { item: InboxItem }) {
  const markRead = useMarkRead();

  return (
    <li
      className={`flex items-center gap-3 rounded border px-3 py-2 text-sm ${
        item.isRead ? "border-ink-700 opacity-60" : "border-ink-700 bg-ink-800"
      }`}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${item.isRead ? "bg-chalk-dim" : "bg-blueprint"}`} />
      <a
        href={item.htmlUrl}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="flex-1 truncate text-chalk hover:text-blueprint"
      >
        {item.title}
      </a>
      {/* Some no celular: o título da issue e o tempo já bastam ali, e o
          nome completo do repositório era o que estourava a largura. */}
      <span className="hidden max-w-40 shrink truncate font-mono text-xs text-chalk-dim sm:inline">
        {item.repoFullName}
      </span>
      <span className="shrink-0 font-mono text-xs text-chalk-dim">
        {relativeTime(item.createdAt)}
      </span>
      <button
        type="button"
        onClick={() =>
          markRead.mutate({
            kind: "issue",
            repoFullName: item.repoFullName,
            number: item.number,
            read: !item.isRead,
          })
        }
        disabled={markRead.isPending}
        className="shrink-0 font-mono text-xs text-chalk-dim hover:text-chalk disabled:opacity-40"
      >
        {item.isRead ? "Marcar não lida" : "Marcar lida"}
      </button>
    </li>
  );
}
