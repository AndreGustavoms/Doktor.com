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
