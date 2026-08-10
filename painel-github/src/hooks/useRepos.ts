"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { RepoDTO } from "@/lib/types";

interface ReposResponse {
  repos: RepoDTO[];
  fromCache: boolean;
  page: number;
  perPage: number;
}

export function useRepos(page: number = 1, perPage: number = 100) {
  return useQuery({
    queryKey: ["repos", page, perPage],
    queryFn: () => apiGet<ReposResponse>(`/api/repos?page=${page}&perPage=${perPage}`),
  });
}
