import { prisma } from "@/lib/prisma";

export type PublishedFaq = {
  id: string;
  question: string;
  answer: string;
  category: string;
  page: string;
  sortOrder: number;
  isPublished: boolean;
};

export async function getAllPublishedFaqs(limit = 100, fallbackOnUnavailable = false): Promise<PublishedFaq[]> {
  const safeLimit = Math.min(100, Math.max(1, Math.round(limit)));

  try {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT "id", "question", "answer", "category", "page", "sortOrder", "isPublished"
      FROM "FAQ"
      WHERE "isPublished" = true
      ORDER BY "sortOrder" ASC, "createdAt" ASC
      LIMIT ${safeLimit}
    `;

    return rows.map((row) => ({
      id: String(row.id),
      question: String(row.question ?? ""),
      answer: String(row.answer ?? ""),
      category: String(row.category ?? ""),
      page: String(row.page ?? "/"),
      sortOrder: Number(row.sortOrder ?? 0),
      isPublished: Boolean(row.isPublished),
    }));
  } catch (error) {
    if (fallbackOnUnavailable) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[SpaceZone] FAQs could not be loaded; hiding the FAQ section for this request. ${message}`);
      return [];
    }
    throw error;
  }
}
