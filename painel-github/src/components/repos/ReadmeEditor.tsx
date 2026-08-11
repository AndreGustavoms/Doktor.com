"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPut, ApiError } from "@/lib/api-client";
import { lineDiff } from "@/lib/line-diff";
import { MarkdownView } from "@/components/markdown/MarkdownView";

interface FileContentResponse {
  file: { content: string; sha: string; path: string } | null;
}

/**
 * Editor com commit direto — mensagem de commit obrigatória, escolha de
 * branch, diff antes de confirmar (ver prompt original §7.5 e §4.13).
 * Recebe o HTML do README já sanitizado (para visualização) e busca o
 * markdown cru sob demanda só quando o usuário entra em modo edição —
 * o servidor nunca expõe o markdown cru fora desse fluxo explícito (ver
 * docs/SECURITY.md, ameaça A5, comentário em src/app/api/.../readme/route.ts).
 */
export function ReadmeEditor({
  owner,
  name,
  defaultBranch,
  readmeHtml,
  hasReadme,
}: {
  owner: string;
  name: string;
  defaultBranch: string;
  readmeHtml: string | null;
  hasReadme: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "edit" | "diff">("view");
  const [original, setOriginal] = useState<{ content: string; sha: string } | null>(null);
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState("");
  const [branch, setBranch] = useState(defaultBranch);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startEditing() {
    setLoading(true);
    setError(null);
    try {
      const result = await apiGet<FileContentResponse>(
        `/api/repos/${owner}/${name}/contents?path=README.md`,
      );
      const content = result.file?.content ?? "";
      const sha = result.file?.sha ?? "";
      setOriginal({ content, sha });
      setDraft(content);
      setMode("edit");
    } catch {
      setError("Não foi possível carregar o README para edição.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCommit() {
    if (!original) return;
    setCommitting(true);
    setError(null);
    try {
      await apiPut(`/api/repos/${owner}/${name}/contents`, {
        path: "README.md",
        content: draft,
        message,
        sha: original.sha || undefined,
        branch,
      });
      setMode("view");
      setMessage("");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Erro inesperado ao commitar o README.");
      }
    } finally {
      setCommitting(false);
    }
  }

  if (mode === "view") {
    return (
      <section className="rounded border border-ink-700 bg-ink-800 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim">README</h2>
          <button
            type="button"
            onClick={startEditing}
            disabled={loading}
            className="rounded border border-ink-600 px-2.5 py-1 font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim transition-colors hover:border-blueprint hover:text-chalk disabled:opacity-40"
          >
            {loading ? "Carregando…" : hasReadme ? "Editar" : "Criar README"}
          </button>
        </div>
        {readmeHtml ? (
          <MarkdownView html={readmeHtml} />
        ) : (
          <p className="text-sm text-chalk-dim">Este repositório não tem README.</p>
        )}
        {error && <p className="mt-2 text-sm text-coral">{error}</p>}
      </section>
    );
  }

  const diff = original ? lineDiff(original.content, draft) : [];
  const hasChanges = diff.some((d) => d.type !== "unchanged");

  return (
    <section className="rounded border border-blueprint/40 bg-ink-800 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-mono text-xs uppercase tracking-[0.08em] text-blueprint">
          Editando README
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode(mode === "edit" ? "diff" : "edit")}
            disabled={!hasChanges}
            className="rounded border border-ink-600 px-2.5 py-1 font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim disabled:opacity-40"
          >
            {mode === "edit" ? "Ver diff" : "Voltar a editar"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("view");
              setError(null);
            }}
            className="rounded border border-ink-600 px-2.5 py-1 font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim"
          >
            Cancelar
          </button>
        </div>
      </div>

      {mode === "edit" && (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={16}
          className="w-full rounded border border-ink-600 bg-ink-900 px-3 py-2 font-mono text-sm text-chalk outline-none focus-visible:border-blueprint"
        />
      )}

      {mode === "diff" && (
        <div className="max-h-96 overflow-y-auto rounded border border-ink-600 bg-ink-900 p-3 font-mono text-xs">
          {diff.map((line, i) => (
            <div
              key={i}
              className={
                line.type === "added"
                  ? "bg-jade/10 text-jade"
                  : line.type === "removed"
                    ? "bg-coral/10 text-coral"
                    : "text-chalk-dim"
              }
            >
              <span className="select-none">
                {line.type === "added" ? "+ " : line.type === "removed" ? "- " : "  "}
              </span>
              {line.text}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        <label className="flex flex-col gap-1">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim">
            Branch
          </span>
          <input
            type="text"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="rounded border border-ink-600 bg-ink-900 px-3 py-1.5 font-mono text-sm text-chalk outline-none focus-visible:border-blueprint"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim">
            Mensagem de commit (obrigatória)
          </span>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Atualiza README"
            className="rounded border border-ink-600 bg-ink-900 px-3 py-1.5 text-sm text-chalk outline-none focus-visible:border-blueprint"
          />
        </label>

        {error && <p className="text-sm text-coral">{error}</p>}

        <button
          type="button"
          onClick={handleCommit}
          disabled={committing || !message.trim() || !hasChanges}
          className="mt-2 rounded bg-blueprint px-4 py-2 text-sm font-medium text-ink-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {committing ? "Commitando…" : "Commitar README"}
        </button>
      </div>
    </section>
  );
}
