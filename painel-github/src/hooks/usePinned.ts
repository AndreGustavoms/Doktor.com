"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiDelete } from "@/lib/api-client";

interface PinnedResponse {
  repoIds: number[];
}

export function usePinnedIds() {
  return useQuery({
    queryKey: ["pinned"],
    queryFn: () => apiGet<PinnedResponse>("/api/pinned"),
  });
}

export function useTogglePin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ repoId, pin }: { repoId: number; pin: boolean }) =>
      pin ? apiPost("/api/pinned", { repoId }) : apiDelete("/api/pinned", { repoId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pinned"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}
