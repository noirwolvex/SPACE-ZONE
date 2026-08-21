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
  /** Normalized age bucket used by the Books page filters. Null = unclassified. */
  ageGroup: string | null;
  category: string | null;
  summary: string | null;
  filename: string | null;
  size: number | null;
  price: number | null;
  currency: string;
  isFree: boolean;
  uploadedAt: string | Date | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  /** Present on admin listings, where the gallery is editable. */
  images?: BookImageView[];
}

/** Book plus the current viewer's entitlement, used by listing pages. */
export interface BookWithAccess extends BookRecord {
  coverImageUrl: string | null;
  isPurchased: boolean;
}

/**
 * One gallery preview image, already resolved to a signed URL.
 *
 * The stored `imageUrl` column holds a storage *reference*; it is signed on the
 * server and only the short-lived URL is sent to the browser.
 */
export interface BookImageView {
  id: string;
  url: string;
  sortOrder: number;
}

/** Everything the public book details page renders. Never includes `path`. */
export interface BookDetail extends BookRecord {
  coverImageUrl: string | null;
  images: BookImageView[];
  isPurchased: boolean;
}

export interface BookFormValues {
  title: string;
  author: string;
  targetAge: string;
  /** Empty string means "unclassified" and is stored as null. */
  ageGroup: string;
  category: string;
  summary: string;
  price: string;
  currency: string;
  isFree: boolean;
}
