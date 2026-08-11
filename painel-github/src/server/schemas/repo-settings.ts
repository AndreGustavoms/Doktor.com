import "server-only";
import { z } from "zod";

export const UpdateRepoSettingsSchema = z.object({
  description: z.string().max(350, "Descrição muito longa (máximo 350 caracteres).").optional(),
  homepage: z.string().url("URL inválida.").or(z.literal("")).optional(),
  hasIssues: z.boolean().optional(),
  hasWiki: z.boolean().optional(),
  hasProjects: z.boolean().optional(),
});

const TOPIC_REGEX = /^[a-z0-9][a-z0-9-]{0,49}$/;

export const UpdateRepoTopicsSchema = z.object({
  topics: z
    .array(z.string().regex(TOPIC_REGEX, "Topic inválido — use minúsculas, números e hífen."))
    .max(20, "Máximo de 20 topics."),
});

export const SetVisibilitySchema = z.object({
  isPrivate: z.boolean(),
  confirmRepoName: z.string().min(1, "Digite o nome completo do repositório para confirmar."),
});
