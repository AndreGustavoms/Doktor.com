/*
 * Seguro para o client — tipos espelhados de src/server/github/actions.ts.
 */
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
