import type { Prisma } from "@prisma/client";

/**
 * Books page filtering.
 *
 * Single source of truth for turning URL search params into Prisma clauses.
 * The page stays a Server Component and all filtering happens in SQL, so the
 * client never receives rows it is not going to display.
 */

export const AGE_GROUPS = [
  { value: "ALL_AGES", label: "All Ages" },
  { value: "UNDER_6", label: "Under 6" },
  { value: "AGE_6_10", label: "6–10" },
  { value: "AGE_11_15", label: "11–15" },
  { value: "AGE_16_18", label: "16–18" },
  { value: "ADULTS", label: "Adults" },
] as const;

export type AgeGroupValue = (typeof AGE_GROUPS)[number]["value"];

const AGE_GROUP_VALUES = new Set<string>(AGE_GROUPS.map((group) => group.value));

export function ageGroupLabel(value: string | null | undefined) {
  if (!value) return null;
  return AGE_GROUPS.find((group) => group.value === value)?.label ?? null;
}

export const PRICE_FILTERS = [
  { value: "all", label: "All" },
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
] as const;

export type PriceFilter = (typeof PRICE_FILTERS)[number]["value"];

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "title_asc", label: "Alphabetical (A–Z)" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

const SORT_VALUES = new Set<string>(SORT_OPTIONS.map((option) => option.value));

/** Raw Next.js searchParams shape. */
export type RawSearchParams = Record<string, string | string[] | undefined>;

export type BookFilters = {
  q: string;
  categories: string[];
  ageGroups: AgeGroupValue[];
  price: PriceFilter;
  sort: SortValue;
};

export const DEFAULT_FILTERS: BookFilters = {
  q: "",
  categories: [],
  ageGroups: [],
  price: "all",
  sort: "newest",
};

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const values = Array.isArray(value) ? value : [value];
  // Support both repeated keys (?category=a&category=b) and CSV (?category=a,b).
  return values
    .flatMap((entry) => entry.split(","))
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function toSingle(value: string | string[] | undefined): string {
  if (!value) return "";
  return (Array.isArray(value) ? value[0] : value).trim();
}

/**
 * Parse and validate search params. Unknown or malformed values fall back to
 * defaults rather than reaching the database.
 */
export function parseBookFilters(params: RawSearchParams): BookFilters {
  const q = toSingle(params.q).slice(0, 100);

  const categories = Array.from(new Set(toArray(params.category))).slice(0, 25);

  const ageGroups = Array.from(new Set(toArray(params.age))).filter((value): value is AgeGroupValue =>
    AGE_GROUP_VALUES.has(value)
  );

  const rawPrice = toSingle(params.price).toLowerCase();
  const price: PriceFilter = rawPrice === "free" || rawPrice === "paid" ? rawPrice : "all";

  const rawSort = toSingle(params.sort).toLowerCase();
  const sort: SortValue = SORT_VALUES.has(rawSort) ? (rawSort as SortValue) : "newest";

  return { q, categories, ageGroups, price, sort };
}

/** True when anything is narrowing the result set. */
export function hasActiveFilters(filters: BookFilters) {
  return (
    filters.q !== "" ||
    filters.categories.length > 0 ||
    filters.ageGroups.length > 0 ||
    filters.price !== "all"
  );
}

/**
 * Build the Prisma `where` clause.
 *
 * Search spans title, author and category. `filename` is included as a fallback
 * because older books have no title and fall back to filename in the UI.
 */
export function buildBookWhere(filters: BookFilters): Prisma.BookWhereInput {
  const conditions: Prisma.BookWhereInput[] = [];

  if (filters.q) {
    conditions.push({
      OR: [
        { title: { contains: filters.q, mode: "insensitive" } },
        { author: { contains: filters.q, mode: "insensitive" } },
        { category: { contains: filters.q, mode: "insensitive" } },
        { filename: { contains: filters.q, mode: "insensitive" } },
      ],
    });
  }

  if (filters.categories.length > 0) {
    conditions.push({ category: { in: filters.categories } });
  }

  if (filters.ageGroups.length > 0) {
    // "All Ages" also matches books with no age classification, so unclassified
    // titles stay discoverable instead of silently disappearing.
    const includesAllAges = filters.ageGroups.includes("ALL_AGES");
    conditions.push({
      OR: [
        { ageGroup: { in: filters.ageGroups } },
        ...(includesAllAges ? [{ ageGroup: null } as Prisma.BookWhereInput] : []),
      ],
    });
  }

  if (filters.price === "free") {
    conditions.push({ isFree: true });
  } else if (filters.price === "paid") {
    conditions.push({ isFree: false });
  }

  return conditions.length > 0 ? { AND: conditions } : {};
}

/**
 * Build the Prisma `orderBy` clause.
 *
 * Free books store `price = NULL`, so price sorts must place nulls explicitly:
 * cheapest-first puts free books at the top, dearest-first puts them last.
 */
export function buildBookOrderBy(
  sort: SortValue
): Prisma.BookOrderByWithRelationInput | Prisma.BookOrderByWithRelationInput[] {
  switch (sort) {
    case "oldest":
      return { uploadedAt: "asc" };
    case "price_asc":
      return [{ price: { sort: "asc", nulls: "first" } }, { uploadedAt: "desc" }];
    case "price_desc":
      return [{ price: { sort: "desc", nulls: "last" } }, { uploadedAt: "desc" }];
    case "title_asc":
      return [{ title: { sort: "asc", nulls: "last" } }, { filename: "asc" }];
    case "newest":
    default:
      return { uploadedAt: "desc" };
  }
}

/**
 * Serialize filters back into a query string, dropping defaults so URLs stay
 * clean and shareable.
 */
export function buildBooksQueryString(filters: Partial<BookFilters>): string {
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  if (filters.categories?.length) params.set("category", filters.categories.join(","));
  if (filters.ageGroups?.length) params.set("age", filters.ageGroups.join(","));
  if (filters.price && filters.price !== "all") params.set("price", filters.price);
  if (filters.sort && filters.sort !== "newest") params.set("sort", filters.sort);

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}
