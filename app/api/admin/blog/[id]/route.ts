import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { slugify } from "@/lib/content-store";

type RouteProps = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteProps) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;
  try {
    const { id } = await params;
    const body = await request.json();
    const previous = await prisma.blogPost.findUnique({ where: { id } });
    if (!previous) return NextResponse.json({ error: "Post not found." }, { status: 404 });
    const title = String(body.title ?? "").trim();
    const content = String(body.content ?? "").trim();
    const category = String(body.category ?? "").trim();
    const slug = slugify(String(body.slug ?? title));
    if (!title || !content || !category || !slug) return NextResponse.json({ error: "Title, slug, category, and content are required." }, { status: 400 });
    const conflicting = await prisma.blogPost.findFirst({ where: { slug, NOT: { id } }, select: { id: true } });
    if (conflicting) return NextResponse.json({ error: "A post with this slug already exists." }, { status: 409 });
    const seo = body.seo && typeof body.seo === "object" ? body.seo : null;
    const post = await prisma.$transaction(async (tx) => {
      const updated = await tx.blogPost.update({ where: { id }, data: { title, slug, content, category }, include: { seoMetadata: true } });
      if (seo?.title || seo?.description || seo?.ogImage) {
        if (updated.seoId) {
          await tx.seoMetadata.update({ where: { id: updated.seoId }, data: { title: String(seo.title ?? title), description: String(seo.description ?? ""), ogImage: String(seo.ogImage ?? "") || null, slug } });
        } else {
          const metadata = await tx.seoMetadata.create({ data: { title: String(seo.title ?? title), description: String(seo.description ?? ""), ogImage: String(seo.ogImage ?? "") || null, slug } });
          await tx.blogPost.update({ where: { id }, data: { seoId: metadata.id } });
        }
      }
      return tx.blogPost.findUnique({ where: { id }, include: { seoMetadata: true } });
    });
    revalidatePath("/blog"); revalidatePath(`/blog/${post?.slug}`); if (previous.slug !== slug) revalidatePath(`/blog/${previous.slug}`);
    return NextResponse.json(post);
  } catch (error) {
    console.error("Unable to update blog post:", error);
    return NextResponse.json({ error: "Unable to update blog post." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteProps) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;
  try {
    const { id } = await params;
    const post = await prisma.blogPost.delete({ where: { id } });
    revalidatePath("/blog"); revalidatePath(`/blog/${post.slug}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Unable to delete blog post:", error);
    return NextResponse.json({ error: "Unable to delete blog post." }, { status: 500 });
  }
}
