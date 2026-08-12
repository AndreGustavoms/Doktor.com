import "server-only";
import { z } from "zod";

/*
 * Ver docs/SECURITY.md §4.8 — validação de entrada em toda fronteira.
 * Mínimo de 12 caracteres reflete o medidor de força pedido no wizard
 * de setup (prompt original §7.1).
 */
/*
 * Formatos aceitos — os mesmos que src/server/log.ts sabe redigir, para
 * que nenhum token entre no painel sem que o logger consiga escondê-lo
 * (ver docs/SECURITY.md, ameaça A7):
 *
 *   github_pat_  fine-grained PAT   — o caminho recomendado no setup
 *   ghp_         classic PAT
 *   gho_         OAuth — é o que o `gh` CLI emite; recusá-lo obrigava
 *                quem já tem o gh autenticado a criar um PAT só para o
 *                painel, sem ganho de segurança nenhum
 *   ghs_ / ghu_  GitHub App (server-to-server / user-to-server)
 *
 * A validação de formato é só uma primeira peneira contra erro de
 * digitação: quem decide se o token vale é o GET /user logo em seguida,
 * no Route Handler, antes de qualquer escrita.
 */
const TOKEN_FORMATS =
  /^(github_pat_[A-Za-z0-9_]{22,}|gh[pous]_[A-Za-z0-9]{36,})$/;

export const SetupSchema = z.object({
  password: z.string().min(12, "A senha mestra precisa ter pelo menos 12 caracteres."),
  githubToken: z
    .string()
    .min(1, "Cole o token do GitHub.")
    .regex(
      TOKEN_FORMATS,
      "Formato de token inválido — esperado github_pat_… (fine-grained), ghp_… (classic), gho_… (OAuth) ou ghs_/ghu_… (GitHub App).",
    ),
});

export const UnlockSchema = z.object({
  password: z.string().min(1, "Digite a senha mestra."),
});
