import Link from "next/link";
import Image from "next/image";
import { Hammer } from "lucide-react";
import { getEditableStartupTools } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export default async function ToolsPage() {
  const tools = await getEditableStartupTools();

  return (
    <main className="flex-1 flex flex-col pt-24 pb-16 bg-slate-50 dark:bg-[#050505] min-h-[90vh] transition-colors">
      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 border-b border-slate-200 dark:border-indigo-900/30 pb-10">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-4 drop-shadow-sm dark:drop-shadow-md">
              <Hammer className="w-10 h-10 text-indigo-600 dark:text-indigo-500" />
              Startup Tools
            </h1>
            <p className="mt-4 text-xl text-slate-600 dark:text-slate-300 drop-shadow-sm dark:drop-shadow">
              Premium digital tools, templates, and SaaS products engineered to accelerate your growth.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tools.map((tool) => (
            <Link key={tool.slug} href={`/tools/${tool.slug}`} className="group flex flex-col bg-white dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-indigo-500/20 rounded-2xl overflow-hidden hover:border-indigo-400/50 hover:shadow-[0_0_25px_rgba(79,70,229,0.15)] dark:hover:shadow-[0_0_25px_rgba(79,70,229,0.2)] shadow-sm dark:shadow-none transition-all duration-300">
              <div className="relative h-48 w-full overflow-hidden border-b border-slate-200 bg-slate-100 dark:border-indigo-500/20 dark:bg-slate-800/50">
                <Image
                  src={tool.thumbnail}
                  alt={`${tool.name} preview`}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 border border-indigo-200 dark:border-indigo-500/30 rounded-md">
                    {tool.category}
                  </span>
                  <span className="font-bold text-lg text-slate-900 dark:text-white">{tool.priceLabel}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{tool.name}</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6 flex-1 leading-relaxed text-sm">
                  {tool.summary}
                </p>
                <span
                  className="w-full text-center rounded-lg bg-indigo-600 hover:bg-indigo-500 border border-indigo-600 dark:border-indigo-500/50 px-4 py-2.5 text-sm font-medium text-white transition shadow-[0_4px_15px_rgba(79,70,229,0.2)] dark:shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                >
                  View Details
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
