/*
 * Seguro para o client — tipo espelhado de src/server/notes.ts.
 */
export interface NoteDTO {
  id: number;
  repoId: number | null;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}
