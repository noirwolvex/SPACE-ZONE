import { z } from "zod";

/**
 * Categories offered to admins when creating a book.
 *
 * The children's-book categories are kept because existing titles use them.
 * The public Books page derives its filter chips from categories actually
 * present in the database, so unused entries here never show up as dead filters.
 */
export const BOOK_CATEGORIES = [
  // Existing children's-book categories — in use by current titles.
  "Early Learning",
  "Storybook",
  "Science",
  "Adventure",
  "Nature",
  "Creative",
  "Language",
  // Broader catalogue categories.
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

/** Coerce checkbox/radio/string payloads into a boolean. */
function toBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return ["true", "on", "1", "yes", "free"].includes(value.trim().toLowerCase());
  return false;
}

/**
 * Book metadata with the free/paid pricing contract enforced server-side:
 *   free -> price must be null
 *   paid -> price required, numeric and > 0, with a supported currency
 */
export const bookMetadataSchema = z
  .object({
    title: z.string().trim().min(1, "Book title is required."),
    author: z.string().trim().optional().or(z.literal("")),
    targetAge: z.string().trim().optional().or(z.literal("")),
    ageGroup: z.string().trim().optional().or(z.literal("")),
    category: z.string().trim().min(1, "Book category is required."),
    summary: z.string().trim().optional().or(z.literal("")),
    price: z.union([z.string(), z.number(), z.null(), z.undefined()]),
    currency: z.string().trim().optional().or(z.literal("")),
    isFree: z.unknown().transform(toBoolean),
  })
  .transform((value, ctx) => {
    const isFree = value.isFree;
    const currency = (value.currency || "BHD").toUpperCase();
    // Empty string means "unclassified" and is stored as null.
    const ageGroup = value.ageGroup ? value.ageGroup : null;

    if (!BOOK_CURRENCIES.includes(currency as BookCurrency)) {
      ctx.addIssue({
        code: "custom",
        path: ["currency"],
        message: `Currency must be one of: ${BOOK_CURRENCIES.join(", ")}.`,
      });
      return z.NEVER;
    }

    // Free books never carry a price.
    if (isFree) {
      return { ...value, isFree: true as const, price: null, currency, ageGroup };
    }

    const rawPrice = typeof value.price === "string" ? value.price.trim() : value.price;

    if (rawPrice === "" || rawPrice === null || rawPrice === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["price"],
        message: "Price is required for paid books.",
      });
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

    // Guard against precision games (e.g. 0.00001) and absurd values.
    if (Number(price.toFixed(3)) !== price) {
      ctx.addIssue({ code: "custom", path: ["price"], message: "Price supports at most 3 decimal places." });
      return z.NEVER;
    }

    if (price > 100000) {
      ctx.addIssue({ code: "custom", path: ["price"], message: "Price is unrealistically high." });
      return z.NEVER;
    }

    return { ...value, isFree: false as const, price, currency, ageGroup };
  });

export type BookMetadataInput = z.infer<typeof bookMetadataSchema>;

/* ------------------------------------------------------------------------- */
/* Preview gallery                                                           */
/* ------------------------------------------------------------------------- */

/** A book's public gallery must hold between 5 and 7 preview images. */
export const MIN_BOOK_PREVIEW_IMAGES = 5;
export const MAX_BOOK_PREVIEW_IMAGES = 7;

export const MAX_BOOK_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

/** Allow-list rather than a `image/*` prefix test, which accepts SVG payloads. */
export const ACCEPTED_BOOK_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
] as const;

/**
 * Declarative description of the gallery the admin wants after saving.
 *
 * The client sends the final order as a single plan so that reordering,
 * deleting and adding are one atomic operation rather than three round trips:
 *
 *   [{ kind: "existing", id }, { kind: "new", fileIndex: 0 }, ...]
 *
 * Array position is the resulting `sortOrder`.
 */
export const bookGalleryPlanSchema = z
  .array(
    z.discriminatedUnion("kind", [
      z.object({ kind: z.literal("existing"), id: z.string().trim().min(1) }),
      z.object({ kind: z.literal("new"), fileIndex: z.number().int().min(0) }),
    ])
  )
  .max(MAX_BOOK_PREVIEW_IMAGES, `A book can have at most ${MAX_BOOK_PREVIEW_IMAGES} preview images.`);

export type BookGalleryPlan = z.infer<typeof bookGalleryPlanSchema>;

/**
 * Validate the size of a requested gallery.
 *
 * `required` is true when the book must end up with a gallery (new books). For
 * edits an empty plan is allowed so that books predating the gallery feature
 * stay editable; as soon as an admin adds one image, the 5–7 rule applies.
 */
export function validateGalleryCount(count: number, options: { required: boolean }): string | null {
  if (count === 0) {
    return options.required
      ? `Please add between ${MIN_BOOK_PREVIEW_IMAGES} and ${MAX_BOOK_PREVIEW_IMAGES} preview images.`
      : null;
  }

  if (count < MIN_BOOK_PREVIEW_IMAGES) {
    return `A book needs at least ${MIN_BOOK_PREVIEW_IMAGES} preview images (currently ${count}).`;
  }

  if (count > MAX_BOOK_PREVIEW_IMAGES) {
    return `A book can have at most ${MAX_BOOK_PREVIEW_IMAGES} preview images (currently ${count}).`;
  }

  return null;
}

/** Reject anything that is not a supported, reasonably sized image. */
export function validateBookImageFile(file: File): string | null {
  if (!ACCEPTED_BOOK_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_BOOK_IMAGE_TYPES)[number])) {
    return `"${file.name}" is not a supported image type (JPEG, PNG, WebP, AVIF or GIF).`;
  }

  if (file.size > MAX_BOOK_IMAGE_SIZE_BYTES) {
    return `"${file.name}" is larger than 5MB.`;
  }

  return null;
}
