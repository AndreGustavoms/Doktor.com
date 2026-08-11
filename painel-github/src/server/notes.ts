import "server-only";
import { getDb } from "./db";
import { notes } from "./db/schema";
import { eq, desc } from "drizzle-orm";

/*
 * Notas em markdown, vinculadas ou não a um repositório — ficam SÓ no
 * SQLite, nunca sincronizam com o GitHub. Ver prompt original §7.7.
 */

export interface NoteDTO {
  id: number;
  repoId: number | null;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

function toDTO(row: {
  id: number;
  repoId: number | null;
  title: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}): NoteDTO {
  return {
    id: row.id,
    repoId: row.repoId,
    title: row.title,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function listNotes(repoId?: number | null): NoteDTO[] {
  const db = getDb();
  const rows =
    repoId === undefined
      ? db.select().from(notes).orderBy(desc(notes.updatedAt)).all()
      : db.select().from(notes).where(eq(notes.repoId, repoId as number)).orderBy(desc(notes.updatedAt)).all();
  return rows.map(toDTO);
}

export function createNote(input: { repoId: number | null; title: string; body: string }): NoteDTO {
  const now = new Date();
  const row = getDb()
    .insert(notes)
    .values({ repoId: input.repoId, title: input.title, body: input.body, createdAt: now, updatedAt: now })
    .returning()
    .get();
  return toDTO(row);
}

export function updateNote(id: number, input: { title: string; body: string }): NoteDTO | null {
  const row = getDb()
    .update(notes)
    .set({ title: input.title, body: input.body, updatedAt: new Date() })
    .where(eq(notes.id, id))
    .returning()
    .get();
  return row ? toDTO(row) : null;
}

export function deleteNote(id: number): void {
  getDb().delete(notes).where(eq(notes.id, id)).run();
}
