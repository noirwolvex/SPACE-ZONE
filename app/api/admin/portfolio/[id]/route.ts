import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/content-store";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;
  try {
    const { id } = await params;
    const body = await request.json();
    const project = await prisma.portfolioProject.update({
      where: { id },
      data: {
        title: String(body.title ?? "").trim(), slug: slugify(String(body.slug ?? body.title ?? "")), summary: String(body.summary ?? "").trim(),
        outcome: String(body.outcome ?? "").trim() || null,
        gallery: Array.isArray(body.gallery) ? body.gallery.map(String).filter(Boolean) : [],
        tags: Array.isArray(body.tags) ? body.tags.map(String).filter(Boolean) : [],
        services: Array.isArray(body.services) ? body.services.map(String).filter(Boolean) : [],
        metrics: Array.isArray(body.metrics) ? body.metrics : [],
        gradient: String(body.gradient ?? "").trim() || "from-indigo-100 via-white to-sky-100",
      },
    });
    revalidatePath('/portfolio'); return NextResponse.json(project);
  } catch { return NextResponse.json({ error: 'Unable to update portfolio work.' }, { status: 500 }); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;
  try { const { id } = await params; await prisma.portfolioProject.delete({ where: { id } }); revalidatePath('/portfolio'); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: 'Unable to delete portfolio work.' }, { status: 500 }); }
}
