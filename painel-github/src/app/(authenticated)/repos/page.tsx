"use client";

import { useState, useMemo, useDeferredValue } from "react";
import { useRepos } from "@/hooks/useRepos";
import { RepoCard } from "@/components/repos/RepoCard";
import { RepoTable } from "@/components/repos/RepoTable";
import { LockButton } from "@/components/layout/LockButton";

type ViewMode = "grid" | "table";
type SortKey = "updated" | "created" | "name" | "stars";

export default function ReposPage() {
  const { data, isLoading, isError } = useRepos();
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortKey, setSortKey] = useState<SortKey>("updated");

  // Busca filtra no cache local (client-side) — nunca dispara requisição
  // nova a cada tecla. Ver prompt original §7.4/§4.12 (debounce só
  // importa para endpoints de busca reais contra a API, não aqui).
  const deferredQuery = useDeferredValue(query);

  const repos = data?.repos;

  const filteredAndSorted = useMemo(() => {
    if (!repos) return [];

    const q = deferredQuery.trim().toLowerCase();
    const filtered = q
      ? repos.filter(
          (r) => r.name.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q),
        )
      : repos;

    const sorted = [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "name":
          return a.name.localeCompare(b.name);
        case "stars":
          return b.stars - a.stars;
        case "updated":
        default:
          return (b.pushedAt ?? "").localeCompare(a.pushedAt ?? "");
      }
    });

    return sorted;
  }, [repos, deferredQuery, sortKey]);

  return (
    <main className="mx-auto max-w-[1440px] px-8 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-chalk">
          Repositórios
        </h1>
        <LockButton />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome ou descrição…"
          className="min-w-[240px] flex-1 rounded border border-ink-600 bg-ink-900 px-3 py-2 text-sm text-chalk outline-none focus-visible:border-blueprint"
        />

        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="rounded border border-ink-600 bg-ink-900 px-3 py-2 font-mono text-xs text-chalk-dim outline-none focus-visible:border-blueprint"
        >
          <option value="updated">Atualizado</option>
          <option value="name">Nome</option>
          <option value="stars">Estrelas</option>
        </select>

        <div className="flex overflow-hidden rounded border border-ink-600">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            aria-pressed={viewMode === "grid"}
            className={`px-3 py-2 font-mono text-xs uppercase tracking-[0.08em] ${
              viewMode === "grid" ? "bg-ink-800 text-blueprint" : "text-chalk-dim"
            }`}
          >
            Grade
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            aria-pressed={viewMode === "table"}
            className={`px-3 py-2 font-mono text-xs uppercase tracking-[0.08em] ${
              viewMode === "table" ? "bg-ink-800 text-blueprint" : "text-chalk-dim"
            }`}
          >
            Tabela
          </button>
        </div>
      </div>

      {isLoading && <p className="text-sm text-chalk-dim">Carregando repositórios…</p>}

      {isError && (
        <p className="text-sm text-coral">
          Não foi possível carregar os repositórios. Verifique a conexão e tente novamente.
        </p>
      )}

      {!isLoading && !isError && filteredAndSorted.length === 0 && (
        <p className="text-sm text-chalk-dim">
          {query
            ? `Nenhum repositório encontrado para "${query}".`
            : "Nenhum repositório encontrado."}
        </p>
      )}

      {!isLoading && !isError && filteredAndSorted.length > 0 && (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAndSorted.map((repo) => (
                <RepoCard key={repo.id} repo={repo} />
              ))}
            </div>
          ) : (
            <RepoTable repos={filteredAndSorted} />
          )}
        </>
      )}
    </main>
  );
}
