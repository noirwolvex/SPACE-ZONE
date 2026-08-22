/**
 * Book shape sent to the browser.
 *
 * Deliberately has no `path`/storage field: the client never receives a file
 * location. Reads go through /api/books/[id]/access, which authorizes first.
 */
export interface BookRecord {
  id: string;
  title: string | null;
  author: string | null;
  targetAge: string | null;
  ageGroup: string | null;
  category: string | null;
  summary: string | null;
  features: string | null;
  targetAudience: string | null;
  bookSize: string | null;
  pageCount: number | null;
  seriesParts: string | null;
  filename: string | null;
  size: number | null;
  price: number | null;
  currency: string;
  isFree: boolean;
  uploadedAt: string | Date | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  images?: BookImageView[];
}

export interface BookWithAccess extends BookRecord {
  coverImageUrl: string | null;
  isPurchased: boolean;
}

export interface BookImageView {
  id: string;
  url: string;
  sortOrder: number;
}

export interface BookDetail extends BookRecord {
  coverImageUrl: string | null;
  images: BookImageView[];
  isPurchased: boolean;
}

export interface BookFormValues {
  title: string;
  author: string;
  targetAge: string;
  ageGroup: string;
  category: string;
  summary: string;
  features: string;
  targetAudience: string;
  bookSize: string;
  pageCount: string;
  seriesParts: string;
  price: string;
  currency: string;
  isFree: boolean;
}
