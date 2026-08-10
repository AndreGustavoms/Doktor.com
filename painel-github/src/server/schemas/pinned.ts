import "server-only";
import { z } from "zod";

export const PinnedBodySchema = z.object({
  repoId: z.number().int().positive(),
});
