import { HelpCircle } from "lucide-react";
import { getFaqs } from "@/lib/content-store";
import FAQList from "@/components/FAQList";

export const dynamic = "force-dynamic";

type FAQProps = { page?: string; limit?: number };

export default async function FAQ({ page, limit = 100 }: FAQProps) {
  const normalizedPage = page?.trim();
  const items = normalizedPage
    ? await getFaqs({ publishedOnly: true, page: normalizedPage, limit })
    : await getFaqs({ publishedOnly: true, limit });

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
        <FAQList items={items.map((item) => ({ id: String(item.id), question: item.question, answer: item.answer }))} />
      </div>
    </section>
  );
}
