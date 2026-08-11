import "server-only";
import { z } from "zod";

/*
 * A8 — validação de entrada. path é normalizado e rejeitado se tentar
 * escapar do diretório do repositório (path traversal). Ver prompt
 * original §4.8.
 */
const SAFE_PATH_REGEX = /^[A-Za-z0-9._\-\/]+$/;

export const FilePathQuerySchema = z.object({
  path: z
    .string()
    .min(1, "Caminho do arquivo é obrigatório.")
    .regex(SAFE_PATH_REGEX, "Caminho de arquivo contém caracteres inválidos.")
    .refine((p) => !p.includes(".."), "Caminho não pode conter '..'.")
    .refine((p) => !p.startsWith("/"), "Caminho não pode começar com '/'."),
  branch: z.string().min(1).max(255).optional(),
});

export const CommitFileBodySchema = z.object({
  path: z
    .string()
    .min(1, "Caminho do arquivo é obrigatório.")
    .regex(SAFE_PATH_REGEX, "Caminho de arquivo contém caracteres inválidos.")
    .refine((p) => !p.includes(".."), "Caminho não pode conter '..'.")
    .refine((p) => !p.startsWith("/"), "Caminho não pode começar com '/'."),
  content: z.string(),
  message: z
    .string()
    .trim()
    .min(1, "A mensagem de commit é obrigatória.")
    .max(500, "Mensagem de commit muito longa (máximo 500 caracteres)."),
  sha: z.string().optional(),
  branch: z.string().min(1).max(255).optional(),
});
