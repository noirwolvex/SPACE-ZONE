import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Layers3, Target, Wrench } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;
type Props = { params: Promise<{ slug: string }> };
type Metric = { label: string; value: string };

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="min-h-[280px] rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/50 sm:p-9 lg:min-h-[320px] lg:p-10"><h2 className="text-2xl font-bold text-slate-950 dark:text-white sm:text-3xl">{title}</h2><div className="mt-6 break-words whitespace-pre-wrap text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-9">{children}</div></section>;
}

export default async function PortfolioDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = await prisma.portfolioProject.findUnique({ where: { slug } });
  if (!project) notFound();
  const gallery = Array.from(new Set(project.gallery.filter(Boolean)));
  const metrics = Array.isArray(project.metrics) ? (project.metrics as Metric[]).filter((metric) => metric?.label && metric?.value) : [];
  const services = project.services.length ? project.services : project.tags;

  return <main className="flex-1 bg-slate-50 pt-24 pb-16 text-slate-900 dark:bg-[#050505] dark:text-white"><div className="container mx-auto max-w-6xl px-4">
    <Link href="/portfolio" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"><ArrowLeft className="h-4 w-4"/>Back to portfolio</Link>
    <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/50">
      <div className={`relative overflow-hidden bg-gradient-to-br ${project.gradient} p-4 sm:p-6 lg:p-8`}>{gallery[0]?<div className="relative aspect-[16/8] overflow-hidden rounded-[24px]"><Image src={gallery[0]} alt={project.title} fill priority sizes="100vw" className="object-cover"/></div>:<div className="h-72 rounded-[24px]"/>}</div>
      <div className="p-6 sm:p-8 lg:p-12"><div className="max-w-4xl"><p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-300">{project.industry||project.tags[0]||"Case Study"}</p><h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white md:text-6xl">{project.title}</h1><p className="mt-6 text-xl leading-9 text-slate-600 dark:text-slate-300">{project.summary}</p></div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["Industry",project.industry,Target],["Duration",project.duration,Clock3],["Services",services.slice(0,2).join(" · "),Layers3],["Tools",project.techStack.slice(0,2).join(" · "),Wrench]].map(([label,value,Icon])=>value?<div key={String(label)} className="min-h-[132px] rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-indigo-500/20 dark:bg-slate-950/40"><Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-300"/><p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p><p className="mt-2 break-words font-semibold leading-6">{String(value)}</p></div>:null)}</div>
        {metrics.length?<div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">{metrics.map(m=><div key={`${m.label}-${m.value}`} className="min-h-[110px] rounded-2xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-500/20 dark:bg-indigo-950/30"><p className="break-words text-xs font-semibold text-indigo-700 dark:text-indigo-300">{m.label}</p><p className="mt-2 break-words text-2xl font-extrabold text-slate-950 dark:text-white">{m.value}</p></div>)}</div>:null}
      </div>
    </section>
    <div className="mt-8 grid gap-8 lg:grid-cols-2">
      {project.challenge?<Block title="The challenge"><p>{project.challenge}</p></Block>:null}
      {project.solution?<Block title="The solution"><p>{project.solution}</p></Block>:null}
    </div>
    {project.process.length?<section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/50 md:p-8"><h2 className="text-2xl font-bold">How we built it</h2><div className="mt-6 grid gap-4 md:grid-cols-2">{project.process.map((step,index)=><div key={`${step}-${index}`} className="min-h-[112px] flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-indigo-500/20 dark:bg-slate-950/40"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-black text-white">{index+1}</span><p className="break-words leading-7 text-slate-700 dark:text-slate-300">{step}</p></div>)}</div></section>:null}
    {gallery.length>1?<section className="mt-8 grid gap-5 md:grid-cols-2">{gallery.slice(1).map((src,index)=><div key={`${src}-${index}`} className="relative aspect-video overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-indigo-500/20 dark:bg-slate-900/50"><Image src={src} alt={`${project.title} gallery ${index+2}`} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover"/></div>)}</section>:null}
    {project.techStack.length?<section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/50 md:p-8"><h2 className="text-2xl font-bold">Technology & tools</h2><div className="mt-5 flex flex-wrap gap-2">{project.techStack.map(item=><span key={item} className="break-words rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-950/40 dark:text-indigo-300">{item}</span>)}</div></section>:null}
    <div className="mt-8 grid gap-8">{project.outcome?<Block title="The outcome"><p>{project.outcome}</p></Block>:null}<section className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-white via-indigo-50 to-sky-50 p-6 shadow-sm dark:border-indigo-500/20 dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-950 md:p-8"><div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between"><div><div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-indigo-600 dark:text-indigo-300"/><h2 className="text-2xl font-bold">Ready for your own case study?</h2></div><p className="mt-3 max-w-2xl leading-7 text-slate-600 dark:text-slate-300">Bring us the goal, product, campaign, or website. We will turn the next idea into launch-ready work.</p></div><Link href="/contact" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-indigo-500">Start a project <ArrowRight className="h-4 w-4"/></Link></div></section></div>
  </div></main>;
}
