"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch } from "@/lib/api-client";
import type { IssueDTO } from "@/lib/types-issues";

export function useIssues(owner: string, name: string, state: "open" | "closed" | "all" = "open") {
  return useQuery({
    queryKey: ["issues", owner, name, state],
    queryFn: () =>
      apiGet<{ issues: IssueDTO[] }>(`/api/repos/${owner}/${name}/issues?state=${state}`),
  });
}

export function useCreateIssue(owner: string, name: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; body?: string }) =>
      apiPost<{ issue: IssueDTO }>(`/api/repos/${owner}/${name}/issues`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues", owner, name] });
    },
  });
}

export function useCommentIssue(owner: string, name: string) {
  return useMutation({
    mutationFn: ({ number, body }: { number: number; body: string }) =>
      apiPost(`/api/repos/${owner}/${name}/issues/${number}/comments`, { body }),
  });
}

export function useSetIssueState(owner: string, name: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ number, state }: { number: number; state: "open" | "closed" }) =>
      apiPatch(`/api/repos/${owner}/${name}/issues/${number}`, { state }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues", owner, name] });
    },
  });
}
