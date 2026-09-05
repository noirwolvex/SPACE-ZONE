export interface WebsiteRecord {
  id: string;
  title: string;
  slug: string;
  image?: string | null;
  gallery?: string[];
  summary?: string | null;
  description?: string | null;
  system?: string | null;
  details?: string | null;
  features?: string | null;
  targetAudience?: string | null;
  responsive?: string | null;
  age?: string | null;
  gameType?: string | null;
  price: number;
  currency: string;
  category?: string | null;
  websiteUrl: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export type WebsiteFormValues = {
  title: string;
  summary?: string;
  description?: string;
  system?: string;
  details?: string;
  features?: string;
  targetAudience?: string;
  responsive?: string;
  age?: string;
  customAge?: string;
  gameType?: string;
  customGameType?: string;
  category: string;
  customCategory?: string;
  price?: string;
  currency: string;
  websiteUrl: string;
  isPublished?: boolean;
};
