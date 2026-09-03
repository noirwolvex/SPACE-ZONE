import Link from "next/link";
import { ArrowRight, CheckCircle2, ExternalLink, Layers3, Megaphone, Printer, Store } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { portfolioCapabilities, portfolioProjects, type PortfolioProject } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

const studioStats = [
  { label: "Core focus", value: "Print + Digital" },
  { label: "Creative lanes", value: "6" },
  { label: "Delivery style", value: "Launch-ready" },
];

type DisplayProject = PortfolioProject & { id?: string; gallery?: string[] };

async function getSelectedWork(): Promise<DisplayProject[]> {
  try {
    const records = await prisma.portfolioProject.findMany({ orderBy: { createdAt: "desc" } });
    const managed = records.map((record) => ({
      id: record.id,
      title: record.title,
      category: record.tags[0] ?? "Selected Work",
      summary: record.summary,
      outcome: record.outcome ?? "",
      services: record.services.length ? record.services : record.tags,
      gradient: record.gradient,
      gallery: record.gallery,
      metrics: Array.isArray(record.metrics) ? (record.metrics as { label: string; value: string }[]) : [],
    }));

    // Keep the original six built-in projects. Admin-created projects are added
    // before them, while matching titles are not duplicated.
    const managedTitles = new Set(managed.map((project) => project.title.trim().toLowerCase()));
    const legacy = portfolioProjects.filter(
      (project) => !managedTitles.has(project.title.trim().toLowerCase())
    );

    return [...managed, ...legacy];
  } catch {
    return portfolioProjects;
  }
}

export default async function Portfolio() {
  const selectedWork = await getSelectedWork();
  return (
    <main className="flex-1 bg-slate-50 pt-24 pb-16 text-slate-900 transition-colors dark:bg-[#050505] dark:text-white">
      <div className="container mx-auto max-w-6xl px-4">
        <section className="grid gap-10 border-b border-slate-200 pb-14 dark:border-indigo-900/30 lg:grid-cols-[1fr_0.72fr] lg:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-sm font-semibold text-indigo-700 shadow-sm dark:border-indigo-500/30 dark:bg-slate-900/60 dark:text-indigo-300"><Layers3 className="h-4 w-4" />Space Zone Media Portfolio</div>
            <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white md:text-6xl">Printing, design, and marketing work built to launch cleanly.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">A curated portfolio of practical creative work across physical and digital brand touchpoints.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white">Start a Project<ArrowRight className="h-4 w-4" /></Link><a href="https://www.instagram.com/spacezonemedia/" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 dark:border-indigo-500/30 dark:bg-[#0a0f1e] dark:text-slate-200"><ExternalLink className="h-4 w-4" />View Instagram</a></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">{studioStats.map((stat)=><div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/40"><p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p><p className="mt-2 text-2xl font-extrabold">{stat.value}</p></div>)}</div>
        </section>
        <section className="py-14">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><h2 className="text-3xl font-bold tracking-tight">Selected Work</h2><p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">Projects managed from the admin portfolio workspace and the original showcase work.</p></div><div className="flex flex-wrap gap-2">{portfolioCapabilities.slice(0,3).map((capability)=><span key={capability} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium dark:border-indigo-500/20 dark:bg-slate-900/50">{capability}</span>)}</div></div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">{selectedWork.map((project)=><article key={project.id??project.title} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md dark:border-indigo-500/20 dark:bg-slate-900/40"><div className={`relative min-h-48 overflow-hidden bg-gradient-to-br ${project.gradient} p-0`}>{project.gallery?.[0]?<img src={project.gallery[0]} alt={project.title} className="absolute inset-0 h-full w-full object-cover"/>:null}<div className="relative m-6 rounded-2xl border border-white/70 bg-white/70 p-4 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-950/55"><p className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">{project.category}</p><h3 className="mt-2 text-xl font-extrabold text-slate-950 dark:text-white">{project.title}</h3></div></div><div className="p-6"><p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{project.summary}</p>{project.metrics?.length>0&&<div className="mt-5 grid grid-cols-2 gap-3">{project.metrics.map((metric)=><div key={`${metric.label}-${metric.value}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-indigo-500/20 dark:bg-slate-950/40"><p className="text-xs text-slate-500">{metric.label}</p><p className="mt-1 text-sm font-bold">{metric.value}</p></div>)}</div>}<div className="mt-5 flex flex-wrap gap-2">{project.services.slice(0,4).map((service)=><span key={service} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">{service}</span>)}</div></div></article>)}</div>
        </section>
        <section className="grid gap-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/40 md:p-8 lg:grid-cols-[0.8fr_1fr]"><div><h2 className="text-3xl font-bold tracking-tight">What the portfolio is built around</h2><p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">Printing, design, marketing, storefront visuals, and digital delivery.</p></div><div className="grid gap-4 sm:grid-cols-2">{[{icon:Printer,title:"Print-ready design",text:"Posters, cards, business materials, and campaign assets."},{icon:Store,title:"Storefront visuals",text:"Banners and promotional layouts for e-commerce and retail."},{icon:Megaphone,title:"Marketing content",text:"Social visuals, campaign structures, and launch messaging."},{icon:CheckCircle2,title:"Digital delivery",text:"Web, SEO, and conversion-focused launch pages."}].map((item)=><div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-indigo-500/20 dark:bg-slate-950/40"><item.icon className="h-6 w-6 text-indigo-600 dark:text-indigo-300"/><h3 className="mt-4 font-bold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.text}</p></div>)}</div></section>
      </div>
    </main>
  );
}
