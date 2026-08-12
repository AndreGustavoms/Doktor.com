"use client";

import { useState } from "react";
import { clsx } from "clsx";

/*
 * Abas da tela de detalhe — prompt original §7.5 pedia "Visão geral ·
 * Arquivos · Commits · Issues · Actions · Releases", mas a Fase 3
 * entregou tudo empilhado numa coluna só. O resultado media 5.674px de
 * altura num repositório com README grande: as issues ficavam abaixo de
 * quatro telas de rolagem, e ninguém rola até lá.
 *
 * Client Component porque a página é Server Component: o estado da aba
 * ativa vive aqui, e os painéis chegam prontos como children. Todos são
 * montados de uma vez e escondidos com CSS em vez de desmontados —
 * assim trocar de aba não redispara as queries do TanStack nem perde o
 * texto que o usuário digitou num formulário de issue pela metade.
 */
export interface RepoTab {
  id: string;
  label: string;
  content: React.ReactNode;
  /** Contador opcional ao lado do rótulo (issues abertas, releases…). */
  count?: number;
}

export function RepoTabs({ tabs }: { tabs: RepoTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");

  return (
    <div>
      <div
        role="tablist"
        aria-label="Seções do repositório"
        className="mb-5 flex gap-1 border-b border-ink-700"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`painel-${tab.id}`}
              onClick={() => setActive(tab.id)}
              className={clsx(
                "-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors",
                isActive
                  ? "border-blueprint font-medium text-chalk"
                  : "border-transparent text-chalk-dim hover:border-ink-700 hover:text-chalk",
              )}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="rounded-full bg-ink-600 px-1.5 py-0.5 text-[11px] text-chalk-dim">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`painel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={tab.id !== active}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
