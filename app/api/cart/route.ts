import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const auth = await getCurrentUser();

  if (!auth?.profile) {
    return NextResponse.json({ items: [] });
  }

  const items = await prisma.shoppingCartItem.findMany({
    where: { customerId: auth.profile.id },
    orderBy: { createdAt: "desc" },
  });

  const toolSlugs = items.filter((item) => item.kind === "TOOL").map((item) => item.slug);
  const tools = toolSlugs.length
    ? await prisma.startupTool.findMany({
        where: { slug: { in: toolSlugs } },
        select: { id: true, slug: true },
      })
    : [];
  const toolIdsBySlug = new Map(tools.map((tool) => [tool.slug, tool.id]));

  return NextResponse.json({
    items: items.map((item) => ({
      // For tool checkout the id must be the StartupTool id, not the
      // ShoppingCartItem id. The latter is only a cart-row identifier.
      id: item.kind === "TOOL" ? toolIdsBySlug.get(item.slug) ?? null : item.id,
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

  if (!kind || !slug || !name || !category || !priceLabel) {
    return NextResponse.json({ error: "Missing required cart item fields" }, { status: 400 });
  }

  const item = await prisma.shoppingCartItem.upsert({
    where: {
      customerId_kind_slug: {
        customerId: auth.profile.id,
        kind,
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
      kind,
      slug,
      name,
      category,
      priceLabel,
      thumbnail: thumbnail ?? null,
    },
  });

  return NextResponse.json({
    item: {
      id: item.id,
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

  if (!kind || !slug) {
    return NextResponse.json({ error: "Missing kind or slug" }, { status: 400 });
  }

  await prisma.shoppingCartItem.deleteMany({
    where: {
      customerId: auth.profile.id,
      kind,
      slug,
    },
  });

  return NextResponse.json({ success: true });
}
