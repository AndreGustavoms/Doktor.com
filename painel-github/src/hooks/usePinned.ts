"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api-client";

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
    mutationFn: async ({ repoId, pin }: { repoId: number; pin: boolean }) => {
      if (pin) {
        return apiPost("/api/pinned", { repoId });
      }
      // DELETE via fetch direto — apiPost só cobre POST (ver src/lib/api-client.ts).
      const response = await fetch("/api/pinned", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "X-Local-Client": "1" },
        body: JSON.stringify({ repoId }),
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error("Falha ao desfixar repositório.");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pinned"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}
