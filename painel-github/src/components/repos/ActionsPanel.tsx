"use client";

import { useState } from "react";
import { useActions, useDispatchWorkflow, useRerunWorkflow } from "@/hooks/useActions";
import { relativeTime } from "@/lib/format";
import { ApiError } from "@/lib/api-client";
import type { WorkflowRunDTO } from "@/lib/types-actions";
import { SkeletonLista } from "@/components/feedback/Skeleton";

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

const CONCLUSION_BG: Record<string, string> = {
  success: "bg-jade",
  failure: "bg-coral",
  cancelled: "bg-ink-700",
};

const STATUS_BG: Record<string, string> = {
  completed: "bg-jade",
  in_progress: "bg-blueprint",
  queued: "bg-amber",
};

function corDeTexto(run: WorkflowRunDTO): string {
  return run.conclusion
    ? (CONCLUSION_COLOR[run.conclusion] ?? "text-chalk-dim")
    : (STATUS_COLOR[run.status] ?? "text-chalk-dim");
}

function corDeFundo(run: WorkflowRunDTO): string {
  return run.conclusion
    ? (CONCLUSION_BG[run.conclusion] ?? "bg-ink-700")
    : (STATUS_BG[run.status] ?? "bg-ink-700");
}

interface GrupoDeExecucoes {
  chave: string;
  execucoes: WorkflowRunDTO[];
  maisRecente: WorkflowRunDTO;
}

/*
 * A API devolve as execuções em ordem cronológica, sem agrupar — e a
 * lista crua repetia a mesma linha dezenas de vezes ("CI · failure") num
 * repositório com CI quebrada. Agrupar por workflow mostra o estado
 * ATUAL de cada um, com o histórico virando uma faixa de traços ao lado.
 *
 * Chave é o workflowId (o nome pode mudar entre execuções, se o YAML for
 * editado), mas o rótulo exibido é o nome — é o que a pessoa reconhece.
 */
function agruparPorWorkflow(runs: WorkflowRunDTO[]): GrupoDeExecucoes[] {
  const porId = new Map<number, WorkflowRunDTO[]>();
  for (const run of runs) {
    const lista = porId.get(run.workflowId);
    if (lista) lista.push(run);
    else porId.set(run.workflowId, [run]);
  }

  return [...porId.values()]
    .map((execucoes) => {
      const ordenadas = [...execucoes].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      const maisRecente = ordenadas[0]!;
      return {
        chave: maisRecente.name ?? `Workflow #${maisRecente.workflowId}`,
        execucoes: ordenadas,
        maisRecente,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.maisRecente.createdAt).getTime() -
        new Date(a.maisRecente.createdAt).getTime(),
    );
}

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

      {isLoading && <SkeletonLista itens={3} />}
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
            {agruparPorWorkflow(data.runs).map((grupo) => (
              <li
                key={grupo.chave}
                className="flex items-center gap-3 rounded border border-ink-700 px-3 py-2 text-sm"
              >
                <a
                  href={grupo.maisRecente.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="min-w-0 flex-1 truncate text-chalk hover:text-blueprint"
                >
                  {grupo.chave}
                </a>

                {/*
                 * Histórico como faixa de status: cada traço é uma
                 * execução, da mais antiga à mais recente. Substitui as
                 * N linhas idênticas que a lista crua produzia — num
                 * repositório com CI quebrada eram quinze "CI failure"
                 * empilhadas, todas dizendo a mesma coisa.
                 */}
                <span className="flex shrink-0 items-center gap-0.75" aria-hidden>
                  {grupo.execucoes
                    .slice(0, 10)
                    .reverse()
                    .map((run) => (
                      <span
                        key={run.id}
                        title={`${run.conclusion ?? run.status} — ${relativeTime(run.createdAt)}`}
                        className={`h-3.5 w-1 rounded-full ${corDeFundo(run)}`}
                      />
                    ))}
                </span>

                <span
                  className={`w-16 shrink-0 text-right font-mono text-xs ${corDeTexto(grupo.maisRecente)}`}
                >
                  {grupo.maisRecente.conclusion ?? grupo.maisRecente.status}
                </span>

                <span className="w-20 shrink-0 text-right font-mono text-xs text-chalk-dim">
                  {relativeTime(grupo.maisRecente.createdAt)}
                </span>

                <button
                  type="button"
                  onClick={() => rerun.mutate(grupo.maisRecente.id)}
                  disabled={rerun.isPending}
                  className="shrink-0 font-mono text-xs text-chalk-dim hover:text-chalk disabled:opacity-40"
                >
                  Re-executar
                </button>
              </li>
            ))}
          </ul>
          {data.runs.length > 0 && (
            <p className="mt-2 text-xs text-chalk-dim">
              {data.runs.length} execuç{data.runs.length === 1 ? "ão" : "ões"} agrupada
              {data.runs.length === 1 ? "" : "s"} por workflow — cada traço é uma execução, da mais
              antiga à mais recente.
            </p>
          )}
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
