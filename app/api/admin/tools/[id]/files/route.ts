import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { deleteStartupToolFile, uploadStartupToolFile } from "@/lib/startup-tool-storage";

export const runtime = "nodejs";
export const maxDuration = 1800;
const MAX_FILE_SIZE_BYTES = 600 * 1024 * 1024;

type Props = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Props) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;
  const { id } = await params;
  const files = await prisma.startupToolFile.findMany({
    where: { toolId: id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, filename: true, size: true, contentType: true, sortOrder: true, createdAt: true },
  });
  return NextResponse.json(files);
}

export async function POST(request: NextRequest, { params }: Props) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;
  const { id } = await params;

  const tool = await prisma.startupTool.findUnique({ where: { id }, select: { id: true } });
  if (!tool) return NextResponse.json({ error: "Tool not found." }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size <= 0) return NextResponse.json({ error: "A file is required." }, { status: 400 });
  if (file.size > MAX_FILE_SIZE_BYTES) return NextResponse.json({ error: "Tool files must be smaller than 600MB." }, { status: 400 });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-180) || `file-${randomUUID()}`;
  const filename = `${randomUUID()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const upload = await uploadStartupToolFile(filename, buffer, file.type || "application/octet-stream");
    const saved = await prisma.$transaction(async (tx) => {
      const sortOrder = await tx.startupToolFile.count({ where: { toolId: id } });
      const created = await tx.startupToolFile.create({
        data: {
          toolId: id,
          filename: file.name,
          path: upload.ref,
          size: file.size,
          contentType: file.type || "application/octet-stream",
          sortOrder,
        },
      });

      const paidItems = await tx.orderItem.findMany({
        where: {
          toolId: id,
          order: { status: "PAID" },
        },
        select: { id: true },
      });

      for (const item of paidItems) {
        const existingDownload = await tx.download.findFirst({
          where: { orderItemId: item.id, fileId: created.id },
          select: { id: true },
        });
        if (existingDownload) continue;

        await tx.download.create({
          data: {
            orderItemId: item.id,
            fileId: created.id,
            token: randomUUID(),
          },
        });
      }

      return created;
    });

    return NextResponse.json({ ...saved, storageMode: upload.storageMode }, { status: 201 });
  } catch (error) {
    try {
      await deleteStartupToolFile(uploadStartupRef(uploadErrorRef(error))).catch(() => undefined);
    } catch {
      // The upload reference is intentionally best-effort on error; avoid masking the original failure.
    }
    console.error("Startup tool file upload failed:", error);
    return NextResponse.json({ error: "Unable to upload tool file." }, { status: 500 });
  }
}

function uploadStartupRef(_value: unknown): string {
  return "";
}

function uploadErrorRef(_error: unknown): string {
  return "";
}

export async function DELETE(request: NextRequest, { params }: Props) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;
  const { id } = await params;
  const fileId = request.nextUrl.searchParams.get("fileId")?.trim();
  if (!fileId) return NextResponse.json({ error: "File identifier is required." }, { status: 400 });

  const file = await prisma.startupToolFile.findFirst({ where: { id: fileId, toolId: id } });
  if (!file) return NextResponse.json({ error: "File not found." }, { status: 404 });

  await prisma.startupToolFile.delete({ where: { id: file.id } });
  await deleteStartupToolFile(file.path).catch((error) => console.warn("Failed to remove tool file from storage:", error));
  return NextResponse.json({ ok: true });
}
