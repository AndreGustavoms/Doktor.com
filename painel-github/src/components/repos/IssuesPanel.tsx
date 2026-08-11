"use client";

import { useState } from "react";
import { useIssues, useCreateIssue, useSetIssueState, useCommentIssue } from "@/hooks/useIssues";
import { relativeTime } from "@/lib/format";
import { ApiError } from "@/lib/api-client";

export function IssuesPanel({ owner, name }: { owner: string; name: string }) {
  const [stateFilter, setStateFilter] = useState<"open" | "closed">("open");
  const { data, isLoading, isError } = useIssues(owner, name, stateFilter);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <section className="rounded border border-ink-700 bg-ink-800 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim">Issues</h2>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded border border-ink-600">
            <button
              type="button"
              onClick={() => setStateFilter("open")}
              className={`px-2.5 py-1 font-mono text-xs uppercase tracking-[0.08em] ${
                stateFilter === "open" ? "bg-ink-700 text-blueprint" : "text-chalk-dim"
              }`}
            >
              Abertas
            </button>
            <button
              type="button"
              onClick={() => setStateFilter("closed")}
              className={`px-2.5 py-1 font-mono text-xs uppercase tracking-[0.08em] ${
                stateFilter === "closed" ? "bg-ink-700 text-blueprint" : "text-chalk-dim"
              }`}
            >
              Fechadas
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate((v) => !v)}
            className="rounded border border-ink-600 px-2.5 py-1 font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim hover:border-blueprint hover:text-chalk"
          >
            {showCreate ? "Cancelar" : "Nova issue"}
          </button>
        </div>
      </div>

      {showCreate && (
        <CreateIssueForm owner={owner} name={name} onDone={() => setShowCreate(false)} />
      )}

      {isLoading && <p className="text-sm text-chalk-dim">Carregando issues…</p>}
      {isError && <p className="text-sm text-coral">Não foi possível carregar as issues.</p>}
      {!isLoading && !isError && data?.issues.length === 0 && (
        <p className="text-sm text-chalk-dim">Nenhuma issue {stateFilter === "open" ? "aberta" : "fechada"}.</p>
      )}

      <ul className="flex flex-col gap-2">
        {data?.issues.map((issue) => (
          <IssueRow key={issue.number} owner={owner} name={name} issue={issue} />
        ))}
      </ul>
    </section>
  );
}

function CreateIssueForm({
  owner,
  name,
  onDone,
}: {
  owner: string;
  name: string;
  onDone: () => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const createIssue = useCreateIssue(owner, name);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createIssue.mutateAsync({ title, body: body || undefined });
      setTitle("");
      setBody("");
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao criar issue.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 flex flex-col gap-2 rounded border border-ink-600 p-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título da issue"
        required
        className="rounded border border-ink-600 bg-ink-900 px-3 py-1.5 text-sm text-chalk outline-none focus-visible:border-blueprint"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Descrição (opcional)"
        rows={3}
        className="rounded border border-ink-600 bg-ink-900 px-3 py-1.5 text-sm text-chalk outline-none focus-visible:border-blueprint"
      />
      {error && <p className="text-sm text-coral">{error}</p>}
      <button
        type="submit"
        disabled={createIssue.isPending || !title.trim()}
        className="self-start rounded bg-blueprint px-3 py-1.5 font-mono text-xs uppercase tracking-[0.08em] text-ink-900 disabled:opacity-40"
      >
        {createIssue.isPending ? "Criando…" : "Criar issue"}
      </button>
    </form>
  );
}

function IssueRow({
  owner,
  name,
  issue,
}: {
  owner: string;
  name: string;
  issue: { number: number; title: string; state: "open" | "closed"; commentsCount: number; createdAt: string; htmlUrl: string };
}) {
  const [showComment, setShowComment] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [commentSent, setCommentSent] = useState(false);
  const setIssueState = useSetIssueState(owner, name);
  const commentIssue = useCommentIssue(owner, name);

  async function handleComment() {
    if (!commentBody.trim()) return;
    await commentIssue.mutateAsync({ number: issue.number, body: commentBody });
    setCommentBody("");
    setCommentSent(true);
    setShowComment(false);
  }

  return (
    <li className="rounded border border-ink-700 p-3">
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${issue.state === "open" ? "bg-jade" : "bg-chalk-dim"}`}
          aria-hidden
        />
        <a
          href={issue.htmlUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="flex-1 truncate text-sm text-chalk hover:text-blueprint"
        >
          {issue.title}
        </a>
        <span className="shrink-0 font-mono text-xs text-chalk-dim">#{issue.number}</span>
      </div>
      <div className="mt-1 flex items-center gap-3 font-mono text-xs text-chalk-dim">
        <span>{relativeTime(issue.createdAt)}</span>
        <span>{issue.commentsCount} comentário{issue.commentsCount === 1 ? "" : "s"}</span>
        <button
          type="button"
          onClick={() => setShowComment((v) => !v)}
          className="hover:text-chalk"
        >
          Comentar
        </button>
        <button
          type="button"
          onClick={() =>
            setIssueState.mutate({ number: issue.number, state: issue.state === "open" ? "closed" : "open" })
          }
          disabled={setIssueState.isPending}
          className="hover:text-chalk disabled:opacity-40"
        >
          {issue.state === "open" ? "Fechar" : "Reabrir"}
        </button>
      </div>
      {commentSent && <p className="mt-2 text-xs text-jade">Comentário enviado.</p>}
      {showComment && (
        <div className="mt-2 flex flex-col gap-2">
          <textarea
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            rows={2}
            placeholder="Escreva um comentário…"
            className="rounded border border-ink-600 bg-ink-900 px-3 py-1.5 text-sm text-chalk outline-none focus-visible:border-blueprint"
          />
          <button
            type="button"
            onClick={handleComment}
            disabled={commentIssue.isPending || !commentBody.trim()}
            className="self-start rounded bg-blueprint px-3 py-1 font-mono text-xs uppercase tracking-[0.08em] text-ink-900 disabled:opacity-40"
          >
            {commentIssue.isPending ? "Enviando…" : "Enviar comentário"}
          </button>
        </div>
      )}
    </li>
  );
}
