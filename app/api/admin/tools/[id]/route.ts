import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { slugify } from "@/lib/content-store";
import { prisma } from "@/lib/prisma";

type RouteProps = {
  params: Promise<{ id: string }>;
};

async function getCategoryId(name: string) {
  const categoryName = name.trim() || "SaaS";
  const category = await prisma.toolCategory.upsert({
    where: { slug: slugify(categoryName) },
    update: { name: categoryName },
    create: {
      name: categoryName,
      slug: slugify(categoryName),
    },
  });

  return category.id;
}

function lines(value: unknown) {
  return String(value ?? "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function PUT(request: NextRequest, { params }: RouteProps) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const summary = String(body.summary ?? "").trim();
    const thumbnail = String(body.thumbnail ?? "").trim();

    if (!name || !summary) {
      return NextResponse.json({ error: "Name and summary are required." }, { status: 400 });
    }

    if (!thumbnail) {
      return NextResponse.json({ error: "Thumbnail image is required." }, { status: 400 });
    }

    const previous = await prisma.startupTool.findUnique({ where: { id } });
    const categoryId = await getCategoryId(String(body.category ?? "SaaS"));
    const tool = await prisma.startupTool.update({
      where: { id },
      data: {
        name,
        slug: slugify(String(body.slug ?? name)),
        summary,
        description: String(body.description ?? summary).trim(),
        price: Number(body.price ?? 0),
        thumbnail,
        benefits: lines(body.benefits),
        includedFiles: lines(body.includedFiles),
        bestFor: lines(body.bestFor),
        categoryId,
      },
    });

    revalidatePath("/");
    revalidatePath("/tools");
    revalidatePath(`/tools/${tool.slug}`);
    if (previous) revalidatePath(`/tools/${previous.slug}`);

    return NextResponse.json(tool);
  } catch {
    return NextResponse.json({ error: "Unable to update tool." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteProps) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  try {
    const { id } = await params;
    const tool = await prisma.startupTool.delete({ where: { id } });

    revalidatePath("/");
    revalidatePath("/tools");
    revalidatePath(`/tools/${tool.slug}`);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to delete tool." }, { status: 500 });
  }
}
