import "server-only";
import { z } from "zod";

/*
 * A8 — validação de entrada e prevenção de SSRF. owner/repo seguem a
 * regex do prompt original §4.8: rejeita `..`, `/`, `\`, `%` e
 * caracteres de controle, que são os vetores de path traversal se esses
 * valores algum dia forem usados para montar um caminho de arquivo.
 */
const GITHUB_OWNER_REPO_REGEX = /^[A-Za-z0-9](?:[A-Za-z0-9._-]{0,98}[A-Za-z0-9])?$/;

export const RepoParamsSchema = z.object({
  owner: z.string().regex(GITHUB_OWNER_REPO_REGEX, "Nome de organização/usuário inválido."),
  name: z.string().regex(GITHUB_OWNER_REPO_REGEX, "Nome de repositório inválido."),
});

/**
 * per_page tem clamp em 100 (máximo da API REST do GitHub) — ver prompt
 * original §4.8. page não tem limite superior explícito (o GitHub retorna
 * vazio além do fim), mas coercion + min(1) impede valores negativos ou
 * não numéricos de chegarem à chamada real.
 */
export const RepoListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(30),
});
