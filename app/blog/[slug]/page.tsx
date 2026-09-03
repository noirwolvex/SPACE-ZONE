import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const revalidate = 0;

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug: decodeURIComponent(slug) },
    select: { title: true, content: true },
  });

  if (!post) {
    return { title: "Article not found | SPACE ZONE" };
  }

  return {
    title: `${post.title} | SPACE ZONE`,
    description: post.content.replace(/\s+/g, " ").trim().slice(0, 160),
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug: decodeURIComponent(slug) },
    select: {
      title: true,
      slug: true,
      content: true,
      category: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!post) notFound();

  const paragraphs = post.content
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <main className="flex-1 bg-[#050505] px-4 pb-16 pt-24 text-white sm:px-6 lg:px-8">
      <article className="mx-auto max-w-4xl">
        <Link
          href="/blog"
          className="inline-flex rounded-full border border-slate-800 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-indigo-500/50 hover:text-indigo-200"
        >
          ← Back to Blog
        </Link>

        <header className="mt-10 border-b border-slate-800 pb-8">
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">
            <span>{post.category || "Article"}</span>
            <span className="text-slate-600">•</span>
            <time dateTime={post.createdAt.toISOString()}>
              {new Intl.DateTimeFormat("en", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }).format(post.createdAt)}
            </time>
          </div>
          <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl">{post.title}</h1>
        </header>

        <div className="prose prose-invert mt-10 max-w-none">
          {paragraphs.length ? (
            paragraphs.map((paragraph, index) => (
              <p key={`${post.slug}-${index}`} className="text-lg leading-9 text-slate-300">
                {paragraph}
              </p>
            ))
          ) : (
            <p className="text-lg leading-9 text-slate-300">This article does not contain any published content yet.</p>
          )}
        </div>
      </article>
    </main>
  );
}
