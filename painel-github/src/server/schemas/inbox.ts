import "server-only";
import { z } from "zod";

export const MarkReadSchema = z.object({
  kind: z.enum(["issue", "pr"]),
  repoFullName: z.string().regex(/^[^/]+\/[^/]+$/, "repoFullName precisa ser owner/repo."),
  number: z.number().int().positive(),
  read: z.boolean(),
});
