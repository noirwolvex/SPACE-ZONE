import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const revalidate = 0;

export default async function Blog() {
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      category: true,
      createdAt: true,
    },
  });

  return (
    <main className="flex-1 bg-[#050505] px-4 pb-16 pt-24 text-white">
      <div className="relative z-10 mx-auto max-w-6xl">
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-indigo-300">SPACE ZONE Journal</p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">Latest articles and insights.</h1>
          <p className="mt-4 text-lg leading-8 text-slate-300">
            Ideas, updates, practical guides, and insights from the SPACE ZONE team.
          </p>
        </header>

        {posts.length === 0 ? (
          <div className="mx-auto mt-16 max-w-3xl rounded-[28px] border border-dashed border-indigo-900/40 bg-slate-900/30 px-6 py-20 text-center">
            <p className="font-medium text-slate-400">No posts have been published yet.</p>
          </div>
        ) : (
          <section className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => {
              const excerpt = post.content.replace(/\s+/g, " ").trim();
              const preview = excerpt.length > 180 ? `${excerpt.slice(0, 180).trimEnd()}…` : excerpt;

              return (
                <article
                  key={post.id}
                  className="group flex h-full flex-col rounded-[28px] border border-slate-800 bg-slate-900/70 p-6 shadow-[0_24px_70px_-32px_rgba(79,70,229,0.4)] transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/40"
                >
                  <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
                    <span>{post.category || "Article"}</span>
                    <time dateTime={post.createdAt.toISOString()}>
                      {new Intl.DateTimeFormat("en", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }).format(post.createdAt)}
                    </time>
                  </div>

                  <h2 className="mt-5 text-2xl font-black leading-tight text-white transition-colors group-hover:text-indigo-200">
                    {post.title}
                  </h2>
                  <p className="mt-4 flex-1 text-sm leading-7 text-slate-300">
                    {preview || "Read the full article for more details."}
                  </p>

                  <Link
                    href={`/blog/${encodeURIComponent(post.slug)}`}
                    className="mt-6 inline-flex w-fit items-center rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-indigo-400 hover:text-indigo-200"
                  >
                    Read article →
                  </Link>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
