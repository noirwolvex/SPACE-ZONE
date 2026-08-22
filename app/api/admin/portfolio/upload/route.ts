import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { IMAGE_EXTENSIONS, MAX_IMAGE_SIZE_BYTES, uploadMediaImage } from "@/lib/media-storage";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Image file is required." }, { status: 400 });

  const extension = IMAGE_EXTENSIONS.get(file.type);
  if (!extension) return NextResponse.json({ error: "Only PNG, JPG, WEBP, and GIF images are allowed." }, { status: 400 });
  if (file.size > MAX_IMAGE_SIZE_BYTES) return NextResponse.json({ error: "Image must be smaller than 5MB." }, { status: 400 });

  const filename = `${randomUUID()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const upload = await uploadMediaImage(filename, bytes, file.type, "portfolio");

  return NextResponse.json({ path: upload.path, storageMode: upload.storageMode });
}
