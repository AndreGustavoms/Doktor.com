import "server-only";
import { z } from "zod";

export const CreateReleaseSchema = z.object({
  tagName: z
    .string()
    .trim()
    .min(1, "A tag é obrigatória.")
    .max(255)
    .regex(/^[A-Za-z0-9._\-\/]+$/, "Tag contém caracteres inválidos."),
  name: z.string().max(255).optional(),
  body: z.string().max(65536).optional(),
  isPrerelease: z.boolean().optional(),
  targetCommitish: z.string().max(255).optional(),
});
