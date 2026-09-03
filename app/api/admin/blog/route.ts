import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { slugify } from "@/lib/content-store";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    include: { seoMetadata: true },
  });
  return NextResponse.json(posts);
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;
  try {
    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const content = String(body.content ?? "").trim();
    const category = String(body.category ?? "").trim();
    const slug = slugify(String(body.slug ?? title));
    if (!title || !content || !category || !slug) {
      return NextResponse.json({ error: "Title, slug, category, and content are required." }, { status: 400 });
    }
    const seo = body.seo && typeof body.seo === "object" ? body.seo : null;
    const post = await prisma.$transaction(async (tx) => {
      const created = await tx.blogPost.create({
        data: {
          title,
          slug,
          content,
          category,
          seoMetadata: seo?.title || seo?.description || seo?.ogImage
            ? { create: { title: String(seo.title ?? title), description: String(seo.description ?? ""), ogImage: String(seo.ogImage ?? "") || null, slug } }
            : undefined,
        },
        include: { seoMetadata: true },
      });
      return created;
    });
    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Unable to create blog post:", error);
    return NextResponse.json({ error: "Unable to create blog post." }, { status: 500 });
  }
}
