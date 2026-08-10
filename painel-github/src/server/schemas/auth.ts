import "server-only";
import { z } from "zod";

/*
 * Ver docs/SECURITY.md §4.8 — validação de entrada em toda fronteira.
 * Mínimo de 12 caracteres reflete o medidor de força pedido no wizard
 * de setup (prompt original §7.1).
 */
export const SetupSchema = z.object({
  password: z.string().min(12, "A senha mestra precisa ter pelo menos 12 caracteres."),
  githubToken: z
    .string()
    .min(1, "Cole o token do GitHub.")
    .regex(
      /^(ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{22,})$/,
      "Formato de token inválido — esperado um fine-grained PAT (github_pat_...) ou classic PAT (ghp_...).",
    ),
});

export const UnlockSchema = z.object({
  password: z.string().min(1, "Digite a senha mestra."),
});
