import { z } from "zod";

export const WEBSITE_CATEGORIES = ["Business", "Portfolio", "Ecommerce", "Blog", "Landing", "Other"] as const;

export const websiteSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  summary: z.string().trim().optional().or(z.literal("")),
  category: z.string().trim().min(1, "Category is required."),
  price: z.number().nonnegative().optional(),
  currency: z.string().trim().min(1, "Currency is required."),
  websiteUrl: z.string().url("Website URL must be a valid URL."),
  isPublished: z.boolean().optional(),
});

export type WebsiteInput = z.infer<typeof websiteSchema>;
