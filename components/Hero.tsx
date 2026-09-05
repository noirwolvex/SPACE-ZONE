import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { EditableHomePage } from "@/lib/content-store";

export default function Hero({ home }: { home: EditableHomePage }) {
  const title = home.heroTitle;
  const highlight = home.heroHighlight.trim();
  const highlightIndex = highlight ? title.lastIndexOf(highlight) : -1;
  const before = highlightIndex >= 0 ? title.slice(0, highlightIndex) : title;
  const after = highlightIndex >= 0 ? title.slice(highlightIndex + highlight.length) : "";

  return (
    <section className="relative min-h-[90vh] w-full flex items-center overflow-hidden bg-gradient-to-br from-white via-sky-50 to-indigo-100 dark:from-[#050505] dark:via-[#0b1220] dark:to-[#111827] transition-colors">
      <div className="container mx-auto px-6 md:px-12 lg:px-24 relative z-10 pt-16">
        <div className="w-full max-w-4xl pt-12 lg:pt-0 text-left relative z-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-200/50 dark:bg-white/5 border border-slate-300 dark:border-white/10 backdrop-blur-sm mb-6">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-medium tracking-wide text-slate-700 dark:text-gray-300 uppercase">{home.badge}</span>
          </div>

          <h1 className="text-5xl md:text-6xl tracking-tight lg:text-7xl font-extrabold text-slate-900 dark:text-white leading-[1.1] mb-6">
            {before}
            {highlightIndex >= 0 ? <><br className="hidden md:block" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400">{highlight}</span>{after}</> : null}
          </h1>

          <p className="text-slate-600 dark:text-slate-300 text-lg md:text-xl max-w-xl font-light leading-relaxed mb-10">{home.heroDescription}</p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link href={home.primaryCtaHref} className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.3)] dark:shadow-[0_0_20px_rgba(79,70,229,0.4)]">
              {home.primaryCtaLabel}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href={home.secondaryCtaHref} className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-[#0a0f1e] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-indigo-500/30 font-semibold rounded-full hover:bg-slate-50 dark:hover:bg-indigo-950/40 hover:border-slate-400 dark:hover:border-indigo-400/50 transition-all flex items-center justify-center">
              {home.secondaryCtaLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
