/*
 * Seguro para o client — tipo espelhado de src/server/github/releases.ts.
 */
export interface ReleaseDTO {
  id: number;
  tagName: string;
  name: string | null;
  body: string | null;
  isDraft: boolean;
  isPrerelease: boolean;
  htmlUrl: string;
  publishedAt: string | null;
}
