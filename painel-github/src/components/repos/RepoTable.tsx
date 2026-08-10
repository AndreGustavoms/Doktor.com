import Link from "next/link";
import { languageColor } from "@/lib/language-colors";
import { relativeTime, formatNumber } from "@/lib/format";
import type { RepoDTO } from "@/lib/types";

export function RepoTable({ repos }: { repos: RepoDTO[] }) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-ink-700 text-left font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim">
          <th className="py-2 pr-4 font-normal">Nome</th>
          <th className="py-2 pr-4 font-normal">Linguagem</th>
          <th className="py-2 pr-4 font-normal">★</th>
          <th className="py-2 pr-4 font-normal">Atualizado</th>
        </tr>
      </thead>
      <tbody>
        {repos.map((repo) => {
          const [owner] = repo.fullName.split("/");
          return (
            <tr key={repo.id} className="border-b border-ink-700/50 hover:bg-ink-800">
              <td className="py-2 pr-4">
                <Link
                  href={`/repos/${owner}/${repo.name}`}
                  className="font-mono text-chalk hover:text-blueprint"
                >
                  {repo.name}
                </Link>
                {repo.description && (
                  <p className="line-clamp-1 text-xs text-chalk-dim">{repo.description}</p>
                )}
              </td>
              <td className="py-2 pr-4 font-mono text-xs text-chalk-dim">
                {repo.language && (
                  <span className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: languageColor(repo.language) }}
                      aria-hidden
                    />
                    {repo.language}
                  </span>
                )}
              </td>
              <td className="py-2 pr-4 font-mono text-xs text-chalk-dim">
                {repo.stars > 0 ? formatNumber(repo.stars) : "—"}
              </td>
              <td className="py-2 pr-4 font-mono text-xs text-chalk-dim">
                {relativeTime(repo.pushedAt)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
