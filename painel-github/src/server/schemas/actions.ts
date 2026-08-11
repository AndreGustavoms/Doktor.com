import "server-only";
import { z } from "zod";

export const DispatchWorkflowSchema = z.object({
  workflowId: z.number().int().positive(),
  ref: z.string().trim().min(1, "A branch/tag é obrigatória.").max(255),
  inputs: z.record(z.string(), z.string()).optional(),
});

export const RerunWorkflowSchema = z.object({
  runId: z.number().int().positive(),
});
