"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client";
import type { NoteDTO } from "@/lib/types-notes";

export function useNotes() {
  return useQuery({
    queryKey: ["notes"],
    queryFn: () => apiGet<{ notes: NoteDTO[] }>("/api/notes"),
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { repoId: number | null; title: string; body: string }) =>
      apiPost<{ note: NoteDTO }>("/api/notes", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notes"] }),
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title, body }: { id: number; title: string; body: string }) =>
      apiPatch<{ note: NoteDTO }>(`/api/notes/${id}`, { title, body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notes"] }),
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(`/api/notes/${id}`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notes"] }),
  });
}
