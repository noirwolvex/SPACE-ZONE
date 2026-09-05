import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { deleteWebsiteFile } from "@/lib/website-storage";

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  try {
    const body = await request.json().catch(() => null);
    const id = typeof body?.id === "string" ? body.id.trim() : "";
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const existing = await prisma.website.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const videoRows = await prisma.$queryRaw<Array<{ videoPath: string }>>`
      SELECT "videoPath" FROM "WebsiteVideo" WHERE "websiteId" = ${id} LIMIT 1
    `;

    const filePaths = Array.from(
      new Set([existing.image, ...(existing.gallery ?? []), videoRows[0]?.videoPath].filter(Boolean))
    ) as string[];

    await prisma.website.delete({ where: { id } });

    const cleanupResults = await Promise.allSettled(
      filePaths.map((filePath) => deleteWebsiteFile(filePath))
    );

    const cleanupFailures = cleanupResults.filter((result) => result.status === "rejected");
    if (cleanupFailures.length) {
      console.error(
        `Website ${existing.slug} was deleted, but ${cleanupFailures.length} storage file(s) could not be removed.`
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Website delete failed:", err);
    return NextResponse.json({ error: "Failed to delete the website." }, { status: 500 });
  }
}
