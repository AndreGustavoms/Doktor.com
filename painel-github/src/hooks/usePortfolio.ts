"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "@/lib/api-client";
import type { PortfolioConfigDTO, PortfolioItemDTO, SocialLink } from "@/lib/types-portfolio";

export function usePortfolio() {
  return useQuery({
    queryKey: ["portfolio"],
    queryFn: () => apiGet<{ config: PortfolioConfigDTO; items: PortfolioItemDTO[] }>("/api/portfolio"),
  });
}

export function useUpdatePortfolioConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { headline: string; bio: string; socials: SocialLink[]; theme: string }) =>
      apiPut<{ config: PortfolioConfigDTO }>("/api/portfolio", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}

export function useAddPortfolioItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (repoId: number) => apiPost("/api/portfolio/items", { repoId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}

export function useRemovePortfolioItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (repoId: number) => apiDelete("/api/portfolio/items", { repoId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}

export function useUpdatePortfolioItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      repoId: number;
      customTitle: string | null;
      customBlurb: string | null;
      visible: boolean;
    }) => apiPatch("/api/portfolio/items", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}

export function useReorderPortfolioItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (repoIds: number[]) => apiPut("/api/portfolio/items", { repoIds }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}

export function useExportPortfolio() {
  return useMutation({
    mutationFn: () => apiPost<{ outDir: string; itemCount: number }>("/api/portfolio/export", {}),
  });
}
