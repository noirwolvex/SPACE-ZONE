import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { getEditableStartupTools, slugify } from "@/lib/content-store";
import { prisma } from "@/lib/prisma";
import { startupTools } from "@/lib/startup-tools";

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

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  try {
    const count = await prisma.startupTool.count();
    if (count === 0) {
      for (const tool of startupTools) {
        await prisma.startupTool.create({
          data: {
            name: tool.name,
            slug: tool.slug,
            summary: tool.summary,
            description: tool.description,
            price: tool.price,
            thumbnail: tool.thumbnail,
            benefits: tool.benefits,
            includedFiles: tool.includedFiles,
            bestFor: tool.bestFor,
            categoryId: await getCategoryId(tool.category),
          },
        });
      }
    }
  } catch {
    return NextResponse.json(await getEditableStartupTools());
  }

  return NextResponse.json(await getEditableStartupTools());
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  try {
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

    const slug = slugify(String(body.slug ?? name));
    const categoryId = await getCategoryId(String(body.category ?? "SaaS"));

    const tool = await prisma.startupTool.create({
      data: {
        name,
        slug,
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

    return NextResponse.json(tool, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to save tool." }, { status: 500 });
  }
}
