import "server-only";
import { z } from "zod";

export const CreateNoteSchema = z.object({
  repoId: z.number().int().positive().nullable(),
  title: z.string().trim().min(1, "Título é obrigatório.").max(200, "Título muito longo."),
  body: z.string().max(100_000, "Nota muito longa."),
});

export const UpdateNoteSchema = z.object({
  title: z.string().trim().min(1, "Título é obrigatório.").max(200, "Título muito longo."),
  body: z.string().max(100_000, "Nota muito longa."),
});
