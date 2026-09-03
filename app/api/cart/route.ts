import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const TOOL_KIND = "TOOL";

export async function GET() {
  const auth = await getCurrentUser();

  if (!auth?.profile) {
    return NextResponse.json({ items: [] });
  }

  const items = await prisma.shoppingCartItem.findMany({
    where: { customerId: auth.profile.id, kind: TOOL_KIND },
    orderBy: { createdAt: "desc" },
  });

  const toolSlugs = items.map((item) => item.slug);
  const tools = toolSlugs.length
    ? await prisma.startupTool.findMany({
        where: { slug: { in: toolSlugs } },
        select: { id: true, slug: true },
      })
    : [];
  const toolIdsBySlug = new Map(tools.map((tool) => [tool.slug, tool.id]));

  const validItems = items.filter((item) => {
    const category = item.category.trim().toUpperCase();
    return category !== "BOOK" && toolIdsBySlug.has(item.slug);
  });

  return NextResponse.json({
    items: validItems.map((item) => ({
      id: toolIdsBySlug.get(item.slug) ?? null,
      kind: item.kind,
      slug: item.slug,
      name: item.name,
      category: item.category,
      priceLabel: item.priceLabel,
      thumbnail: item.thumbnail ?? "",
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentUser();

  if (!auth?.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { kind, slug, name, category, priceLabel, thumbnail } = payload as {
    kind?: string;
    slug?: string;
    name?: string;
    category?: string;
    priceLabel?: string;
    thumbnail?: string;
  };

  if (kind !== TOOL_KIND) {
    return NextResponse.json({ error: "Only startup tools can be added to this cart." }, { status: 400 });
  }

  if (!slug || !name || !category || !priceLabel) {
    return NextResponse.json({ error: "Missing required cart item fields" }, { status: 400 });
  }

  if (category.trim().toUpperCase() === "BOOK") {
    return NextResponse.json({ error: "Books use direct purchase and are not part of the tool cart." }, { status: 400 });
  }

  const tool = await prisma.startupTool.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!tool) {
    return NextResponse.json({ error: "The selected tool is not available." }, { status: 400 });
  }

  const item = await prisma.shoppingCartItem.upsert({
    where: {
      customerId_kind_slug: {
        customerId: auth.profile.id,
        kind: TOOL_KIND,
        slug,
      },
    },
    update: {
      name,
      category,
      priceLabel,
      thumbnail: thumbnail ?? null,
    },
    create: {
      customerId: auth.profile.id,
      kind: TOOL_KIND,
      slug,
      name,
      category,
      priceLabel,
      thumbnail: thumbnail ?? null,
    },
  });

  return NextResponse.json({
    item: {
      id: tool.id,
      kind: item.kind,
      slug: item.slug,
      name: item.name,
      category: item.category,
      priceLabel: item.priceLabel,
      thumbnail: item.thumbnail ?? "",
    },
  });
}

export async function DELETE(request: NextRequest) {
  const auth = await getCurrentUser();

  if (!auth?.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind");
  const slug = searchParams.get("slug");

  if (kind !== TOOL_KIND || !slug) {
    return NextResponse.json({ error: "Only startup tool cart items can be removed." }, { status: 400 });
  }

  await prisma.shoppingCartItem.deleteMany({
    where: {
      customerId: auth.profile.id,
      kind: TOOL_KIND,
      slug,
    },
  });

  return NextResponse.json({ success: true });
}
