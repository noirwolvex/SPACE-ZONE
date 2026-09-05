import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/content-store";

function list(value: unknown) { return Array.isArray(value) ? value.map(String).map((x) => x.trim()).filter(Boolean).slice(0, 12) : []; }
function text(value: unknown, max = 3000) { const v = String(value ?? "").trim(); return v ? v.slice(0, max) : null; }

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;
  try {
    const { id } = await params;
    const body = await request.json();
    const project = await prisma.portfolioProject.update({
      where: { id },
      data: {
        title: String(body.title ?? "").trim().slice(0, 300), slug: slugify(String(body.slug ?? body.title ?? "")), summary: String(body.summary ?? "").trim().slice(0, 3000),
        outcome: text(body.outcome), challenge: text(body.challenge), solution: text(body.solution), process: list(body.process), techStack: list(body.techStack), industry: text(body.industry, 160), duration: text(body.duration, 120),
        gallery: list(body.gallery), tags: list(body.tags), services: list(body.services), metrics: Array.isArray(body.metrics) ? body.metrics.slice(0, 8) : [],
        gradient: String(body.gradient ?? "").trim() || "from-indigo-100 via-white to-sky-100",
      },
    });
    revalidatePath('/portfolio'); revalidatePath(`/portfolio/${project.slug}`); revalidatePath('/');
    return NextResponse.json(project);
  } catch (error) { console.error("[admin/portfolio] PUT failed:", error); return NextResponse.json({ error: 'Unable to update portfolio work.' }, { status: 500 }); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;
  try { const { id } = await params; await prisma.portfolioProject.delete({ where: { id } }); revalidatePath('/portfolio'); revalidatePath('/'); return NextResponse.json({ ok: true }); }
  catch (error) { console.error("[admin/portfolio] DELETE failed:", error); return NextResponse.json({ error: 'Unable to delete portfolio work.' }, { status: 500 }); }
}
