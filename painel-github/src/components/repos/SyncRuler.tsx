"use client";

import { useMemo, useState } from "react";
import { useActivity } from "@/hooks/useActivity";

const DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildDayRange(days: number): string[] {
  const today = new Date();
  const range: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    range.push(dayKey(new Date(today.getTime() - i * DAY_MS)));
  }
  return range;
}

/**
 * Elemento assinatura do painel (ver prompt original §8) — uma régua de
 * desenhista cobrindo os últimos 90 dias, com uma linha por repositório
 * fixado abaixo dela, traço vertical em cada dia com push, intensidade
 * proporcional ao volume de commits. Mostra num relance quais projetos
 * estão vivos e onde a atenção migrou ao longo do trimestre.
 */
export function SyncRuler() {
  const { data, isLoading, isError } = useActivity();
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const days = useMemo(() => buildDayRange(DAYS), []);

  if (isLoading) {
    return <div className="h-32 animate-pulse rounded border border-ink-700 bg-ink-800" />;
  }

  if (isError) {
    return (
      <div className="rounded border border-ink-700 bg-ink-800 p-4 text-sm text-chalk-dim">
        Não foi possível carregar a régua de sincronia.
      </div>
    );
  }

  const repos = data?.repos ?? [];

  if (repos.length === 0) {
    return (
      <div className="rounded border border-ink-700 bg-ink-800 p-6 text-sm text-chalk-dim">
        Nenhum repositório fixado. Fixe os que você mexe toda semana para eles aparecerem na
        régua.
      </div>
    );
  }

  const maxCommitsPerDay = Math.max(
    1,
    ...repos.flatMap((r) => Object.values(r.activity)),
  );

  return (
    <div className="overflow-x-auto rounded border border-ink-700 bg-ink-800 p-4">
      <div className="min-w-[720px]">
        {/* Régua graduada */}
        <div className="relative mb-3 flex h-6 border-b border-ink-600">
          {days.map((day, i) => {
            const isWeekMark = i % 7 === 0;
            return (
              <div
                key={day}
                className="relative flex-1"
                style={{ borderLeft: isWeekMark ? "1px solid var(--ink-600)" : undefined }}
              >
                {isWeekMark && (
                  <span className="absolute -top-0.5 left-0.5 font-mono text-[9px] text-chalk-dim">
                    {new Date(day).getDate()}/{new Date(day).getMonth() + 1}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Uma linha por repositório fixado */}
        <div className="flex flex-col gap-2">
          {repos.map((repo) => (
            <div key={repo.repoId} className="flex items-center gap-3">
              <span className="w-40 shrink-0 truncate font-mono text-xs text-chalk-dim">
                {repo.fullName.split("/")[1]}
              </span>
              <div className="relative flex h-4 flex-1">
                {days.map((day) => {
                  const count = repo.activity[day] ?? 0;
                  const intensity = count > 0 ? Math.min(1, count / maxCommitsPerDay) : 0;
                  return (
                    <div
                      key={day}
                      className="group relative flex-1"
                      onMouseEnter={() => setHoveredDay(`${repo.repoId}:${day}`)}
                      onMouseLeave={() => setHoveredDay(null)}
                    >
                      {count > 0 && (
                        <div
                          className="mx-auto h-full w-[2px] rounded-full bg-blueprint"
                          style={{ opacity: 0.25 + intensity * 0.75 }}
                        />
                      )}
                      {hoveredDay === `${repo.repoId}:${day}` && count > 0 && (
                        <div className="absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded border border-ink-600 bg-ink-900 px-2 py-1 font-mono text-[10px] text-chalk shadow-lg">
                          {day} — {count} commit{count === 1 ? "" : "s"}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
