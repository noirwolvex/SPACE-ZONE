import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";
  const category = url.searchParams.get("category") || "";
  const published = url.searchParams.get("published") || "all"; // published|draft|all

  const where: any = {};
  if (q) {
    where.OR = [{ title: { contains: q, mode: "insensitive" } }, { category: { contains: q, mode: "insensitive" } }];
  }

  if (category) {
    where.category = category;
  }

  if (published === "published") where.isPublished = true;
  if (published === "draft") where.isPublished = false;

  const websites = await prisma.website.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(websites);
}
