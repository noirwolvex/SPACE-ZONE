import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ExternalLink, Layers3, Megaphone, Printer, Store, Target, Clock3, Wrench } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

type Metric = { label: string; value: string };

type DisplayProject = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  outcome: string;
  challenge: string;
  solution: string;
  process: string[];
  techStack: string[];
  industry: string;
  duration: string;
  gallery: string[];
  tags: string[];
  services: string[];
  metrics: Metric[];
  gradient: string;
};

async function getSelectedWork(): Promise<DisplayProject[]> {
  const records = await prisma.portfolioProject.findMany({ orderBy: { createdAt: "desc" } });
  return records.map((record) => ({
    id: record.id,
    title: record.title,
    slug: record.slug,
    summary: record.summary,
    outcome: record.outcome ?? "",
    challenge: record.challenge ?? "",
    solution: record.solution ?? "",
    process: record.process ?? [],
    techStack: record.techStack ?? [],
    industry: record.industry ?? "",
    duration: record.duration ?? "",
    gallery: Array.from(new Set((record.gallery ?? []).filter(Boolean))),
    tags: record.tags ?? [],
    services: record.services?.length ? record.services : record.tags ?? [],
    metrics: Array.isArray(record.metrics) ? (record.metrics as Metric[]).filter((metric) => metric?.label && metric?.value) : [],
    gradient: record.gradient,
  }));
}

const portfolioCapabilities = ["Printing materials", "Store banners", "Brand identity", "Social media content", "SEO campaigns", "Web launch pages"];

