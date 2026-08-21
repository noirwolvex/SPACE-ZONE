import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { getBookImageUrls } from "@/lib/book-storage";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  const books = await prisma.book.findMany({
    orderBy: { uploadedAt: "desc" },
    // `path` is intentionally excluded so the admin bundle never holds a storage
    // reference. Admins read files through /api/books/[id]/access like anyone else.
    select: {
      id: true,
      filename: true,
      size: true,
      uploadedAt: true,
      title: true,
      author: true,
      targetAge: true,
      ageGroup: true,
      category: true,
      summary: true,
      price: true,
      currency: true,
      isFree: true,
      images: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, imageUrl: true, sortOrder: true },
      },
    },
  });

  // One batched signing call for every gallery image on the page.
  const signedUrls = await getBookImageUrls(books.flatMap((book) => book.images.map((image) => image.imageUrl)));

  return NextResponse.json(
    books.map((book) => ({
      ...book,
      title: book.title ?? book.filename,
      price: book.price != null ? Number(book.price) : null,
      currency: book.currency ?? "BHD",
      isFree: Boolean(book.isFree),
      // Storage references stay on the server; only short-lived URLs go out.
      images: book.images.flatMap((image) => {
        const url = signedUrls.get(image.imageUrl);
        return url ? [{ id: image.id, url, sortOrder: image.sortOrder }] : [];
      }),
    }))
  );
}
