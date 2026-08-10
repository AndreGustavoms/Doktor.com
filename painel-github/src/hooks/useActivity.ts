"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { RepoActivity } from "@/app/api/stats/activity/route";

export function useActivity() {
  return useQuery({
    queryKey: ["activity"],
    queryFn: () => apiGet<{ repos: RepoActivity[] }>("/api/stats/activity"),
  });
}
