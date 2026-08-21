import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/content-store";
import { uploadWebsiteFile, deleteWebsiteFile } from "@/lib/website-storage";
import { websiteSchema } from "@/lib/website-validation";

export const runtime = "nodejs";
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

async function generateUniqueWebsiteSlug(title: string) {
  const baseSlug = slugify(title) || randomUUID();
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.website.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`;
  }
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
  const imageFile = formData.get("image");
  const websiteId = getFormString(formData, "websiteId");

  const parsed = websiteSchema.safeParse({
    title: getFormString(formData, "title"),
    summary: getFormString(formData, "summary"),
    category: getFormString(formData, "category"),
    price: Number(getFormString(formData, "price") || 0),
    currency: getFormString(formData, "currency"),
    websiteUrl: getFormString(formData, "websiteUrl"),
    isPublished: getFormString(formData, "isPublished") === "true",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed." }, { status: 400 });
  }

  const editingId = websiteId && websiteId.trim() ? websiteId : null;
  let existing = null;
  if (editingId) {
    existing = await prisma.website.findUnique({ where: { id: editingId } });
    if (!existing) return NextResponse.json({ error: "Website not found." }, { status: 404 });
  }

  let imagePath = existing?.image ?? null;
  if (imageFile instanceof File) {
    if (!imageFile.type.startsWith("image/")) {
      return NextResponse.json({ error: "Image must be an image file." }, { status: 400 });
    }
    if (imageFile.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json({ error: "Image must be smaller than 5MB." }, { status: 400 });
    }

    const filename = `${randomUUID()}${imageFile.name ? `.${imageFile.name.split('.').pop()}` : "jpg"}`;
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const upload = await uploadWebsiteFile(filename, buffer, imageFile.type, "images");
    imagePath = upload.path;
    if (existing?.image && existing.image !== imagePath) {
      await deleteWebsiteFile(existing.image);
    }
  }

  const sharedData = {
    title: parsed.data.title.trim(),
    summary: parsed.data.summary?.trim() || null,
    category: parsed.data.category.trim(),
    price: parsed.data.price ?? 0,
    currency: parsed.data.currency.trim(),
    websiteUrl: parsed.data.websiteUrl.trim(),
    isPublished: Boolean(parsed.data.isPublished),
    image: imagePath,
  } as const;

  if (existing) {
    const updated = await prisma.website.update({ where: { id: editingId! }, data: sharedData });
    return NextResponse.json(updated);
  }

  const created = await prisma.website.create({
    data: {
      ...sharedData,
      slug: await generateUniqueWebsiteSlug(parsed.data.title.trim()),
    },
  });
  return NextResponse.json(created);
}