export default async function Portfolio() {
  const selectedWork = await getSelectedWork();
  const studioStats = [
    { label: "Selected projects", value: String(selectedWork.length) },
    { label: "Creative lanes", value: String(new Set(selectedWork.flatMap((project) => project.services)).size) },
    { label: "Delivery style", value: "Launch-ready" },
  ];

  return (
    <main className="flex-1 bg-slate-50 pt-24 pb-16 text-slate-900 transition-colors dark:bg-[#050505] dark:text-white">
      <div className="container mx-auto max-w-7xl px-4">
        <section className="grid gap-10 border-b border-slate-200 pb-14 dark:border-indigo-900/30 lg:grid-cols-[1fr_0.72fr] lg:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-sm font-semibold text-indigo-700 shadow-sm dark:border-indigo-500/30 dark:bg-slate-900/60 dark:text-indigo-300">
              <Layers3 className="h-4 w-4" />Space Zone Media Portfolio
            </div>
            <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white md:text-6xl">Printing, design, and marketing work built to launch cleanly.</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">A complete portfolio view powered directly by the same project records managed in the admin portfolio workspace.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white">Start a Project<ArrowRight className="h-4 w-4" /></Link><a href="https://www.instagram.com/spacezonemedia/" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 dark:border-indigo-500/30 dark:bg-[#0a0f1e] dark:text-slate-200"><ExternalLink className="h-4 w-4" />View Instagram</a></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">{studioStats.map((stat) => <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/40"><p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p><p className="mt-2 text-2xl font-extrabold">{stat.value}</p></div>)}</div>
        </section>

        <section className="py-14">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><h2 className="text-3xl font-bold tracking-tight">Selected Work</h2><p className="mt-3 max-w-3xl text-slate-600 dark:text-slate-300">Every project below uses the same portfolio fields stored and edited from Admin → Portfolio.</p></div><div className="flex flex-wrap gap-2">{portfolioCapabilities.slice(0, 3).map((capability) => <span key={capability} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium dark:border-indigo-500/20 dark:bg-slate-900/50">{capability}</span>)}</div></div>

          {selectedWork.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-12 text-center text-slate-500 dark:border-indigo-500/20 dark:bg-slate-900/50 dark:text-slate-400">No portfolio projects have been added yet.</div> : <div className="grid gap-10 md:grid-cols-1">{selectedWork.map((project) => <article key={project.id} className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-lg dark:border-indigo-500/20 dark:bg-slate-900/40">
            <Link href={`/portfolio/${project.slug}`} className="group block"><div className={`relative min-h-[20rem] overflow-hidden bg-gradient-to-br ${project.gradient} md:min-h-[25rem]`}>{project.gallery[0] ? <Image src={project.gallery[0]} alt={project.title} fill sizes="100vw" className="object-cover transition duration-700 group-hover:scale-105" /> : null}<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-7 pt-32 md:p-10 md:pt-44"><div className="flex flex-wrap items-center gap-2">{project.industry ? <span className="rounded-full border border-white/30 bg-black/30 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur">{project.industry}</span> : null}{project.duration ? <span className="rounded-full border border-white/30 bg-black/30 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">{project.duration}</span> : null}</div><h3 className="mt-4 break-words text-3xl font-extrabold text-white md:text-5xl [overflow-wrap:anywhere]">{project.title}</h3></div></div></Link>

            <div className="grid gap-10 p-7 md:p-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.55fr)]">
              <div className="min-w-0 space-y-8">
                <section><p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">Project overview</p><p className="mt-4 break-words whitespace-pre-wrap text-lg leading-8 text-slate-600 [overflow-wrap:anywhere] dark:text-slate-300">{project.summary}</p></section>

                <div className="grid gap-5 xl:grid-cols-3">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-indigo-500/20 dark:bg-slate-950/40"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">The challenge</p><p className="mt-4 break-words whitespace-pre-wrap text-sm leading-7 text-slate-700 [overflow-wrap:anywhere] dark:text-slate-300">{project.challenge || "No challenge details added."}</p></div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-indigo-500/20 dark:bg-slate-950/40"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">The solution</p><p className="mt-4 break-words whitespace-pre-wrap text-sm leading-7 text-slate-700 [overflow-wrap:anywhere] dark:text-slate-300">{project.solution || "No solution details added."}</p></div>
                  <div className="rounded-3xl border border-indigo-200 bg-indigo-50 p-6 dark:border-indigo-500/20 dark:bg-indigo-950/30"><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700 dark:text-indigo-300">Outcome / results</p><p className="mt-4 break-words whitespace-pre-wrap text-sm leading-7 text-slate-700 [overflow-wrap:anywhere] dark:text-slate-300">{project.outcome || "No outcome details added."}</p></div>
                </div>

                {project.process.length ? <section><div className="flex items-center justify-between gap-4"><p className="text-xl font-bold">Process steps</p><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-950 dark:text-slate-400">{project.process.length} steps</span></div><div className="mt-5 grid gap-4 sm:grid-cols-2">{project.process.map((step, index) => <div key={`${step}-${index}`} className="flex min-w-0 gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-indigo-500/20 dark:bg-slate-950/40"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-black text-white">{index + 1}</span><p className="break-words whitespace-pre-wrap text-sm leading-7 text-slate-700 [overflow-wrap:anywhere] dark:text-slate-300">{step}</p></div>)}</div></section> : null}

                {project.gallery.length > 1 ? <section><div className="mb-4 flex items-center justify-between"><p className="text-xl font-bold">Gallery</p><span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{project.gallery.length} images</span></div><div className="grid gap-4 sm:grid-cols-2">{project.gallery.slice(1).map((src, index) => <div key={`${src}-${index}`} className="relative aspect-video overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 dark:border-indigo-500/20 dark:bg-slate-950"><Image src={src} alt={`${project.title} gallery ${index + 2}`} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover transition duration-500 hover:scale-105" /></div>)}</div></section> : null}
              </div>

              <aside className="min-w-0 space-y-5 lg:sticky lg:top-24 lg:self-start">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-indigo-500/20 dark:bg-slate-950/40"><p className="text-sm font-bold">Project details</p><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-1"><div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/50"><Target className="h-5 w-5 text-indigo-600 dark:text-indigo-300" /><p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Industry</p><p className="mt-2 break-words font-semibold">{project.industry || "Not specified"}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/50"><Clock3 className="h-5 w-5 text-indigo-600 dark:text-indigo-300" /><p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Duration</p><p className="mt-2 break-words font-semibold">{project.duration || "Not specified"}</p></div></div></div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-indigo-500/20 dark:bg-slate-900/50"><p className="text-sm font-bold">Services</p><div className="mt-4 flex flex-wrap gap-2">{project.services.length ? project.services.map((service) => <span key={service} className="max-w-full break-words rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 [overflow-wrap:anywhere] dark:bg-indigo-950/40 dark:text-indigo-300" >{service}</span>) : <span className="text-sm text-slate-500">No services added.</span>}</div></div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-indigo-500/20 dark:bg-slate-900/50"><p className="text-sm font-bold">Tags</p><div className="mt-4 flex flex-wrap gap-2">{project.tags.length ? project.tags.map((tag) => <span key={tag} className="max-w-full break-words rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 [overflow-wrap:anywhere] dark:border-slate-700 dark:text-slate-300">{tag}</span>) : <span className="text-sm text-slate-500">No tags added.</span>}</div></div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-indigo-500/20 dark:bg-slate-900/50"><div className="flex items-center gap-2"><Wrench className="h-5 w-5 text-indigo-600 dark:text-indigo-300"/><p className="text-sm font-bold">Technology / stack</p></div><div className="mt-4 flex flex-wrap gap-2">{project.techStack.length ? project.techStack.map((item) => <span key={item} className="max-w-full break-words rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 [overflow-wrap:anywhere] dark:border-indigo-500/30 dark:bg-indigo-950/40 dark:text-indigo-300">{item}</span>) : <span className="text-sm text-slate-500">No technology details added.</span>}</div></div>

                {project.metrics.length ? <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-indigo-500/20 dark:bg-slate-900/50"><p className="text-sm font-bold">Metrics</p><div className="mt-4 grid grid-cols-2 gap-3">{project.metrics.map((metric) => <div key={`${metric.label}-${metric.value}`} className="min-w-0 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-500/20 dark:bg-indigo-950/30"><p className="break-words text-xs font-semibold text-indigo-700 [overflow-wrap:anywhere] dark:text-indigo-300">{metric.label}</p><p className="mt-2 break-words text-lg font-extrabold [overflow-wrap:anywhere]">{metric.value}</p></div>)}</div></div> : <div className="rounded-3xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-800">No metrics added.</div>}

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-indigo-500/20 dark:bg-slate-950/40"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">URL slug</p><p className="mt-2 break-all font-mono text-sm text-slate-700 dark:text-slate-300">{project.slug}</p><p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Gradient classes</p><p className="mt-2 break-words font-mono text-xs text-slate-600 dark:text-slate-400 [overflow-wrap:anywhere]">{project.gradient || "None"}</p></div>

                <Link href={`/portfolio/${project.slug}`} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white hover:bg-indigo-500">View full case study<ArrowRight className="h-4 w-4" /></Link>
              </aside>
            </div>
          </article>)}</div>}
        </section>

        <section className="grid gap-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/40 md:p-8 lg:grid-cols-[0.8fr_1fr]"><div><h2 className="text-3xl font-bold tracking-tight">What the portfolio is built around</h2><p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">Printing, design, marketing, storefront visuals, and digital delivery.</p></div><div className="grid gap-4 sm:grid-cols-2">{[{ icon:Printer,title:"Print-ready design",text:"Posters, cards, business materials, and campaign assets."},{icon:Store,title:"Storefront visuals",text:"Banners and promotional layouts for e-commerce and retail."},{icon:Megaphone,title:"Marketing content",text:"Social visuals, campaign structures, and launch messaging."},{icon:CheckCircle2,title:"Digital delivery",text:"Web, SEO, and conversion-focused launch pages."}].map((item)=><div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-indigo-500/20 dark:bg-slate-950/40"><item.icon className="h-6 w-6 text-indigo-600 dark:text-indigo-300"/><h3 className="mt-4 font-bold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.text}</p></div>)}</div></section>
      </div>
    </main>
  );
}
