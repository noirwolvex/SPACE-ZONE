import { z } from "zod";

export const WEBSITE_CATEGORIES = ["KIDS", "LEARNING", "GAME", "BUSINESS", "Portfolio", "Ecommerce", "Blog", "Landing", "Other"] as const;
export const WEBSITE_RESPONSIVE_OPTIONS = ["Fully Responsive", "Partially Responsive", "Desktop Only", "Mobile Only"] as const;
export const WEBSITE_GAME_AGES = ["3-5", "6-8", "9-12", "13+"] as const;
export const WEBSITE_GAME_TYPES = ["PUZZLE", "ADVENTURE", "EDUCATIONAL", "ARCADE", "STRATEGY", "CREATIVE"] as const;

export const websiteSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  summary: z.string().trim().optional().or(z.literal("")),
  description: z.string().trim().optional().or(z.literal("")),
  system: z.string().trim().optional().or(z.literal("")),
  details: z.string().trim().optional().or(z.literal("")),
  features: z.string().trim().optional().or(z.literal("")),
  targetAudience: z.string().trim().optional().or(z.literal("")),
  responsive: z.enum(WEBSITE_RESPONSIVE_OPTIONS).optional().or(z.literal("")),
  age: z.string().trim().max(50, "Age is too long.").optional().or(z.literal("")),
  gameType: z.enum(WEBSITE_GAME_TYPES).optional().or(z.literal("")),
  category: z.string().trim().min(1, "Category is required.").max(100, "Category is too long."),
  price: z.number().nonnegative().optional(),
  currency: z.string().trim().min(1, "Currency is required."),
  websiteUrl: z.string().url("Website URL must be a valid URL."),
  isPublished: z.boolean().optional(),
}).superRefine((data, ctx) => {
  if (data.category.trim().toUpperCase() === "GAME") {
    if (!data.age) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["age"], message: "Age is required for game websites." });
    if (!data.gameType) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["gameType"], message: "Game type is required for game websites." });
  }
});

export type WebsiteInput = z.infer<typeof websiteSchema>;
