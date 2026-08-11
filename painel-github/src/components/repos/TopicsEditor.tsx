"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPut, ApiError } from "@/lib/api-client";

/**
 * Topics editáveis inline — ver prompt original §7.5.
 */
export function TopicsEditor({
  owner,
  name,
  initialTopics,
}: {
  owner: string;
  name: string;
  initialTopics: string[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [topics, setTopics] = useState(initialTopics);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addTopic() {
    const value = draft.trim().toLowerCase();
    if (!value || topics.includes(value)) {
      setDraft("");
      return;
    }
    setTopics([...topics, value]);
    setDraft("");
  }

  function removeTopic(topic: string) {
    setTopics(topics.filter((t) => t !== topic));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await apiPut(`/api/repos/${owner}/${name}/topics`, { topics });
      setEditing(false);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Erro inesperado ao salvar topics.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="rounded border border-ink-700 bg-ink-800 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim">Topics</h2>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim hover:text-blueprint"
          >
            Editar
          </button>
        </div>
        {topics.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {topics.map((topic) => (
              <span
                key={topic}
                className="rounded border border-ink-600 px-2 py-0.5 font-mono text-xs text-chalk-dim"
              >
                {topic}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-chalk-dim">Nenhum topic definido.</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded border border-blueprint/40 bg-ink-800 p-4">
      <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.08em] text-blueprint">
        Editando topics
      </h2>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {topics.map((topic) => (
          <button
            key={topic}
            type="button"
            onClick={() => removeTopic(topic)}
            className="rounded border border-ink-600 px-2 py-0.5 font-mono text-xs text-chalk-dim hover:border-coral hover:text-coral"
            title="Remover"
          >
            {topic} ×
          </button>
        ))}
      </div>
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addTopic();
          }
        }}
        placeholder="novo-topic (Enter para adicionar)"
        className="w-full rounded border border-ink-600 bg-ink-900 px-3 py-1.5 font-mono text-sm text-chalk outline-none focus-visible:border-blueprint"
      />
      {error && <p className="mt-2 text-sm text-coral">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setTopics(initialTopics);
            setError(null);
          }}
          className="rounded border border-ink-600 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded bg-blueprint px-3 py-1.5 font-mono text-xs uppercase tracking-[0.08em] text-ink-900 disabled:opacity-40"
        >
          {saving ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </div>
  );
}
