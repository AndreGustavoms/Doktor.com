"use client";

import Link from "next/link";
import { languageColor } from "@/lib/language-colors";
import { relativeTime, formatNumber } from "@/lib/format";
import { usePinnedIds, useTogglePin } from "@/hooks/usePinned";
import type { RepoDTO } from "@/lib/types";

export function RepoCard({ repo }: { repo: RepoDTO }) {
  const [owner] = repo.fullName.split("/");
  const { data: pinnedData } = usePinnedIds();
  const togglePin = useTogglePin();
  const isPinned = pinnedData?.repoIds.includes(repo.id) ?? false;

  return (
    <div className="group relative flex flex-col gap-2 rounded border border-ink-700 bg-ink-800 p-4 transition-colors hover:border-blueprint">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          togglePin.mutate({ repoId: repo.id, pin: !isPinned });
        }}
        aria-pressed={isPinned}
        aria-label={isPinned ? "Desfixar repositório" : "Fixar repositório"}
        title={isPinned ? "Desfixar repositório" : "Fixar repositório"}
        className={`absolute right-3 top-3 rounded p-1 text-sm transition-colors ${
          isPinned ? "text-blueprint" : "text-chalk-dim opacity-0 group-hover:opacity-100"
        }`}
      >
        {isPinned ? "★" : "☆"}
      </button>

      <Link href={`/repos/${owner}/${repo.name}`} className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2 pr-6">
          <span className="truncate font-mono text-sm text-chalk">{repo.name}</span>
          {repo.isPrivate && (
            <span className="shrink-0 rounded border border-ink-600 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-chalk-dim">
              Privado
            </span>
          )}
        </div>

        {repo.description && (
          <p className="line-clamp-2 text-sm text-chalk-dim">{repo.description}</p>
        )}

        <div className="mt-auto flex items-center gap-3 pt-2 font-mono text-xs text-chalk-dim">
          {repo.language && (
            <span className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: languageColor(repo.language) }}
                aria-hidden
              />
              {repo.language}
            </span>
          )}
          {repo.stars > 0 && <span>★ {formatNumber(repo.stars)}</span>}
          <span className="ml-auto">{relativeTime(repo.pushedAt)}</span>
        </div>
      </Link>
    </div>
  );
}
