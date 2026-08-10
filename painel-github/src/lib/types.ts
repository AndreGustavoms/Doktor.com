/*
 * Seguro para o client — tipos espelhados dos DTOs de servidor (ver
 * src/server/github/dto.ts). Não importamos o DTO original aqui porque
 * ele vive em src/server/**, que components/hooks nunca podem importar
 * (regra de ouro da arquitetura — ver docs/ARCHITECTURE.md, reforçada
 * por lint). Mantenha isto em sincronia manualmente com o shape real do
 * DTO — são tipos puros, sem lógica, o custo de duplicação é baixo.
 */
export interface RepoDTO {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  isPrivate: boolean;
  isFork: boolean;
  isArchived: boolean;
  defaultBranch: string;
  language: string | null;
  topics: string[];
  stars: number;
  forks: number;
  openIssues: number;
  pushedAt: string | null;
  updatedAt: string | null;
  htmlUrl: string;
  hasReadme: boolean | null;
  hasLicense: boolean;
}

export interface CommitDTO {
  sha: string;
  message: string;
  authorName: string | null;
  authorDate: string | null;
  htmlUrl: string;
}
