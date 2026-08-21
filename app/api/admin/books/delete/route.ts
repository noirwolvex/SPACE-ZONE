import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { deleteBookFile } from "@/lib/book-storage";

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Book id is required." }, { status: 400 });
  }

  const book = await prisma.book.findUnique({
    where: { id },
    include: { images: { select: { imageUrl: true } } },
  });
  if (!book) {
    return NextResponse.json({ error: "Book not found." }, { status: 404 });
  }

  await deleteBookFile(book.path);
  if (book.coverImage) {
    await deleteBookFile(book.coverImage).catch(() => undefined);
  }
  // Gallery rows cascade with the book; their storage objects do not, so they
  // are removed explicitly here.
  await Promise.all(book.images.map((image) => deleteBookFile(image.imageUrl).catch(() => undefined)));

  await prisma.book.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
