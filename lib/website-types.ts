export interface WebsiteRecord {
  id: string;
  title: string;
  slug: string;
  image?: string | null;
  summary?: string | null;
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
  category: string;
  price?: string;
  currency: string;
  websiteUrl: string;
  isPublished?: boolean;
};
