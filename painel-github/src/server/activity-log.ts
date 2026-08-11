import "server-only";
import { getDb } from "./db";
import { activityLog } from "./db/schema";
import { desc } from "drizzle-orm";

/*
 * A9 — ação destrutiva por engano. Toda ação destrutiva é gravada aqui
 * com timestamp, ação, alvo e resultado — ver prompt original §4.13.
 * Também usado para ações de escrita não-destrutivas relevantes
 * (commit de arquivo, criação de issue/release) para auditoria geral,
 * não só o caminho perigoso.
 */

interface LogActionInput {
  action: string;
  target: string;
  payload?: unknown;
  result: "success" | "failure";
  error?: string;
}

export function logAction(input: LogActionInput): void {
  getDb()
    .insert(activityLog)
    .values({
      at: new Date(),
      action: input.action,
      target: input.target,
      payload: input.payload ? JSON.stringify(input.payload) : null,
      result: input.result,
      error: input.error ?? null,
    })
    .run();
}

export interface ActivityLogEntry {
  id: number;
  at: string;
  action: string;
  target: string;
  result: "success" | "failure";
  error: string | null;
}

export function listRecentActivity(limit: number = 50): ActivityLogEntry[] {
  return getDb()
    .select()
    .from(activityLog)
    .orderBy(desc(activityLog.at))
    .limit(limit)
    .all()
    .map((row) => ({
      id: row.id,
      at: row.at.toISOString(),
      action: row.action,
      target: row.target,
      result: row.result,
      error: row.error,
    }));
}
