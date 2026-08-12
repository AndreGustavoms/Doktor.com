"use client";

import { useState } from "react";
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from "@/hooks/useNotes";
import { LockButton } from "@/components/layout/LockButton";
import { relativeTime } from "@/lib/format";
import type { NoteDTO } from "@/lib/types-notes";
import { SkeletonLista } from "@/components/feedback/Skeleton";

/**
 * Notas locais — ficam SÓ no SQLite, nunca sincronizam com o GitHub.
 * Selo "Local" visível em toda nota, e estado vazio explica isso — ver
 * prompt original §7.7.
 */
export default function NotesPage() {
  const { data, isLoading } = useNotes();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  return (
    <main className="mx-auto max-w-360 px-4 py-5 sm:px-6 md:px-8 md:py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-(family-name:--font-display) text-3xl font-bold text-chalk">
            Notas
          </h1>
          <p className="font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim">
            Nunca sobem pro GitHub
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="rounded border border-ink-600 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim hover:border-blueprint hover:text-chalk"
          >
            Nova nota
          </button>
          <LockButton />
        </div>
      </div>

      {creating && <NoteForm onDone={() => setCreating(false)} />}

      {isLoading && <SkeletonLista itens={3} />}

      {!isLoading && data?.notes.length === 0 && !creating && (
        <div className="rounded border border-ink-700 bg-ink-800 p-8 text-center">
          <p className="text-sm text-chalk-dim">
            Nenhuma nota ainda. Notas ficam só no seu banco local — nunca sincronizam com o
            GitHub, nem aparecem em nenhum repositório remoto.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.notes.map((note) =>
          editingId === note.id ? (
            <NoteForm key={note.id} existing={note} onDone={() => setEditingId(null)} />
          ) : (
            <NoteCard key={note.id} note={note} onEdit={() => setEditingId(note.id)} />
          ),
        )}
      </div>
    </main>
  );
}

function NoteCard({ note, onEdit }: { note: NoteDTO; onEdit: () => void }) {
  const deleteNote = useDeleteNote();

  return (
    <div className="flex flex-col gap-2 rounded border border-ink-700 bg-ink-800 p-4">
      <div className="flex items-start justify-between gap-2">
        <h2 className="truncate text-sm font-medium text-chalk">{note.title}</h2>
        <span className="shrink-0 rounded border border-blueprint/30 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-blueprint">
          Local
        </span>
      </div>
      <p className="line-clamp-4 whitespace-pre-wrap text-sm text-chalk-dim">{note.body}</p>
      <div className="mt-auto flex items-center justify-between pt-2">
        <span className="font-mono text-xs text-chalk-dim">
          {relativeTime(note.updatedAt)}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="font-mono text-xs text-chalk-dim hover:text-chalk"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => deleteNote.mutate(note.id)}
            disabled={deleteNote.isPending}
            className="font-mono text-xs text-chalk-dim hover:text-coral disabled:opacity-40"
          >
            Apagar
          </button>
        </div>
      </div>
    </div>
  );
}

function NoteForm({ existing, onDone }: { existing?: NoteDTO; onDone: () => void }) {
  const [title, setTitle] = useState(existing?.title ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const isEditing = existing !== undefined;
  const pending = createNote.isPending || updateNote.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isEditing) {
      await updateNote.mutateAsync({ id: existing.id, title, body });
    } else {
      await createNote.mutateAsync({ repoId: null, title, body });
    }
    onDone();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 flex flex-col gap-2 rounded border border-blueprint/40 bg-ink-800 p-4"
    >
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título"
        required
        className="rounded border border-ink-600 bg-ink-900 px-3 py-1.5 text-sm text-chalk outline-none focus-visible:border-blueprint"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Escreva em markdown…"
        rows={6}
        className="rounded border border-ink-600 bg-ink-900 px-3 py-1.5 font-mono text-sm text-chalk outline-none focus-visible:border-blueprint"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onDone}
          className="rounded border border-ink-600 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending || !title.trim()}
          className="rounded bg-blueprint px-3 py-1.5 font-mono text-xs uppercase tracking-[0.08em] text-ink-900 disabled:opacity-40"
        >
          {pending ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}
