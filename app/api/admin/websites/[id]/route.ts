import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { websiteSchema } from "@/lib/website-validation";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  const { id } = await params;
  const website = await prisma.website.findUnique({ where: { id }, include: { video: true } });
  if (!website) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(website);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);

  if (!admin.ok) return admin.response;

  const { id } = await params;
  const existing = await prisma.website.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const parsed = websiteSchema.safeParse({
    title: body?.title ?? "",
    summary: body?.summary ?? "",
    description: body?.description ?? "",
    system: body?.system ?? "",
    details: body?.details ?? "",
    features: body?.features ?? "",
    targetAudience: body?.targetAudience ?? "",
    responsive: body?.responsive ?? "",
    age: body?.age ?? "",
    gameType: body?.gameType ?? "",
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
  const updated = await prisma.website.update({
    where: { id },
    data: {
      title: metadata.title.trim(),
      summary: metadata.summary?.trim() || null,
      description: metadata.description?.trim() || null,
      system: metadata.system?.trim() || null,
      details: metadata.details?.trim() || null,
      features: metadata.features?.trim() || null,
      targetAudience: metadata.targetAudience?.trim() || null,
      responsive: metadata.responsive?.trim() || null,
      age: metadata.age?.trim() || null,
      gameType: metadata.gameType?.trim() || null,
      category: metadata.category.trim(),
      price: metadata.price ?? 0,
      currency: metadata.currency.trim(),
      websiteUrl: metadata.websiteUrl.trim(),
      isPublished: Boolean(metadata.isPublished),
    },
    include: { video: true },
  });

  return NextResponse.json(updated);
}
