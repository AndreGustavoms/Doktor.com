import "server-only";
import { getDb } from "./db";
import { tags, repoTags } from "./db/schema";
import { eq, and } from "drizzle-orm";

/*
 * Dados só meus — nunca sobem pro GitHub (ver prompt original §6/§7.4).
 * Tags locais permitem organizar repos por critério próprio (ex:
 * "cliente-x", "arquivar-candidato"), independente de topics do GitHub.
 */

export interface TagDTO {
  id: number;
  name: string;
  color: string;
}

export function listTags(): TagDTO[] {
  return getDb().select().from(tags).all();
}

export function createTag(name: string, color: string): TagDTO {
  const result = getDb().insert(tags).values({ name, color }).returning().get();
  return result;
}

export function deleteTag(tagId: number): void {
  // repoTags tem onDelete: "cascade" no schema — apagar a tag já
  // remove as associações repo↔tag automaticamente.
  getDb().delete(tags).where(eq(tags.id, tagId)).run();
}

export function listRepoTagIds(repoId: number): number[] {
  return getDb()
    .select()
    .from(repoTags)
    .where(eq(repoTags.repoId, repoId))
    .all()
    .map((row) => row.tagId);
}

/**
 * Lê todas as associações repo→tags de uma vez — usado pela listagem de
 * repos para não fazer N+1 queries (uma por repo visível na tela).
 */
export function listAllRepoTagAssociations(): Record<number, number[]> {
  const rows = getDb().select().from(repoTags).all();
  const map: Record<number, number[]> = {};
  for (const row of rows) {
    (map[row.repoId] ??= []).push(row.tagId);
  }
  return map;
}

export function addTagToRepo(repoId: number, tagId: number): void {
  getDb().insert(repoTags).values({ repoId, tagId }).onConflictDoNothing().run();
}

export function removeTagFromRepo(repoId: number, tagId: number): void {
  getDb()
    .delete(repoTags)
    .where(and(eq(repoTags.repoId, repoId), eq(repoTags.tagId, tagId)))
    .run();
}
