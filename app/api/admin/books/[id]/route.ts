import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { bookMetadataSchema } from "@/lib/book-validation";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  const { id } = await params;
  const book = await prisma.book.findUnique({
    where: { id },
    // `path` is intentionally excluded — the storage reference never leaves the server.
    select: {
      id: true,
      title: true,
      author: true,
      targetAge: true,
      category: true,
      summary: true,
      filename: true,
      size: true,
      isFree: true,
      price: true,
      currency: true,
      uploadedAt: true,
    },
  });

  if (!book) {
    return NextResponse.json({ error: "Book not found." }, { status: 404 });
  }

  return NextResponse.json({ ...book, price: book.price != null ? Number(book.price) : null });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  const { id } = await params;
  const body = await request.json();
  const accessType = typeof body?.accessType === "string" ? body.accessType : null;

  const metadataResult = bookMetadataSchema.safeParse({
    title: body?.title ?? "",
    author: body?.author ?? "",
    targetAge: body?.targetAge ?? "",
    ageGroup: body?.ageGroup ?? "",
    category: body?.category ?? "",
    summary: body?.summary ?? "",
    price: body?.price ?? "",
    currency: body?.currency ?? "BHD",
    isFree: accessType ? accessType.toUpperCase() === "FREE" : body?.isFree ?? false,
  });

  if (!metadataResult.success) {
    return NextResponse.json({ error: metadataResult.error.issues[0]?.message ?? "Validation failed." }, { status: 400 });
  }

  const metadata = metadataResult.data;
  const updatedBook = await prisma.book.update({
    where: { id },
    data: {
      title: metadata.title.trim(),
      author: metadata.author?.trim() || null,
      targetAge: metadata.targetAge?.trim() || null,
      ageGroup: metadata.ageGroup,
      category: metadata.category.trim(),
      summary: metadata.summary?.trim() || null,
      price: metadata.price,
      currency: metadata.currency,
      isFree: metadata.isFree,
    },
  });

  return NextResponse.json({
    id: updatedBook.id,
    title: updatedBook.title,
    isFree: updatedBook.isFree,
    price: updatedBook.price != null ? Number(updatedBook.price) : null,
    currency: updatedBook.currency,
  });
}
