import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { deleteBookFile, uploadBookFile, uploadBookPreviewImage } from "@/lib/book-storage";
import { bookGalleryPlanSchema, bookMetadataSchema, validateBookImageFile, validateGalleryCount, type BookGalleryPlan } from "@/lib/book-validation";

export const runtime = "nodejs";
export const maxDuration = 1800;
const MAX_PDF_SIZE_BYTES = 600 * 1024 * 1024;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function extensionFor(file: File, fallback: string) {
  const extension = file.name?.includes(".") ? file.name.split(".").pop() : null;
  return extension && /^[a-z0-9]{1,5}$/i.test(extension) ? extension.toLowerCase() : fallback;
}

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  const formData = await request.formData();
  const pdfFile = formData.get("file");
  const coverImageFile = formData.get("coverImage");
  const bookId = getFormString(formData, "bookId") || formData.get("replaceId");
  const accessType = getFormString(formData, "accessType");
  const rawIsFree = accessType ? accessType.toUpperCase() === "FREE" : getFormString(formData, "isFree");

  const metadataResult = bookMetadataSchema.safeParse({
    title: getFormString(formData, "title"),
    author: getFormString(formData, "author"),
    targetAge: getFormString(formData, "targetAge"),
    ageGroup: getFormString(formData, "ageGroup"),
    category: getFormString(formData, "category"),
    summary: getFormString(formData, "summary"),
    features: getFormString(formData, "features"),
    targetAudience: getFormString(formData, "targetAudience"),
    bookSize: getFormString(formData, "bookSize"),
    pageCount: getFormString(formData, "pageCount"),
    seriesParts: getFormString(formData, "seriesParts"),
    price: getFormString(formData, "price"),
    currency: getFormString(formData, "currency") || "BHD",
    isFree: rawIsFree,
  });

  if (!metadataResult.success) return NextResponse.json({ error: metadataResult.error.issues[0]?.message ?? "Validation failed." }, { status: 400 });

  const metadata = metadataResult.data;
  const editingId = typeof bookId === "string" && bookId.trim() ? String(bookId) : null;
  let existingBook = null;
  if (editingId) {
    existingBook = await prisma.book.findUnique({ where: { id: editingId } });
    if (!existingBook) return NextResponse.json({ error: "Book not found." }, { status: 404 });
  }

  const galleryRaw = getFormString(formData, "gallery");
  const previewFiles = formData.getAll("previewImages").filter((entry): entry is File => entry instanceof File);
  let galleryPlan: BookGalleryPlan | null = null;

  if (galleryRaw) {
    let parsedJson: unknown;
    try { parsedJson = JSON.parse(galleryRaw); } catch { return badRequest("Gallery payload is malformed."); }
    const planResult = bookGalleryPlanSchema.safeParse(parsedJson);
    if (!planResult.success) return badRequest(planResult.error.issues[0]?.message ?? "Gallery payload is invalid.");
    galleryPlan = planResult.data;
  } else if (!existingBook) {
    galleryPlan = [];
  }

  const currentImages = existingBook ? await prisma.bookImage.findMany({ where: { bookId: existingBook.id }, orderBy: { sortOrder: "asc" }, select: { id: true, imageUrl: true } }) : [];
  let removedImages: typeof currentImages = [];

  if (galleryPlan) {
    const countError = validateGalleryCount(galleryPlan.length, { required: !existingBook });
    if (countError) return badRequest(countError);
    const keptIds = new Set<string>();
    const usedFileIndexes = new Set<number>();
    const ownedIds = new Set(currentImages.map((image) => image.id));
    for (const entry of galleryPlan) {
      if (entry.kind === "existing") {
        if (!ownedIds.has(entry.id)) return badRequest("Gallery references an image that does not belong to this book.");
        if (keptIds.has(entry.id)) return badRequest("Gallery references the same image twice.");
        keptIds.add(entry.id);
      } else {
        if (entry.fileIndex >= previewFiles.length) return badRequest("Gallery references a preview image that was not uploaded.");
        if (usedFileIndexes.has(entry.fileIndex)) return badRequest("Gallery references the same uploaded file twice.");
        usedFileIndexes.add(entry.fileIndex);
        const fileError = validateBookImageFile(previewFiles[entry.fileIndex]);
        if (fileError) return badRequest(fileError);
      }
    }
    removedImages = currentImages.filter((image) => !keptIds.has(image.id));
  }

  if (!existingBook && !(pdfFile instanceof File)) return NextResponse.json({ error: "PDF file is required." }, { status: 400 });
  if (pdfFile instanceof File) {
    if (pdfFile.type !== "application/pdf") return NextResponse.json({ error: "Only PDF files are allowed." }, { status: 400 });
    if (pdfFile.size > MAX_PDF_SIZE_BYTES) return NextResponse.json({ error: "PDF must be smaller than 600MB." }, { status: 400 });
    const header = Buffer.from(await pdfFile.slice(0, 5).arrayBuffer());
    if (header.toString("latin1") !== "%PDF-") return NextResponse.json({ error: "File does not appear to be a valid PDF." }, { status: 400 });
  }

  let coverImagePath: string | null = existingBook?.coverImage ?? null;
  let uploadedCoverRef: string | null = null;
  if (coverImageFile instanceof File) {
    if (!coverImageFile.type.startsWith("image/")) return NextResponse.json({ error: "Cover image must be an image file." }, { status: 400 });
    if (coverImageFile.size > MAX_IMAGE_SIZE_BYTES) return NextResponse.json({ error: "Cover image must be smaller than 5MB." }, { status: 400 });
    const coverFilename = `${randomUUID()}.${extensionFor(coverImageFile, "jpg")}`;
    const coverBuffer = Buffer.from(await coverImageFile.arrayBuffer());
    const coverUpload = await uploadBookFile(coverFilename, coverBuffer, coverImageFile.type, "covers");
    coverImagePath = coverUpload.ref;
    uploadedCoverRef = coverUpload.ref;
  }

  let pdfRef = existingBook?.path ?? null;
  let pdfFilename = existingBook?.filename ?? null;
  let pdfSize = existingBook?.size ?? 0;
  let storageMode: string | null = null;
  let uploadedPdfRef: string | null = null;

  if (pdfFile instanceof File) {
    const filename = `${randomUUID()}.pdf`;
    const fileBuffer = Buffer.from(await pdfFile.arrayBuffer());
    const fileUpload = await uploadBookFile(filename, fileBuffer, "application/pdf");
    pdfRef = fileUpload.ref;
    uploadedPdfRef = fileUpload.ref;
    storageMode = fileUpload.storageMode;
    pdfFilename = filename;
    pdfSize = fileBuffer.length;
  }

  const data = {
    title: metadata.title.trim(),
    author: metadata.author?.trim() || null,
    targetAge: metadata.targetAge?.trim() || null,
    ageGroup: metadata.ageGroup,
    category: metadata.category.trim(),
    summary: metadata.summary?.trim() || null,
    features: metadata.features?.trim() || null,
    targetAudience: metadata.targetAudience?.trim() || null,
    bookSize: metadata.bookSize?.trim() || null,
    pageCount: metadata.pageCount,
    seriesParts: metadata.seriesParts?.trim() || null,
    price: metadata.price,
    currency: metadata.currency,
    isFree: metadata.isFree,
    coverImage: coverImagePath,
    path: pdfRef!,
    filename: pdfFilename!,
    size: pdfSize,
  };

  const uploadedPreviewRefs = new Map<number, string>();
  try {
    if (galleryPlan) {
      await Promise.all(galleryPlan.map(async (entry) => {
        if (entry.kind !== "new") return;
        const file = previewFiles[entry.fileIndex];
        const filename = `${randomUUID()}.${extensionFor(file, "jpg")}`;
        const buffer = Buffer.from(await file.arrayBuffer());
        const upload = await uploadBookPreviewImage(filename, buffer, file.type);
        uploadedPreviewRefs.set(entry.fileIndex, upload.ref);
      }));
    }

    const book = await prisma.$transaction(async (tx) => {
      const saved = existingBook ? await tx.book.update({ where: { id: editingId! }, data }) : await tx.book.create({ data });
      if (galleryPlan) {
        if (removedImages.length > 0) await tx.bookImage.deleteMany({ where: { id: { in: removedImages.map((image) => image.id) }, bookId: saved.id } });
        for (const [sortOrder, entry] of galleryPlan.entries()) {
          if (entry.kind === "existing") await tx.bookImage.update({ where: { id: entry.id }, data: { sortOrder } });
          else await tx.bookImage.create({ data: { bookId: saved.id, imageUrl: uploadedPreviewRefs.get(entry.fileIndex)!, sortOrder } });
        }
      }
      return saved;
    });

    const staleRefs = [
      existingBook?.coverImage && existingBook.coverImage !== coverImagePath ? existingBook.coverImage : null,
      existingBook?.path && existingBook.path !== pdfRef ? existingBook.path : null,
      ...removedImages.map((image) => image.imageUrl),
    ].filter((ref): ref is string => Boolean(ref));

    await Promise.all(staleRefs.map((ref) => deleteBookFile(ref).catch(() => undefined)));

    return NextResponse.json({ id: book.id, title: book.title, isFree: book.isFree, price: book.price != null ? Number(book.price) : null, currency: book.currency, imageCount: galleryPlan ? galleryPlan.length : currentImages.length, storageMode });
  } catch (error) {
    const uploadedRefs = [uploadedCoverRef, uploadedPdfRef, ...Array.from(uploadedPreviewRefs.values())].filter((ref): ref is string => Boolean(ref));
    await Promise.all(uploadedRefs.map((ref) => deleteBookFile(ref).catch(() => undefined)));
    console.error("Failed to save book:", error);
    return NextResponse.json({ error: "Failed to save the book. No changes were applied." }, { status: 500 });
  }
}
