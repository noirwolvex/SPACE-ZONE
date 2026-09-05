import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/content-store";

function list(value: unknown) { return Array.isArray(value) ? value.map(String).map((x) => x.trim()).filter(Boolean).slice(0, 12) : []; }
function text(value: unknown, max = 3000) { const v = String(value ?? "").trim(); return v ? v.slice(0, max) : null; }

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;
  try {
    const projects = await prisma.portfolioProject.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(projects);
  } catch (error) {
    console.error("[admin/portfolio] GET failed:", error);
    return NextResponse.json({ error: "Unable to load portfolio." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;
  try {
    const body = await request.json();
    const title = String(body.title ?? "").trim().slice(0, 300);
    const summary = String(body.summary ?? "").trim().slice(0, 3000);
    if (!title || !summary) return NextResponse.json({ error: "Title and summary are required." }, { status: 400 });
    const slug = slugify(String(body.slug ?? title));
    if (!slug) return NextResponse.json({ error: "A valid project slug is required." }, { status: 400 });
    const existingSlug = await prisma.portfolioProject.findUnique({ where: { slug } });
    if (existingSlug) return NextResponse.json({ error: "A project with this slug already exists." }, { status: 409 });

    const project = await prisma.portfolioProject.create({
      data: {
        title, slug, summary,
        outcome: text(body.outcome), challenge: text(body.challenge), solution: text(body.solution),
        process: list(body.process), techStack: list(body.techStack), industry: text(body.industry, 160), duration: text(body.duration, 120),
        gallery: list(body.gallery), tags: list(body.tags), services: list(body.services),
        metrics: Array.isArray(body.metrics) ? body.metrics.slice(0, 8) : [],
        gradient: String(body.gradient ?? "").trim() || "from-indigo-100 via-white to-sky-100",
      },
    });
    revalidatePath("/portfolio"); revalidatePath(`/portfolio/${slug}`); revalidatePath("/");
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("[admin/portfolio] POST failed:", error);
    return NextResponse.json({ error: "Unable to create portfolio work." }, { status: 500 });
  }
}
