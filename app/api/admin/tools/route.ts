import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { getEditableStartupTool, getEditableStartupTools, slugify } from "@/lib/content-store";
import { prisma } from "@/lib/prisma";

async function getCategoryId(name: string) {
  const categoryName = name.trim() || "SaaS";
  const slug = slugify(categoryName) || "saas";
  const category = await prisma.toolCategory.upsert({
    where: { slug },
    update: { name: categoryName },
    create: {
      name: categoryName,
      slug,
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

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  try {
    return NextResponse.json(await getEditableStartupTools());
  } catch {
    return NextResponse.json({ error: "Unable to load startup tools." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const summary = String(body.summary ?? "").trim();
    const description = String(body.description ?? summary).trim();
    const thumbnail = String(body.thumbnail ?? "").trim();
    const slug = slugify(String(body.slug ?? name));
    const rawPrice = Number(body.price ?? 0);

    if (!name || !summary) {
      return NextResponse.json({ error: "Name and summary are required." }, { status: 400 });
    }

    if (!thumbnail) {
      return NextResponse.json({ error: "Thumbnail image is required." }, { status: 400 });
    }

    if (!slug) {
      return NextResponse.json({ error: "A valid tool slug is required." }, { status: 400 });
    }

    if (!Number.isFinite(rawPrice) || rawPrice < 0 || Math.round(rawPrice * 1000) !== rawPrice * 1000) {
      return NextResponse.json({ error: "Price must be a valid non-negative number with at most 3 decimal places." }, { status: 400 });
    }

    const categoryId = await getCategoryId(String(body.category ?? "SaaS"));

    const tool = await prisma.startupTool.create({
      data: {
        name,
        slug,
        summary,
        description: description || summary,
        price: rawPrice,
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

    const normalized = await getEditableStartupTool(tool.slug);
    return NextResponse.json(normalized ?? { ...tool, price: rawPrice }, { status: 201 });
  } catch (error) {
    console.error("Unable to save tool:", error);
    return NextResponse.json({ error: "Unable to save tool." }, { status: 500 });
  }
}
