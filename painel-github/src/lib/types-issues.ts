/*
 * Seguro para o client — tipo espelhado de src/server/github/issues.ts.
 * Ver comentário em src/lib/types.ts sobre por que esses tipos são
 * duplicados em vez de importados diretamente.
 */
export interface IssueDTO {
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  labels: string[];
  authorLogin: string | null;
  htmlUrl: string;
  createdAt: string;
  commentsCount: number;
}
