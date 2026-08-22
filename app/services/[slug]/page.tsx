import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, MessageCircle } from "lucide-react";
import { getEditableService } from "@/lib/content-store";

type ServiceDetailProps = {
  params: Promise<{ slug: string }>;
};

export default async function ServiceDetail({ params }: ServiceDetailProps) {
  const { slug } = await params;
  const service = await getEditableService(slug);

  if (!service) {
    notFound();
  }

  return (
    <main className="flex-1 bg-slate-50 pt-24 pb-16 text-slate-900 transition-colors dark:bg-[#050505] dark:text-white">
      <div className="container mx-auto max-w-6xl px-4">
        <Link href="/services" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-indigo-700 transition hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200">
          <ArrowLeft className="h-4 w-4" />
          Back to services
        </Link>

        {service.image ? (
          <div className="mb-10 overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={service.image} alt={service.name} className="h-64 w-full object-cover sm:h-80 lg:h-[26rem]" />
          </div>
        ) : null}

        <section className="grid gap-10 lg:grid-cols-[1fr_0.72fr] lg:items-start">
          <div>
            <span className="inline-flex rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-900/30 dark:text-indigo-300">
              Service
            </span>
            <h1 className="mt-5 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white md:text-6xl">
              {service.name}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              {service.summary}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_15px_rgba(79,70,229,0.2)] transition hover:bg-indigo-500 dark:shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                <MessageCircle className="h-4 w-4" />
                Start a Project
              </Link>
              <Link href="/portfolio" className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 dark:border-indigo-500/30 dark:bg-[#0a0f1e] dark:text-slate-200 dark:hover:bg-indigo-950/40">
                View Portfolio
              </Link>
            </div>
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/40 dark:shadow-none">
            <h2 className="text-xl font-bold text-slate-950 dark:text-white">Best for</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {service.bestFor.map((item) => (
                <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700 dark:border-indigo-500/20 dark:bg-indigo-950/30 dark:text-slate-200">
                  {item}
                </span>
              ))}
            </div>
          </aside>
        </section>

        <section className="mt-14 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/40 dark:shadow-none md:p-8">
          <h2 className="text-2xl font-bold text-slate-950 dark:text-white">How we help</h2>
          <p className="mt-4 leading-8 text-slate-600 dark:text-slate-300">{service.description}</p>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/40 dark:shadow-none md:p-8">
            <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Deliverables</h2>
            <ul className="mt-5 space-y-3">
              {service.deliverables.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/40 dark:shadow-none md:p-8">
            <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Process</h2>
            <ol className="mt-5 space-y-3">
              {service.process.map((item, index) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">{index + 1}</span>
                  {item}
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>
    </main>
  );
}
