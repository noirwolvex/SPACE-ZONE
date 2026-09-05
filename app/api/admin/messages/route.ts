import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  try {
    const messages = await prisma.$queryRaw<any[]>`
      SELECT
        "id", "name", "email", "phone", "company", "service", "budget", "timeline",
        "contactType", "message", "details", "attachmentUrl", "attachmentName",
        "status", "createdAt", "updatedAt"
      FROM "ContactMessage"
      ORDER BY "createdAt" DESC
    `;
    return NextResponse.json(messages);
  } catch (error) {
    console.error("Unable to load messages:", error);
    return NextResponse.json({ error: "Unable to load messages." }, { status: 500 });
  }
}
