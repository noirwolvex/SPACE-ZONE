import { ChevronDown, HelpCircle } from "lucide-react";
import { getFaqs } from "@/lib/content-store";

export const dynamic = "force-dynamic";

type FAQProps = { page?: string; limit?: number };

export default async function FAQ({ page, limit = 100 }: FAQProps) {
  const normalizedPage = page?.trim();
  const items = await getFaqs({ publishedOnly: true, ...(normalizedPage ? { page: normalizedPage } : {}), limit });
  if (!items.length) return null;

  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[.18em] text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-950/30 dark:text-indigo-300">
            <HelpCircle className="h-3.5 w-3.5" /> FAQ
          </span>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">Frequently asked questions</h2>
          <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">Clear answers to the questions clients ask before starting a project with SpaceZone.</p>
        </div>
        <div className="mt-12 space-y-4">
          {items.map((item) => (
            <details key={item.id} className="group rounded-2xl border border-slate-200 bg-white p-0 shadow-sm transition hover:border-indigo-300 dark:border-indigo-500/20 dark:bg-slate-900/60 dark:hover:border-indigo-400/40">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-6 py-5 text-left font-bold text-slate-950 marker:hidden dark:text-white [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 break-words">{item.question}</span>
                <ChevronDown aria-hidden="true" className="h-5 w-5 shrink-0 text-indigo-600 transition-transform duration-300 group-open:rotate-180 dark:text-indigo-300" />
              </summary>
              <div className="break-words whitespace-pre-wrap px-6 pb-6 pr-14 text-base leading-8 text-slate-600 dark:text-slate-300">{item.answer}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
