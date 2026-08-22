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
  category: string;
  price?: string;
  currency: string;
  websiteUrl: string;
  isPublished?: boolean;
};
