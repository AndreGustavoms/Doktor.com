import "server-only";
import { z } from "zod";

const SocialLinkSchema = z.object({
  platform: z.string().trim().min(1).max(40),
  url: z.string().trim().url("URL inválida."),
});

export const UpdatePortfolioConfigSchema = z.object({
  headline: z.string().trim().min(1, "Headline é obrigatória.").max(200),
  bio: z.string().trim().max(2000),
  socials: z.array(SocialLinkSchema).max(20),
  theme: z.enum(["blueprint", "light"]),
});

export const UpdatePortfolioItemSchema = z.object({
  repoId: z.number().int().positive(),
  customTitle: z.string().trim().max(200).nullable(),
  customBlurb: z.string().trim().max(500).nullable(),
  visible: z.boolean(),
});

export const ReorderPortfolioItemsSchema = z.object({
  repoIds: z.array(z.number().int().positive()).min(1),
});

export const AddPortfolioItemSchema = z.object({
  repoId: z.number().int().positive(),
});
