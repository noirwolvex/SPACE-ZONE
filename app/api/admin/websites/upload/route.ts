import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/content-store";
import { uploadWebsiteFile, deleteWebsiteFile } from "@/lib/website-storage";
import { websiteSchema } from "@/lib/website-validation";

export const runtime = "nodejs";
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = 25 * 1024 * 1024;
const MAX_GALLERY_IMAGES = 5;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/ogg", "video/quicktime"]);

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

function getFormStringArray(formData: FormData, key: string) {
  const value = getFormString(formData, key);
  return value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
}

function getNullableYear(value: string) {
  const normalized = value.trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isInteger(parsed) ? parsed : null;
}

function extensionForMimeType(type: string) {
  switch (type) {
    case "image/jpeg": return "jpg";
    case "image/png": return "png";
    case "image/webp": return "webp";
    case "image/gif": return "gif";
    case "video/mp4": return "mp4";
    case "video/webm": return "webm";
    case "video/ogg": return "ogv";
    case "video/quicktime": return "mov";
    default: return "bin";
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  try {
    const formData = await request.formData();
    const websiteId = getFormString(formData, "websiteId");
    const imageFiles = formData.getAll("images").filter((value): value is File => value instanceof File && value.size > 0);
    const legacyImage = formData.get("image");
    if (!imageFiles.length && legacyImage instanceof File && legacyImage.size > 0) imageFiles.push(legacyImage);
    const videoFile = formData.get("video");
    const hasVideoFile = videoFile instanceof File && videoFile.size > 0;

    const parsed = websiteSchema.safeParse({
      title: getFormString(formData, "title"),
      summary: getFormString(formData, "summary"),
      description: getFormString(formData, "description"),
      system: getFormString(formData, "system"),
      details: getFormString(formData, "details"),
      features: getFormString(formData, "features"),
      targetAudience: getFormString(formData, "targetAudience"),
      responsive: getFormString(formData, "responsive"),
      age: getFormString(formData, "age"),
      gameType: getFormString(formData, "gameType"),
      category: getFormString(formData, "category"),
      status: getFormString(formData, "status") || "LIVE",
      techStack: getFormStringArray(formData, "techStack"),
      featured: getFormString(formData, "featured") === "true",
      launchYear: getNullableYear(getFormString(formData, "launchYear")),
      keyFeatures: getFormStringArray(formData, "keyFeatures"),
      price: Number(getFormString(formData, "price") || 0),
      currency: getFormString(formData, "currency"),
      websiteUrl: getFormString(formData, "websiteUrl"),
      isPublished: getFormString(formData, "isPublished") === "true",
    });

    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed." }, { status: 400 });
    if (imageFiles.length > MAX_GALLERY_IMAGES) return NextResponse.json({ error: `You can upload up to ${MAX_GALLERY_IMAGES} images.` }, { status: 400 });

    for (const file of imageFiles) {
      if (!ALLOWED_IMAGE_TYPES.has(file.type)) return NextResponse.json({ error: "Only JPG, PNG, WEBP, and GIF images are allowed." }, { status: 400 });
      if (file.size > MAX_IMAGE_SIZE_BYTES) return NextResponse.json({ error: "Each image must be smaller than 5MB." }, { status: 400 });
    }

    if (hasVideoFile) {
      if (!ALLOWED_VIDEO_TYPES.has(videoFile.type)) return NextResponse.json({ error: "Only MP4, WEBM, OGG, and MOV videos are allowed." }, { status: 400 });
      if (videoFile.size > MAX_VIDEO_SIZE_BYTES) return NextResponse.json({ error: "The video must be smaller than 25MB." }, { status: 400 });
    }

    const editingId = websiteId.trim() || null;
    const existing = editingId
      ? await prisma.website.findUnique({ where: { id: editingId }, include: { video: true } })
      : null;
    if (editingId && !existing) return NextResponse.json({ error: "Website not found." }, { status: 404 });

    const oldVideoPath = existing?.video?.videoPath ?? null;
    const oldImagePaths = existing
      ? Array.from(new Set([existing.image, ...(existing.gallery ?? [])].filter(Boolean))) as string[]
      : [];

    let gallery = existing?.gallery ?? [];
    let imagePath = existing?.image ?? null;
    let newVideoPath: string | null = null;
    const uploadedPaths: string[] = [];

    try {
      if (imageFiles.length) {
        const uploadedImagePaths: string[] = [];
        for (const file of imageFiles) {
          const filename = `${randomUUID()}.${extensionForMimeType(file.type)}`;
          const buffer = Buffer.from(await file.arrayBuffer());
          const upload = await uploadWebsiteFile(filename, buffer, file.type, "images");
          uploadedImagePaths.push(upload.path);
          uploadedPaths.push(upload.path);
        }
        gallery = uploadedImagePaths.slice(0, MAX_GALLERY_IMAGES);
        imagePath = gallery[0] ?? null;
      }

      if (hasVideoFile) {
        const filename = `${randomUUID()}.${extensionForMimeType(videoFile.type)}`;
        const buffer = Buffer.from(await videoFile.arrayBuffer());
        const upload = await uploadWebsiteFile(filename, buffer, videoFile.type, "videos");
        uploadedPaths.push(upload.path);
        newVideoPath = upload.path;
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
        age: parsed.data.age?.trim() || null,
        gameType: parsed.data.gameType?.trim() || null,
        status: parsed.data.status,
        techStack: parsed.data.techStack ?? [],
        featured: Boolean(parsed.data.featured),
        launchYear: parsed.data.launchYear ?? null,
        keyFeatures: parsed.data.keyFeatures ?? [],
        category: parsed.data.category.trim(),
        price: parsed.data.price ?? 0,
        currency: parsed.data.currency.trim(),
        websiteUrl: parsed.data.websiteUrl.trim(),
        isPublished: Boolean(parsed.data.isPublished),
        image: imagePath,
        gallery,
      } as const;

      const saved = await prisma.$transaction(async (tx) => {
        const website = existing
          ? await tx.website.update({ where: { id: existing.id }, data: sharedData })
          : await tx.website.create({
              data: { ...sharedData, slug: await generateUniqueWebsiteSlug(parsed.data.title.trim()) },
            });

        if (newVideoPath) {
          await tx.websiteVideo.upsert({
            where: { websiteId: website.id },
            update: { videoPath: newVideoPath },
            create: { websiteId: website.id, videoPath: newVideoPath },
          });
        }

        return website;
      });

      const stalePaths = [
        ...(existing && imageFiles.length ? oldImagePaths.filter((path) => !gallery.includes(path)) : []),
        ...(existing && newVideoPath && oldVideoPath && oldVideoPath !== newVideoPath ? [oldVideoPath] : []),
      ];
      const cleanupResults = await Promise.allSettled(
        Array.from(new Set(stalePaths)).map((filePath) => deleteWebsiteFile(filePath))
      );
      const cleanupFailures = cleanupResults.filter((result) => result.status === "rejected");
      if (cleanupFailures.length) console.error(`Website ${saved.slug} saved, but ${cleanupFailures.length} old storage file(s) could not be removed.`);

      return NextResponse.json(saved);
    } catch (error) {
      await Promise.all(uploadedPaths.map((uploadedPath) => deleteWebsiteFile(uploadedPath).catch(() => undefined)));
      console.error("Website save failed:", error);
      return NextResponse.json({ error: "Failed to save the website. No new storage files were kept." }, { status: 500 });
    }
  } catch (error) {
    console.error("Website upload request failed:", error);
    return NextResponse.json({ error: "Invalid website upload request." }, { status: 400 });
  }
}
