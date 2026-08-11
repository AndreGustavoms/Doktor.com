import "server-only";
import { getOctokit } from "./client";
import { logAction } from "../activity-log";

interface RepoIdentity {
  owner: string;
  name: string;
}

export interface FileContent {
  content: string; // decodificado de base64
  sha: string; // exigido para a próxima escrita (evita conflito de edição concorrente)
  path: string;
}

/**
 * Lê o conteúdo atual de um arquivo — usado para exibir o diff antes de
 * confirmar a escrita (prompt original §4.13: "Antes de sobrescrever
 * arquivo via API, mostre um diff e exija confirmação") e para obter o
 * SHA que a escrita exige.
 */
export async function getFileContent(
  identity: RepoIdentity,
  path: string,
  branch?: string,
): Promise<FileContent | null> {
  const octokit = getOctokit();

  try {
    const response = await octokit.repos.getContent({
      owner: identity.owner,
      repo: identity.name,
      path,
      ref: branch,
    });

    const data = response.data;
    if (Array.isArray(data) || data.type !== "file" || !("content" in data)) {
      throw new Error("O caminho aponta para um diretório, não um arquivo.");
    }

    return {
      content: Buffer.from(data.content, "base64").toString("utf-8"),
      sha: data.sha,
      path,
    };
  } catch (err) {
    const status =
      typeof err === "object" && err !== null && "status" in err
        ? Number((err as { status: unknown }).status)
        : undefined;
    if (status === 404) return null;
    throw err;
  }
}

export interface CommitFileInput {
  path: string;
  content: string; // texto puro, não base64 — codificado aqui
  message: string;
  sha?: string; // ausente = criar arquivo novo; presente = atualizar
  branch?: string;
}

export interface CommitFileResult {
  commitSha: string;
  commitUrl: string;
}

/**
 * Commita uma mudança de arquivo. Mensagem de commit é obrigatória
 * (validada no schema Zod da rota, não aqui — ver
 * src/server/schemas/contents.ts). Toda chamada é registrada em
 * activity_log independente do resultado — ver docs/SECURITY.md,
 * ameaça A9.
 */
export async function commitFile(
  identity: RepoIdentity,
  input: CommitFileInput,
): Promise<CommitFileResult> {
  const octokit = getOctokit();
  const target = `${identity.owner}/${identity.name}:${input.path}`;

  try {
    const response = await octokit.repos.createOrUpdateFileContents({
      owner: identity.owner,
      repo: identity.name,
      path: input.path,
      message: input.message,
      content: Buffer.from(input.content, "utf-8").toString("base64"),
      sha: input.sha,
      branch: input.branch,
    });

    const commitSha = response.data.commit.sha;
    if (!commitSha) {
      throw new Error("Resposta do GitHub não incluiu o SHA do commit.");
    }

    logAction({
      action: "commit_file",
      target,
      payload: { message: input.message, branch: input.branch ?? "default" },
      result: "success",
    });

    return {
      commitSha,
      commitUrl: response.data.commit.html_url ?? "",
    };
  } catch (err) {
    logAction({
      action: "commit_file",
      target,
      payload: { message: input.message, branch: input.branch ?? "default" },
      result: "failure",
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
