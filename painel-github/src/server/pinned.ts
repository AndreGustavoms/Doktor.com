import "server-only";
import { getDb } from "./db";
import { pinned } from "./db/schema";
import { eq, asc } from "drizzle-orm";

/*
 * Dados só meus — nunca sobem pro GitHub (ver prompt original §7.7,
 * schema em §6). Vive inteiramente no SQLite local.
 */

export function listPinnedRepoIds(): number[] {
  return getDb()
    .select()
    .from(pinned)
    .orderBy(asc(pinned.position))
    .all()
    .map((row) => row.repoId);
}

export function isPinned(repoId: number): boolean {
  const row = getDb().select().from(pinned).where(eq(pinned.repoId, repoId)).get();
  return row !== undefined;
}

export function pinRepo(repoId: number): void {
  const db = getDb();
  const existing = db.select().from(pinned).all();
  const nextPosition = existing.length > 0 ? Math.max(...existing.map((r) => r.position)) + 1 : 0;

  db.insert(pinned)
    .values({ repoId, position: nextPosition, pinnedAt: new Date() })
    .onConflictDoNothing()
    .run();
}

export function unpinRepo(repoId: number): void {
  getDb().delete(pinned).where(eq(pinned.repoId, repoId)).run();
}
