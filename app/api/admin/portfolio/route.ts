import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/content-store";

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
    const title = String(body.title ?? "").trim();
    const summary = String(body.summary ?? "").trim();
    if (!title || !summary) return NextResponse.json({ error: "Title and summary are required." }, { status: 400 });

    const slug = slugify(String(body.slug ?? title));
    if (!slug) return NextResponse.json({ error: "A valid project slug is required." }, { status: 400 });

    const existingSlug = await prisma.portfolioProject.findUnique({ where: { slug } });
    if (existingSlug) return NextResponse.json({ error: "A project with this slug already exists." }, { status: 409 });

    const project = await prisma.portfolioProject.create({
      data: {
        title,
        slug,
        summary,
        outcome: String(body.outcome ?? "").trim() || null,
        gallery: Array.isArray(body.gallery) ? body.gallery.map(String).filter(Boolean) : [],
        tags: Array.isArray(body.tags) ? body.tags.map(String).filter(Boolean) : [],
        services: Array.isArray(body.services) ? body.services.map(String).filter(Boolean) : [],
        metrics: Array.isArray(body.metrics) ? body.metrics : [],
        gradient: String(body.gradient ?? "").trim() || "from-indigo-100 via-white to-sky-100",
      },
    });

    revalidatePath("/portfolio");
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("[admin/portfolio] POST failed:", error);
    return NextResponse.json({ error: "Unable to create portfolio work." }, { status: 500 });
  }
}
