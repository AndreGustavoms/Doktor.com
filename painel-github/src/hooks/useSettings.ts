"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiGet, apiPost, ApiError } from "@/lib/api-client";

export interface ActivityLogEntry {
  id: number;
  at: string;
  action: string;
  target: string;
  result: "success" | "failure";
  error: string | null;
}

export function useActivityLog() {
  return useQuery({
    queryKey: ["activity-log"],
    queryFn: () => apiGet<{ activity: ActivityLogEntry[] }>("/api/settings/activity"),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) =>
      apiPost("/api/settings/change-password", input),
  });
}

export function useClearCache() {
  return useMutation({
    mutationFn: () => apiPost("/api/settings/clear-cache", {}),
  });
}

export { ApiError };
