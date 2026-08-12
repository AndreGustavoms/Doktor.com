"use client";

import { useState } from "react";
import { useReleases, useCreateRelease } from "@/hooks/useReleases";
import { relativeTime } from "@/lib/format";
import { ApiError } from "@/lib/api-client";
import { SkeletonLista } from "@/components/feedback/Skeleton";

/**
 * Listar, criar release com tag e notas, marcar como pré-release — ver
 * prompt original §7.5.
 */
export function ReleasesPanel({ owner, name }: { owner: string; name: string }) {
  const { data, isLoading, isError } = useReleases(owner, name);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <section className="rounded border border-ink-700 bg-ink-800 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim">Releases</h2>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="rounded border border-ink-600 px-2.5 py-1 font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim hover:border-blueprint hover:text-chalk"
        >
          {showCreate ? "Cancelar" : "Nova release"}
        </button>
      </div>

      {showCreate && (
        <CreateReleaseForm owner={owner} name={name} onDone={() => setShowCreate(false)} />
      )}

      {isLoading && <SkeletonLista itens={2} />}
      {isError && <p className="text-sm text-coral">Não foi possível carregar as releases.</p>}
      {!isLoading && !isError && data?.releases.length === 0 && (
        <p className="text-sm text-chalk-dim">Nenhuma release publicada ainda.</p>
      )}

      <ul className="flex flex-col gap-2">
        {data?.releases.map((release) => (
          <li key={release.id} className="rounded border border-ink-700 p-3">
            <div className="flex items-center gap-2">
              <a
                href={release.htmlUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="font-mono text-sm text-chalk hover:text-blueprint"
              >
                {release.tagName}
              </a>
              {release.isPrerelease && (
                <span className="rounded border border-amber/40 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-amber">
                  Pré-release
                </span>
              )}
              {release.publishedAt && (
                <span className="ml-auto font-mono text-xs text-chalk-dim">
                  {relativeTime(release.publishedAt)}
                </span>
              )}
            </div>
            {release.name && <p className="mt-1 text-sm text-chalk-dim">{release.name}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}

function CreateReleaseForm({
  owner,
  name,
  onDone,
}: {
  owner: string;
  name: string;
  onDone: () => void;
}) {
  const [tagName, setTagName] = useState("");
  const [releaseName, setReleaseName] = useState("");
  const [body, setBody] = useState("");
  const [isPrerelease, setIsPrerelease] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createRelease = useCreateRelease(owner, name);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createRelease.mutateAsync({
        tagName,
        name: releaseName || undefined,
        body: body || undefined,
        isPrerelease,
      });
      setTagName("");
      setReleaseName("");
      setBody("");
      setIsPrerelease(false);
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao criar release.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 flex flex-col gap-2 rounded border border-ink-600 p-3">
      <input
        type="text"
        value={tagName}
        onChange={(e) => setTagName(e.target.value)}
        placeholder="Tag (ex: v1.0.0)"
        required
        className="rounded border border-ink-600 bg-ink-900 px-3 py-1.5 font-mono text-sm text-chalk outline-none focus-visible:border-blueprint"
      />
      <input
        type="text"
        value={releaseName}
        onChange={(e) => setReleaseName(e.target.value)}
        placeholder="Nome da release (opcional)"
        className="rounded border border-ink-600 bg-ink-900 px-3 py-1.5 text-sm text-chalk outline-none focus-visible:border-blueprint"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Notas da release (opcional)"
        rows={3}
        className="rounded border border-ink-600 bg-ink-900 px-3 py-1.5 text-sm text-chalk outline-none focus-visible:border-blueprint"
      />
      <label className="flex items-center gap-2 text-sm text-chalk-dim">
        <input
          type="checkbox"
          checked={isPrerelease}
          onChange={(e) => setIsPrerelease(e.target.checked)}
        />
        Marcar como pré-release
      </label>
      {error && <p className="text-sm text-coral">{error}</p>}
      <button
        type="submit"
        disabled={createRelease.isPending || !tagName.trim()}
        className="self-start rounded bg-blueprint px-3 py-1.5 font-mono text-xs uppercase tracking-[0.08em] text-ink-900 disabled:opacity-40"
      >
        {createRelease.isPending ? "Criando…" : "Criar release"}
      </button>
    </form>
  );
}
