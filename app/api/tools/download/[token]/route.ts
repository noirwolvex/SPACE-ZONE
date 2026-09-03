import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createStartupToolFileSignedUrl, openLocalStartupToolFile } from "@/lib/startup-tool-storage";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token || token.length > 200) return NextResponse.json({ error: "Invalid download token." }, { status: 400 });

  const auth = await getCurrentUser();
  if (!auth?.profile) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const download = await prisma.download.findUnique({
    where: { token },
    include: {
      file: true,
      orderItem: {
        include: {
          order: { select: { customerId: true, status: true } },
        },
      },
    },
  });

  if (!download?.file || download.orderItem.order.customerId !== auth.profile.id || download.orderItem.order.status !== "PAID") {
    return NextResponse.json({ error: "Download not found or not authorized." }, { status: 404 });
  }

  const file = download.file;
  await prisma.download.update({ where: { id: download.id }, data: { accessedAt: new Date() } });

  const signedUrl = await createStartupToolFileSignedUrl(file.path, file.filename);
  if (signedUrl) return NextResponse.redirect(signedUrl);

  const localFile = await openLocalStartupToolFile(file.path);
  if (!localFile) return NextResponse.json({ error: "File is currently unavailable." }, { status: 500 });

  return new NextResponse(Readable.toWeb(localFile.stream()) as unknown as ReadableStream, {
    status: 200,
    headers: {
      "Content-Type": file.contentType || "application/octet-stream",
      "Content-Length": String(localFile.size),
      "Content-Disposition": `attachment; filename="${file.filename.replace(/["\\\r\n]/g, "_")}"`,
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
