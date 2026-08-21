import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Package } from "lucide-react";
import { AddToCartButton } from "@/components/tools/AddToCartButton";
import { getEditableStartupTool } from "@/lib/content-store";

type ToolDetailProps = {
  params: Promise<{ slug: string }>;
};

export default async function ToolDetail({ params }: ToolDetailProps) {
  const { slug } = await params;
  const tool = await getEditableStartupTool(slug);

  if (!tool) {
    notFound();
  }

  return (
    <main className="flex-1 bg-slate-50 pt-24 pb-16 text-slate-900 transition-colors dark:bg-[#050505] dark:text-white">
      <div className="container mx-auto max-w-6xl px-4">
        <Link href="/tools" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-indigo-700 transition hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200">
          <ArrowLeft className="h-4 w-4" />
          Back to tools
        </Link>

        <section className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-900/30 dark:text-indigo-300">
                {tool.category}
              </span>
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-300">
                {tool.priceLabel}
              </span>
            </div>
            <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white md:text-6xl">
              {tool.name}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              {tool.summary}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <AddToCartButton
                tool={{
                  slug: tool.slug,
                  name: tool.name,
                  category: tool.category,
                  priceLabel: tool.priceLabel,
                  thumbnail: tool.thumbnail,
                }}
              />
              <Link href="/contact" className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 dark:border-indigo-500/30 dark:bg-[#0a0f1e] dark:text-slate-200 dark:hover:bg-indigo-950/40">
                Ask a Question
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-indigo-500/20 dark:bg-slate-900/40 dark:shadow-none">
            <div className="relative aspect-16/10 w-full">
              <Image
                src={tool.thumbnail}
                alt={`${tool.name} preview`}
                fill
                priority
                sizes="(min-width: 1024px) 44vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        <section className="mt-14 grid gap-8 lg:grid-cols-[1fr_0.72fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/40 dark:shadow-none md:p-8">
            <h2 className="text-2xl font-bold text-slate-950 dark:text-white">What it does</h2>
            <p className="mt-4 leading-8 text-slate-600 dark:text-slate-300">
              {tool.description}
            </p>

            <h2 className="mt-10 text-2xl font-bold text-slate-950 dark:text-white">Key benefits</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {tool.benefits.map((benefit) => (
                <div key={benefit} className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-indigo-500/20 dark:bg-slate-950/40">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                  <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">{benefit}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/40 dark:shadow-none">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">Included</h2>
              </div>
              <ul className="mt-5 space-y-3">
                {tool.includedFiles.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/40 dark:shadow-none">
              <h2 className="text-xl font-bold text-slate-950 dark:text-white">Best for</h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {tool.bestFor.map((item) => (
                  <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700 dark:border-indigo-500/20 dark:bg-indigo-950/30 dark:text-slate-200">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
