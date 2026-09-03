import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };
type Metric = { label: string; value: string };

export default async function PortfolioDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = await prisma.portfolioProject.findUnique({ where: { slug } });
  if (!project) notFound();

  const gallery = Array.from(new Set(project.gallery.filter(Boolean)));
  const metrics = Array.isArray(project.metrics) ? (project.metrics as Metric[]).filter((metric) => metric?.label && metric?.value) : [];
  const services = project.services.length ? project.services : project.tags;

  return (
    <main className="flex-1 bg-slate-50 pt-24 pb-16 text-slate-900 dark:bg-[#050505] dark:text-white">
      <div className="container mx-auto max-w-6xl px-4">
        <Link href="/portfolio" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200">
          <ArrowLeft className="h-4 w-4" /> Back to portfolio
        </Link>

        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/50">
          <div className={`relative overflow-hidden bg-gradient-to-br ${project.gradient} p-6 sm:p-8 lg:p-10`}>
            {gallery[0] ? <div className="relative aspect-[16/8] overflow-hidden rounded-2xl"><Image src={gallery[0]} alt={project.title} fill priority sizes="100vw" className="object-cover" /></div> : <div className="h-72 rounded-2xl" />}
          </div>
          <div className="grid gap-10 p-6 sm:p-8 lg:grid-cols-[1fr_0.75fr] lg:p-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-300">{project.tags[0] ?? "Selected Work"}</p>
              <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white md:text-6xl">{project.title}</h1>
              <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-300">{project.summary}</p>
              {project.outcome ? <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-indigo-500/20 dark:bg-slate-950/40"><p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Outcome</p><p className="mt-2 leading-7 text-slate-700 dark:text-slate-300">{project.outcome}</p></div> : null}
            </div>
            <aside className="space-y-6">
              <div><p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Services</p><div className="mt-3 flex flex-wrap gap-2">{services.map((item)=><span key={item} className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-950/40 dark:text-indigo-300">{item}</span>)}</div></div>
              {metrics.length ? <div><p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Project metrics</p><div className="mt-3 grid grid-cols-2 gap-3">{metrics.map((metric)=><div key={`${metric.label}-${metric.value}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-indigo-500/20 dark:bg-slate-950/40"><p className="text-xs text-slate-500">{metric.label}</p><p className="mt-1 font-bold">{metric.value}</p></div>)}</div></div> : null}
            </aside>
          </div>
        </section>

        {gallery.length > 1 ? <section className="mt-8 grid gap-5 md:grid-cols-2">{gallery.slice(1).map((src,index)=><div key={`${src}-${index}`} className="relative aspect-video overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-indigo-500/20 dark:bg-slate-900/50"><Image src={src} alt={`${project.title} gallery ${index+2}`} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" /></div>)}</section> : null}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/50 md:p-8">
          <div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-indigo-600 dark:text-indigo-300" /><h2 className="text-2xl font-bold">Project summary</h2></div>
          <p className="mt-4 max-w-4xl leading-8 text-slate-600 dark:text-slate-300">{project.summary}</p>
          <Link href="/contact" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500">Start a project <ArrowRight className="h-4 w-4" /></Link>
        </section>
      </div>
    </main>
  );
}
