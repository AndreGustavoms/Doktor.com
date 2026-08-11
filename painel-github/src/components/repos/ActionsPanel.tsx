"use client";

import { useState } from "react";
import { useActions, useDispatchWorkflow, useRerunWorkflow } from "@/hooks/useActions";
import { relativeTime } from "@/lib/format";
import { ApiError } from "@/lib/api-client";

const STATUS_COLOR: Record<string, string> = {
  completed: "text-jade",
  in_progress: "text-blueprint",
  queued: "text-amber",
};

const CONCLUSION_COLOR: Record<string, string> = {
  success: "text-jade",
  failure: "text-coral",
  cancelled: "text-chalk-dim",
};

/**
 * Execuções de workflow com status, botão de re-executar, disparo de
 * workflow_dispatch — ver prompt original §7.5. Inputs do
 * workflow_dispatch são um textarea de JSON livre, não um formulário
 * gerado a partir do YAML declarado — simplificação documentada em
 * docs/ARCHITECTURE.md.
 */
export function ActionsPanel({
  owner,
  name,
  defaultBranch,
}: {
  owner: string;
  name: string;
  defaultBranch: string;
}) {
  const { data, isLoading, isError } = useActions(owner, name);
  const rerun = useRerunWorkflow(owner, name);
  const [dispatchingId, setDispatchingId] = useState<number | null>(null);

  return (
    <section className="rounded border border-ink-700 bg-ink-800 p-5">
      <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim">
        Actions
      </h2>

      {isLoading && <p className="text-sm text-chalk-dim">Carregando workflows…</p>}
      {isError && <p className="text-sm text-coral">Não foi possível carregar workflows.</p>}

      {data && data.workflows.length === 0 && (
        <p className="text-sm text-chalk-dim">Nenhum workflow configurado neste repositório.</p>
      )}

      {data && data.workflows.length > 0 && (
        <div className="mb-4 flex flex-col gap-2">
          <h3 className="font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim">
            Workflows
          </h3>
          {data.workflows.map((wf) => (
            <div key={wf.id} className="flex items-center gap-2 rounded border border-ink-700 p-2">
              <span className="flex-1 truncate text-sm text-chalk">{wf.name}</span>
              <button
                type="button"
                onClick={() => setDispatchingId(dispatchingId === wf.id ? null : wf.id)}
                className="rounded border border-ink-600 px-2 py-1 font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim hover:border-blueprint hover:text-chalk"
              >
                Disparar
              </button>
            </div>
          ))}
          {dispatchingId !== null && (
            <DispatchForm
              owner={owner}
              name={name}
              workflowId={dispatchingId}
              defaultBranch={defaultBranch}
              onDone={() => setDispatchingId(null)}
            />
          )}
        </div>
      )}

      {data && data.runs.length > 0 && (
        <div>
          <h3 className="mb-2 font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim">
            Últimas execuções
          </h3>
          <ul className="flex flex-col gap-1.5">
            {data.runs.map((run) => (
              <li
                key={run.id}
                className="flex items-center gap-3 rounded border border-ink-700 px-3 py-2 text-sm"
              >
                <a
                  href={run.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="flex-1 truncate text-chalk hover:text-blueprint"
                >
                  {run.name ?? `Execução #${run.id}`}
                </a>
                <span
                  className={`font-mono text-xs ${
                    run.conclusion ? CONCLUSION_COLOR[run.conclusion] ?? "text-chalk-dim" : STATUS_COLOR[run.status] ?? "text-chalk-dim"
                  }`}
                >
                  {run.conclusion ?? run.status}
                </span>
                <span className="font-mono text-xs text-chalk-dim">
                  {relativeTime(run.createdAt)}
                </span>
                <button
                  type="button"
                  onClick={() => rerun.mutate(run.id)}
                  disabled={rerun.isPending}
                  className="font-mono text-xs text-chalk-dim hover:text-chalk disabled:opacity-40"
                >
                  Re-executar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function DispatchForm({
  owner,
  name,
  workflowId,
  defaultBranch,
  onDone,
}: {
  owner: string;
  name: string;
  workflowId: number;
  defaultBranch: string;
  onDone: () => void;
}) {
  const [ref, setRef] = useState(defaultBranch);
  const [inputsJson, setInputsJson] = useState("{}");
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatchWorkflow(owner, name);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    let inputs: Record<string, string> | undefined;
    try {
      const parsed = JSON.parse(inputsJson || "{}");
      inputs = Object.keys(parsed).length > 0 ? parsed : undefined;
    } catch {
      setError("Inputs precisam ser um JSON válido, ex: {\"chave\": \"valor\"}.");
      return;
    }

    try {
      await dispatch.mutateAsync({ workflowId, ref, inputs });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao disparar workflow.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded border border-ink-600 p-3">
      <label className="flex flex-col gap-1">
        <span className="font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim">
          Branch/tag
        </span>
        <input
          type="text"
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          className="rounded border border-ink-600 bg-ink-900 px-3 py-1.5 font-mono text-sm text-chalk outline-none focus-visible:border-blueprint"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim">
          Inputs (JSON)
        </span>
        <textarea
          value={inputsJson}
          onChange={(e) => setInputsJson(e.target.value)}
          rows={3}
          className="rounded border border-ink-600 bg-ink-900 px-3 py-1.5 font-mono text-xs text-chalk outline-none focus-visible:border-blueprint"
        />
      </label>
      {error && <p className="text-sm text-coral">{error}</p>}
      <button
        type="submit"
        disabled={dispatch.isPending}
        className="self-start rounded bg-blueprint px-3 py-1.5 font-mono text-xs uppercase tracking-[0.08em] text-ink-900 disabled:opacity-40"
      >
        {dispatch.isPending ? "Disparando…" : "Disparar"}
      </button>
    </form>
  );
}
