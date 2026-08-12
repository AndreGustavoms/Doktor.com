"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
      <div className="rounded border border-dashed border-ink-700 bg-ink-800 p-6">
        <h2 className="mb-1 text-[13px] font-semibold text-chalk">Régua de sincronia</h2>
        <p className="mb-3 max-w-lg text-sm text-chalk-dim">
          Mostra 90 dias de atividade lado a lado: quais projetos estão vivos, quais pararam, e
          para onde sua atenção migrou no trimestre. É a única leitura do painel que não dá para
          obter olhando um repositório de cada vez.
        </p>
        <Link
          href="/repos"
          className="inline-block rounded-md border border-ink-700 px-3 py-1.5 text-sm text-chalk-dim transition-colors hover:border-blueprint hover:text-chalk"
        >
          Fixar repositórios
        </Link>
      </div>
    );
  }

  const maxCommitsPerDay = Math.max(
    1,
    ...repos.flatMap((r) => Object.values(r.activity)),
  );

  const totalCommits = repos.reduce(
    (soma, r) => soma + Object.values(r.activity).reduce((a, b) => a + b, 0),
    0,
  );

  return (
    <div className="overflow-x-auto rounded border border-ink-700 bg-ink-800 p-5">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-[13px] font-semibold text-chalk">Régua de sincronia</h2>
        <p className="font-mono text-[11px] text-chalk-dim">
          {totalCommits} commit{totalCommits === 1 ? "" : "s"} · últimos {DAYS} dias
        </p>
      </div>

      {/* 720px é o mínimo para 90 marcas de dia ficarem distinguíveis; em
          telas menores a régua rola dentro do próprio card, sem empurrar
          a página. */}
      <div className="min-w-180">
        {/* Régua graduada — marca maior a cada 7 dias, como fita métrica. */}
        <div className="relative mb-2 flex h-5 items-end border-b border-ink-700">
          {days.map((day, i) => {
            const isWeekMark = i % 7 === 0;
            return (
              <div key={day} className="relative flex-1">
                <div
                  className="absolute bottom-0 left-0 w-px bg-ink-700"
                  style={{ height: isWeekMark ? 9 : 4 }}
                />
                {isWeekMark && (
                  <span className="absolute bottom-3 left-0 font-mono text-[9px] text-chalk-dim">
                    {new Date(day).getUTCDate()}/{new Date(day).getUTCMonth() + 1}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Uma linha por repositório fixado */}
        <div className="flex flex-col">
          {repos.map((repo) => {
            const commitsDoRepo = Object.values(repo.activity).reduce((a, b) => a + b, 0);
            return (
              <div
                key={repo.repoId}
                className="flex items-center gap-3 border-b border-ink-700/60 py-1.5 last:border-0"
              >
                <span className="w-40 shrink-0 truncate text-xs text-chalk" title={repo.fullName}>
                  {repo.fullName.split("/")[1]}
                </span>
                <div className="relative flex h-5 flex-1 items-center">
                  {days.map((day) => {
                    const count = repo.activity[day] ?? 0;
                    /*
                     * Escala de raiz quadrada, não linear: um dia de 20
                     * commits não deve deixar os dias de 1 ou 2 commits
                     * invisíveis — o que importa aqui é distinguir
                     * "houve trabalho" de "não houve", e só depois a
                     * intensidade.
                     */
                    const intensidade =
                      count > 0 ? Math.sqrt(count / maxCommitsPerDay) : 0;
                    return (
                      <div
                        key={day}
                        className="relative flex h-full flex-1 items-center justify-center"
                        onMouseEnter={() => setHoveredDay(`${repo.repoId}:${day}`)}
                        onMouseLeave={() => setHoveredDay(null)}
                      >
                        {count > 0 && (
                          <div
                            className="w-[3px] rounded-full bg-blueprint"
                            style={{
                              height: `${45 + intensidade * 55}%`,
                              opacity: 0.45 + intensidade * 0.55,
                            }}
                          />
                        )}
                        {hoveredDay === `${repo.repoId}:${day}` && count > 0 && (
                          <div className="absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-ink-700 bg-ink-800 px-2 py-1 font-mono text-[10px] text-chalk shadow-md">
                            {new Date(day).getUTCDate()}/{new Date(day).getUTCMonth() + 1} —{" "}
                            {count} commit{count === 1 ? "" : "s"}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <span className="w-12 shrink-0 text-right font-mono text-[11px] text-chalk-dim">
                  {commitsDoRepo}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
