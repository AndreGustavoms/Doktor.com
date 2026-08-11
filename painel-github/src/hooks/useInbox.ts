"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api-client";
import type { InboxItem } from "@/lib/types-inbox";

export function useInbox() {
  return useQuery({
    queryKey: ["inbox"],
    queryFn: () => apiGet<{ items: InboxItem[] }>("/api/issues/inbox"),
    staleTime: 60_000,
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { kind: "issue" | "pr"; repoFullName: string; number: number; read: boolean }) =>
      apiPost("/api/read-state", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inbox"] }),
  });
}
