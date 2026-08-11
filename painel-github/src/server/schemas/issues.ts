import "server-only";
import { z } from "zod";

export const IssueListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(30),
  state: z.enum(["open", "closed", "all"]).default("open"),
});

export const CreateIssueSchema = z.object({
  title: z.string().trim().min(1, "Título é obrigatório.").max(256, "Título muito longo."),
  body: z.string().max(65536, "Corpo muito longo.").optional(),
  labels: z.array(z.string().max(50)).max(20).optional(),
});

export const CommentIssueSchema = z.object({
  body: z.string().trim().min(1, "O comentário não pode ser vazio.").max(65536, "Comentário muito longo."),
});

export const UpdateIssueSchema = z.object({
  state: z.enum(["open", "closed"]).optional(),
  labels: z.array(z.string().max(50)).max(20).optional(),
});

export const IssueNumberParamsSchema = z.object({
  owner: z.string(),
  name: z.string(),
  number: z.coerce.number().int().positive(),
});
