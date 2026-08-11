import "server-only";
import { z } from "zod";

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

export const CreateTagSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório.").max(50, "Nome muito longo."),
  color: z.string().regex(HEX_COLOR_REGEX, "Cor precisa ser um hex válido, ex: #4CC9F0."),
});

export const TagRepoAssociationSchema = z.object({
  repoId: z.number().int().positive(),
  tagId: z.number().int().positive(),
});
