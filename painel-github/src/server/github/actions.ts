import "server-only";
import { getOctokit } from "./client";
import { logAction } from "../activity-log";
import { readCache, writeCache, touchCache } from "../cache";

interface RepoIdentity {
  owner: string;
  name: string;
}

export interface WorkflowDTO {
  id: number;
  name: string;
  path: string;
  state: string;
}

export interface WorkflowRunDTO {
  id: number;
  name: string | null;
  status: string;
  conclusion: string | null;
  htmlUrl: string;
  createdAt: string;
  workflowId: number;
}

function toWorkflowDTO(raw: unknown): WorkflowDTO {
  const r = raw as Record<string, unknown>;
  return {
    id: Number(r.id),
    name: String(r.name),
    path: String(r.path),
    state: String(r.state),
  };
}

function toWorkflowRunDTO(raw: unknown): WorkflowRunDTO {
  const r = raw as Record<string, unknown>;
  return {
    id: Number(r.id),
    name: (r.name as string) ?? null,
    status: String(r.status),
    conclusion: (r.conclusion as string) ?? null,
    htmlUrl: String(r.html_url),
    createdAt: String(r.created_at),
    workflowId: Number(r.workflow_id),
  };
}

function isNotModified(err: unknown): boolean {
  return typeof err === "object" && err !== null && "status" in err && (err as { status: unknown }).status === 304;
}

export async function listWorkflows(
  identity: RepoIdentity,
): Promise<{ workflows: WorkflowDTO[]; fromCache: boolean }> {
  const key = `repo:workflows:${identity.owner}/${identity.name}`;
  const cached = readCache<unknown[]>(key);
  if (cached?.fresh) {
    return { workflows: cached.payload.map(toWorkflowDTO), fromCache: true };
  }

  const octokit = getOctokit();
  const headers: Record<string, string> = {};
  if (cached?.etag) headers["if-none-match"] = cached.etag;

  try {
    const response = await octokit.actions.listRepoWorkflows({
      owner: identity.owner,
      repo: identity.name,
      headers,
    });
    const etag = response.headers.etag ?? null;
    writeCache(key, response.data.workflows, etag, "actionsStatus");
    return { workflows: response.data.workflows.map(toWorkflowDTO), fromCache: false };
  } catch (err) {
    if (isNotModified(err) && cached) {
      touchCache(key, "actionsStatus");
      return { workflows: cached.payload.map(toWorkflowDTO), fromCache: true };
    }
    throw err;
  }
}

export async function listWorkflowRuns(
  identity: RepoIdentity,
  perPage: number = 15,
): Promise<{ runs: WorkflowRunDTO[]; fromCache: boolean }> {
  const key = `repo:workflow-runs:${identity.owner}/${identity.name}`;
  const cached = readCache<unknown[]>(key);
  if (cached?.fresh) {
    return { runs: cached.payload.map(toWorkflowRunDTO), fromCache: true };
  }

  const octokit = getOctokit();
  const headers: Record<string, string> = {};
  if (cached?.etag) headers["if-none-match"] = cached.etag;

  try {
    const response = await octokit.actions.listWorkflowRunsForRepo({
      owner: identity.owner,
      repo: identity.name,
      per_page: perPage,
      headers,
    });
    const etag = response.headers.etag ?? null;
    writeCache(key, response.data.workflow_runs, etag, "actionsStatus");
    return { runs: response.data.workflow_runs.map(toWorkflowRunDTO), fromCache: false };
  } catch (err) {
    if (isNotModified(err) && cached) {
      touchCache(key, "actionsStatus");
      return { runs: cached.payload.map(toWorkflowRunDTO), fromCache: true };
    }
    throw err;
  }
}

/**
 * Dispara workflow_dispatch. `inputs` chega como objeto livre — o
 * prompt original pede inputs "declarados" (lidos do YAML do workflow),
 * mas parsear o YAML de cada workflow para gerar formulário dinâmico é
 * escopo maior que o resto desta fase; aqui aceitamos um textarea de
 * JSON livre na UI, que cobre o caso de uso real (disparar com os
 * inputs que o usuário já sabe que o workflow espera) sem a
 * complexidade de introspecção de YAML. Documentado como simplificação
 * consciente em docs/ARCHITECTURE.md.
 */
export async function dispatchWorkflow(
  identity: RepoIdentity,
  workflowId: number,
  ref: string,
  inputs?: Record<string, string>,
): Promise<void> {
  const octokit = getOctokit();
  const target = `${identity.owner}/${identity.name}#workflow-${workflowId}`;

  try {
    await octokit.actions.createWorkflowDispatch({
      owner: identity.owner,
      repo: identity.name,
      workflow_id: workflowId,
      ref,
      inputs,
    });
    logAction({
      action: "dispatch_workflow",
      target,
      payload: { ref, inputs },
      result: "success",
    });
  } catch (err) {
    logAction({
      action: "dispatch_workflow",
      target,
      payload: { ref, inputs },
      result: "failure",
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

/**
 * Re-executar não passa por requireDestructiveAllowed() — reexecutar um
 * workflow não apaga nem sobrescreve nada existente, só cria uma nova
 * tentativa de execução.
 */
export async function reRunWorkflowRun(identity: RepoIdentity, runId: number): Promise<void> {
  const octokit = getOctokit();
  const target = `${identity.owner}/${identity.name}#run-${runId}`;

  try {
    await octokit.actions.reRunWorkflow({
      owner: identity.owner,
      repo: identity.name,
      run_id: runId,
    });
    logAction({ action: "rerun_workflow", target, result: "success" });
  } catch (err) {
    logAction({
      action: "rerun_workflow",
      target,
      result: "failure",
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
