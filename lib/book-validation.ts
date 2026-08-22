import { z } from "zod";

export const BOOK_CATEGORIES = [
  "Early Learning",
  "Storybook",
  "Science",
  "Adventure",
  "Nature",
  "Creative",
  "Language",
  "Programming",
  "Business",
  "Design",
  "AI",
  "Marketing",
  "Finance",
  "Education",
  "Technology",
  "Health",
  "Other",
] as const;

export const BOOK_CURRENCIES = ["BHD", "USD", "EUR"] as const;
export type BookCurrency = (typeof BOOK_CURRENCIES)[number];
export type BookAccessType = "FREE" | "PAID";

function toBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return ["true", "on", "1", "yes", "free"].includes(value.trim().toLowerCase());
  return false;
}

export const bookMetadataSchema = z
  .object({
    title: z.string().trim().min(1, "Book title is required."),
    author: z.string().trim().optional().or(z.literal("")),
    targetAge: z.string().trim().optional().or(z.literal("")),
    ageGroup: z.string().trim().optional().or(z.literal("")),
    category: z.string().trim().min(1, "Book category is required."),
    summary: z.string().trim().optional().or(z.literal("")),
    features: z.string().trim().optional().or(z.literal("")),
    targetAudience: z.string().trim().optional().or(z.literal("")),
    bookSize: z.string().trim().optional().or(z.literal("")),
    pageCount: z.union([z.string(), z.number(), z.null(), z.undefined()]),
    seriesParts: z.string().trim().optional().or(z.literal("")),
    price: z.union([z.string(), z.number(), z.null(), z.undefined()]),
    currency: z.string().trim().optional().or(z.literal("")),
    isFree: z.unknown().transform(toBoolean),
  })
  .transform((value, ctx) => {
    const isFree = value.isFree;
    const currency = (value.currency || "BHD").toUpperCase();
    const ageGroup = value.ageGroup ? value.ageGroup : null;

    if (!BOOK_CURRENCIES.includes(currency as BookCurrency)) {
      ctx.addIssue({ code: "custom", path: ["currency"], message: `Currency must be one of: ${BOOK_CURRENCIES.join(", ")}.` });
      return z.NEVER;
    }

    const rawPageCount = typeof value.pageCount === "string" ? value.pageCount.trim() : value.pageCount;
    let pageCount: number | null = null;
    if (rawPageCount !== "" && rawPageCount !== null && rawPageCount !== undefined) {
      const parsed = Number(rawPageCount);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100000) {
        ctx.addIssue({ code: "custom", path: ["pageCount"], message: "Page count must be a whole number between 1 and 100000." });
        return z.NEVER;
      }
      pageCount = parsed;
    }

    if (isFree) {
      return { ...value, isFree: true as const, price: null, currency, ageGroup, pageCount };
    }

    const rawPrice = typeof value.price === "string" ? value.price.trim() : value.price;
    if (rawPrice === "" || rawPrice === null || rawPrice === undefined) {
      ctx.addIssue({ code: "custom", path: ["price"], message: "Price is required for paid books." });
      return z.NEVER;
    }
    const price = Number(rawPrice);
    if (!Number.isFinite(price)) {
      ctx.addIssue({ code: "custom", path: ["price"], message: "Price must be a valid number." });
      return z.NEVER;
    }
    if (price <= 0) {
      ctx.addIssue({ code: "custom", path: ["price"], message: "Paid books must have a price greater than 0." });
      return z.NEVER;
    }
    if (Number(price.toFixed(3)) !== price) {
      ctx.addIssue({ code: "custom", path: ["price"], message: "Price supports at most 3 decimal places." });
      return z.NEVER;
    }
    if (price > 100000) {
      ctx.addIssue({ code: "custom", path: ["price"], message: "Price is unrealistically high." });
      return z.NEVER;
    }

    return { ...value, isFree: false as const, price, currency, ageGroup, pageCount };
  });

export type BookMetadataInput = z.infer<typeof bookMetadataSchema>;

export const MIN_BOOK_PREVIEW_IMAGES = 5;
export const MAX_BOOK_PREVIEW_IMAGES = 7;
export const MAX_BOOK_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_BOOK_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"] as const;

export const bookGalleryPlanSchema = z.array(
  z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("existing"), id: z.string().trim().min(1) }),
    z.object({ kind: z.literal("new"), fileIndex: z.number().int().min(0) }),
  ])
).max(MAX_BOOK_PREVIEW_IMAGES, `A book can have at most ${MAX_BOOK_PREVIEW_IMAGES} preview images.`);

export type BookGalleryPlan = z.infer<typeof bookGalleryPlanSchema>;

export function validateGalleryCount(count: number, options: { required: boolean }): string | null {
  if (count === 0) return options.required ? `Please add between ${MIN_BOOK_PREVIEW_IMAGES} and ${MAX_BOOK_PREVIEW_IMAGES} preview images.` : null;
  if (count < MIN_BOOK_PREVIEW_IMAGES) return `A book needs at least ${MIN_BOOK_PREVIEW_IMAGES} preview images (currently ${count}).`;
  if (count > MAX_BOOK_PREVIEW_IMAGES) return `A book can have at most ${MAX_BOOK_PREVIEW_IMAGES} preview images (currently ${count}).`;
  return null;
}

export function validateBookImageFile(file: File): string | null {
  if (!ACCEPTED_BOOK_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_BOOK_IMAGE_TYPES)[number])) return `"${file.name}" is not a supported image type (JPEG, PNG, WebP, AVIF or GIF).`;
  if (file.size > MAX_BOOK_IMAGE_SIZE_BYTES) return `"${file.name}" is larger than 5MB.`;
  return null;
}
