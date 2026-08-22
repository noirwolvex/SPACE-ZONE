import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/content-store";
import { portfolioProjects } from "@/lib/portfolio";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  try {
    for (const project of portfolioProjects) {
      const slug = slugify(project.title);
      await prisma.portfolioProject.upsert({
        where: { slug },
        update: {},
        create: {
          title: project.title,
          slug,
          summary: project.summary,
          outcome: project.outcome,
          gallery: [],
          tags: [project.category, ...project.services].filter(Boolean),
          services: project.services,
          metrics: project.metrics,
          gradient: project.gradient,
        },
      });
    }

    return NextResponse.json(await prisma.portfolioProject.findMany({ orderBy: { createdAt: "asc" } }));
  } catch {
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
  } catch {
    return NextResponse.json({ error: "Unable to create portfolio work." }, { status: 500 });
  }
}
