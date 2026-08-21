import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { websiteSchema } from "@/lib/website-validation";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  const { id } = await params;
  const website = await prisma.website.findUnique({ where: { id } });
  if (!website) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(website);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  const { id } = await params;
  const body = await request.json();
  const parsed = websiteSchema.safeParse({
    title: body?.title ?? "",
    summary: body?.summary ?? "",
    category: body?.category ?? "",
    price: Number(body?.price ?? 0),
    currency: body?.currency ?? "",
    websiteUrl: body?.websiteUrl ?? "",
    isPublished: Boolean(body?.isPublished),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed." }, { status: 400 });
  }

  const metadata = parsed.data;
  const updated = await prisma.website.update({ where: { id }, data: {
    title: metadata.title.trim(),
    summary: metadata.summary?.trim() || null,
    category: metadata.category.trim(),
    price: metadata.price ?? 0,
    currency: metadata.currency.trim(),
    websiteUrl: metadata.websiteUrl.trim(),
    isPublished: Boolean(metadata.isPublished),
  }});

  return NextResponse.json(updated);
}
