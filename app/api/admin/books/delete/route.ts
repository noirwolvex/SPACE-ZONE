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
    include: {
      images: { select: { imageUrl: true } },
      orders: { select: { id: true } },
      purchases: { select: { id: true } },
    },
  });

  if (!book) {
    return NextResponse.json({ error: "Book not found." }, { status: 404 });
  }

  // A book referenced by purchase/order history cannot be hard-deleted without
  // breaking referential integrity and/or destroying sales history. Archive it
  // instead. The storefront filters archived books out, while existing buyers
  // keep the underlying book record available for entitlement checks.
  if (book.orders.length > 0 || book.purchases.length > 0) {
    await prisma.book.update({
      where: { id },
      data: { isDeleted: true },
    });

    return NextResponse.json({ success: true, archived: true });
  }

  // No financial history references this book, so a full removal is safe.
  await deleteBookFile(book.path).catch(() => undefined);
  if (book.coverImage) {
    await deleteBookFile(book.coverImage).catch(() => undefined);
  }
  await Promise.all(book.images.map((image) => deleteBookFile(image.imageUrl).catch(() => undefined)));

  await prisma.book.delete({ where: { id } });

  return NextResponse.json({ success: true, archived: false });
}
