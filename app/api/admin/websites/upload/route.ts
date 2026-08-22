import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/content-store";
import { uploadWebsiteFile, deleteWebsiteFile } from "@/lib/website-storage";
import { websiteSchema } from "@/lib/website-validation";

export const runtime = "nodejs";
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_GALLERY_IMAGES = 5;

async function generateUniqueWebsiteSlug(title: string) {
  const baseSlug = slugify(title) || randomUUID();
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.website.findUnique({ where: { slug } })) slug = `${baseSlug}-${suffix++}`;
  return slug;
}

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  const formData = await request.formData();
  const websiteId = getFormString(formData, "websiteId");
  const imageFiles = formData.getAll("images").filter((value): value is File => value instanceof File && value.size > 0);
  const legacyImage = formData.get("image");
  if (!imageFiles.length && legacyImage instanceof File && legacyImage.size > 0) imageFiles.push(legacyImage);

  const parsed = websiteSchema.safeParse({
    title: getFormString(formData, "title"),
    summary: getFormString(formData, "summary"),
    description: getFormString(formData, "description"),
    system: getFormString(formData, "system"),
    details: getFormString(formData, "details"),
    features: getFormString(formData, "features"),
    targetAudience: getFormString(formData, "targetAudience"),
    responsive: getFormString(formData, "responsive"),
    category: getFormString(formData, "category"),
    price: Number(getFormString(formData, "price") || 0),
    currency: getFormString(formData, "currency"),
    websiteUrl: getFormString(formData, "websiteUrl"),
    isPublished: getFormString(formData, "isPublished") === "true",
  });

  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed." }, { status: 400 });
  if (imageFiles.length > MAX_GALLERY_IMAGES) return NextResponse.json({ error: `You can upload up to ${MAX_GALLERY_IMAGES} images.` }, { status: 400 });

  const editingId = websiteId.trim() || null;
  const existing = editingId ? await prisma.website.findUnique({ where: { id: editingId } }) : null;
  if (editingId && !existing) return NextResponse.json({ error: "Website not found." }, { status: 404 });

  let gallery = existing?.gallery ?? [];
  let imagePath = existing?.image ?? null;

  if (imageFiles.length) {
    const uploadedPaths: string[] = [];
    try {
      for (const file of imageFiles) {
        if (!file.type.startsWith("image/")) return NextResponse.json({ error: "All gallery files must be images." }, { status: 400 });
        if (file.size > MAX_IMAGE_SIZE_BYTES) return NextResponse.json({ error: "Each image must be smaller than 5MB." }, { status: 400 });
        const extension = file.name.includes(".") ? `.${file.name.split(".").pop()}` : ".jpg";
        const filename = `${randomUUID()}${extension}`;
        const buffer = Buffer.from(await file.arrayBuffer());
        const upload = await uploadWebsiteFile(filename, buffer, file.type, "images");
        uploadedPaths.push(upload.path);
      }
      gallery = uploadedPaths.slice(0, MAX_GALLERY_IMAGES);
      imagePath = gallery[0] ?? null;
    } catch (error) {
      for (const path of uploadedPaths) await deleteWebsiteFile(path).catch(() => undefined);
      console.error("Website gallery upload failed:", error);
      return NextResponse.json({ error: "Failed to upload website images." }, { status: 500 });
    }

    if (existing) {
      const oldPaths = Array.from(new Set([existing.image, ...(existing.gallery ?? [])].filter(Boolean)));
      await Promise.all(oldPaths.filter((path) => !gallery.includes(path!)).map((path) => deleteWebsiteFile(path!)));
    }
  }

  const sharedData = {
    title: parsed.data.title.trim(),
    summary: parsed.data.summary?.trim() || null,
    description: parsed.data.description?.trim() || null,
    system: parsed.data.system?.trim() || null,
    details: parsed.data.details?.trim() || null,
    features: parsed.data.features?.trim() || null,
    targetAudience: parsed.data.targetAudience?.trim() || null,
    responsive: parsed.data.responsive?.trim() || null,
    category: parsed.data.category.trim(),
    price: parsed.data.price ?? 0,
    currency: parsed.data.currency.trim(),
    websiteUrl: parsed.data.websiteUrl.trim(),
    isPublished: Boolean(parsed.data.isPublished),
    image: imagePath,
    gallery,
  } as const;

  if (existing) return NextResponse.json(await prisma.website.update({ where: { id: existing.id }, data: sharedData }));

  return NextResponse.json(await prisma.website.create({
    data: { ...sharedData, slug: await generateUniqueWebsiteSlug(parsed.data.title.trim()) },
  }));
}
