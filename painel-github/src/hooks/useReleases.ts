"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api-client";
import type { ReleaseDTO } from "@/lib/types-releases";

export function useReleases(owner: string, name: string) {
  return useQuery({
    queryKey: ["releases", owner, name],
    queryFn: () => apiGet<{ releases: ReleaseDTO[] }>(`/api/repos/${owner}/${name}/releases`),
  });
}

export function useCreateRelease(owner: string, name: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { tagName: string; name?: string; body?: string; isPrerelease?: boolean }) =>
      apiPost<{ release: ReleaseDTO }>(`/api/repos/${owner}/${name}/releases`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["releases", owner, name] });
    },
  });
}
