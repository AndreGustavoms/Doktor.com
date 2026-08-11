import "server-only";
import { getDb } from "./db";
import { portfolioConfig, portfolioItems } from "./db/schema";
import { eq, asc } from "drizzle-orm";

/*
 * Camada pessoal do portfólio — vitrine pública gerada a partir de
 * repositórios que eu escolher (ver prompt original §7.8). Config e
 * seleção de itens vivem só no SQLite local; nada disso é enviado ao
 * GitHub. A exportação estática (src/server/portfolio-export.ts) é o
 * único lugar onde esses dados "saem" do painel.
 */

export interface SocialLink {
  platform: string;
  url: string;
}

export interface PortfolioConfigDTO {
  headline: string;
  bio: string;
  socials: SocialLink[];
  theme: string;
  updatedAt: number;
}

export interface PortfolioItemDTO {
  repoId: number;
  position: number;
  customTitle: string | null;
  customBlurb: string | null;
  coverPath: string | null;
  visible: boolean;
}

const DEFAULT_CONFIG: Omit<PortfolioConfigDTO, "updatedAt"> = {
  headline: "Meu portfólio",
  bio: "",
  socials: [],
  theme: "blueprint",
};

export function getPortfolioConfig(): PortfolioConfigDTO {
  const row = getDb().select().from(portfolioConfig).limit(1).get();
  if (!row) {
    return { ...DEFAULT_CONFIG, updatedAt: 0 };
  }
  return {
    headline: row.headline,
    bio: row.bio,
    socials: JSON.parse(row.socials) as SocialLink[],
    theme: row.theme,
    updatedAt: row.updatedAt.getTime(),
  };
}

export function updatePortfolioConfig(input: {
  headline: string;
  bio: string;
  socials: SocialLink[];
  theme: string;
}): PortfolioConfigDTO {
  const db = getDb();
  const existing = db.select().from(portfolioConfig).limit(1).get();
  const now = new Date();
  const values = {
    headline: input.headline,
    bio: input.bio,
    socials: JSON.stringify(input.socials),
    theme: input.theme,
    updatedAt: now,
  };

  if (existing) {
    db.update(portfolioConfig).set(values).where(eq(portfolioConfig.id, existing.id)).run();
  } else {
    db.insert(portfolioConfig).values(values).run();
  }

  return { ...input, updatedAt: now.getTime() };
}

export function listPortfolioItems(): PortfolioItemDTO[] {
  return getDb()
    .select()
    .from(portfolioItems)
    .orderBy(asc(portfolioItems.position))
    .all();
}

export function addPortfolioItem(repoId: number): void {
  const db = getDb();
  const existing = db.select().from(portfolioItems).all();
  const nextPosition = existing.length > 0 ? Math.max(...existing.map((r) => r.position)) + 1 : 0;

  db.insert(portfolioItems)
    .values({ repoId, position: nextPosition, visible: true })
    .onConflictDoNothing()
    .run();
}

export function removePortfolioItem(repoId: number): void {
  getDb().delete(portfolioItems).where(eq(portfolioItems.repoId, repoId)).run();
}

export function updatePortfolioItem(input: {
  repoId: number;
  customTitle: string | null;
  customBlurb: string | null;
  visible: boolean;
}): void {
  getDb()
    .update(portfolioItems)
    .set({
      customTitle: input.customTitle,
      customBlurb: input.customBlurb,
      visible: input.visible,
    })
    .where(eq(portfolioItems.repoId, input.repoId))
    .run();
}

/**
 * Reordena todos os itens de uma vez a partir da ordem de `repoIds` —
 * usado pelo drag-and-drop do editor. Itens do banco que não aparecem em
 * `repoIds` mantêm sua position atual (não deveria acontecer no fluxo
 * normal da UI, mas evita perder dado silenciosamente se a lista do
 * client estiver desatualizada).
 */
export function reorderPortfolioItems(repoIds: number[]): void {
  getDb().transaction((tx) => {
    repoIds.forEach((repoId, index) => {
      tx.update(portfolioItems)
        .set({ position: index })
        .where(eq(portfolioItems.repoId, repoId))
        .run();
    });
  });
}
