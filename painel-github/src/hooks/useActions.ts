"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api-client";
import type { WorkflowDTO, WorkflowRunDTO } from "@/lib/types-actions";

export function useActions(owner: string, name: string) {
  return useQuery({
    queryKey: ["actions", owner, name],
    queryFn: () =>
      apiGet<{ workflows: WorkflowDTO[]; runs: WorkflowRunDTO[] }>(
        `/api/repos/${owner}/${name}/actions`,
      ),
  });
}

export function useDispatchWorkflow(owner: string, name: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { workflowId: number; ref: string; inputs?: Record<string, string> }) =>
      apiPost(`/api/repos/${owner}/${name}/actions/dispatch`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actions", owner, name] });
    },
  });
}

export function useRerunWorkflow(owner: string, name: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (runId: number) => apiPost(`/api/repos/${owner}/${name}/actions/rerun`, { runId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actions", owner, name] });
    },
  });
}
