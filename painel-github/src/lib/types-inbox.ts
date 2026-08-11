/*
 * Seguro para o client — tipo espelhado de src/server/github/inbox.ts.
 */
export interface InboxItem {
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  labels: string[];
  authorLogin: string | null;
  htmlUrl: string;
  createdAt: string;
  commentsCount: number;
  repoFullName: string;
  isRead: boolean;
}
