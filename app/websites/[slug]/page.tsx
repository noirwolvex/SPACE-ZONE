import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getWebsiteImageUrl, getWebsiteVideoUrl } from "@/lib/website-storage";
import { PurchaseWebsiteButton } from "@/components/websites/PurchaseWebsiteButton";

export const revalidate = 0;

type Props = { params: Promise<{ slug: string }> };

function statusLabel(status?: string | null) {
  if (status === "IN_DEVELOPMENT") return "In Development";
  if (status === "COMING_SOON") return "Coming Soon";
  return "Live";
}

function statusTone(status?: string | null) {
  if (status === "IN_DEVELOPMENT") return "bg-amber-500/15 text-amber-700 border-amber-300 dark:text-amber-300 dark:border-amber-500/30";
  if (status === "COMING_SOON") return "bg-violet-500/15 text-violet-700 border-violet-300 dark:text-violet-300 dark:border-violet-500/30";
  return "bg-emerald-500/15 text-emerald-700 border-emerald-300 dark:text-emerald-300 dark:border-emerald-500/30";
}

export default async function WebsiteDetailsPage({ params }: Props) {
  const { slug } = await params;
  const site = await prisma.website.findFirst({ where: { slug, isPublished: true }, include: { video: true } });
  if (!site) notFound();

  const galleryPaths = Array.from(new Set([site.image, ...(site.gallery ?? [])].filter(Boolean))) as string[];
  const gallery = await Promise.all(galleryPaths.slice(0, 5).map((path) => getWebsiteImageUrl(path)));
  const videoUrl = await getWebsiteVideoUrl(site.video?.videoPath);
  const features = site.features?.split(/\r?\n/).map((item) => item.trim()).filter(Boolean) ?? [];
  const keyFeatures = site.keyFeatures ?? [];
  const techStack = site.techStack ?? [];
  const status = statusLabel(site.status);

  return (
    <main className="flex-1 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.14),transparent_32%),linear-gradient(135deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-10 text-slate-900 dark:bg-[#050505] dark:text-white sm:px-6 lg:px-8">
      <style>{`
        @keyframes detailReveal { from { opacity: 0; transform: translate3d(0,22px,0); } to { opacity: 1; transform: translate3d(0,0,0); } }
        .detail-reveal { animation: detailReveal .7s cubic-bezier(.22,1,.36,1) both; }
        @media (prefers-reduced-motion: reduce) { .detail-reveal { animation: none !important; } }
      `}</style>
      <div className="mx-auto flex max-w-[1500px] flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/websites" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-x-0.5 hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">← Back to Projects</Link>
          {site.featured ? <span className="rounded-full border border-amber-300 bg-amber-50 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-300">Featured Project</span> : null}
        </div>

        <section className="detail-reveal overflow-hidden rounded-[36px] border border-slate-200/80 bg-white/90 shadow-[0_35px_100px_-40px_rgba(15,23,42,0.38)] backdrop-blur-xl dark:border-indigo-500/20 dark:bg-slate-900/75">
          <div className="grid gap-0 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="p-5 sm:p-7 lg:p-9">
              {gallery.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {gallery.map((src, index) => (
                    <div key={`${src}-${index}`} className={`${index === 0 ? "sm:col-span-2 aspect-[16/8]" : "aspect-[4/3]"} overflow-hidden rounded-[24px] bg-slate-100 dark:bg-slate-950`}>
                      <img src={src ?? undefined} alt={`${site.title} preview ${index + 1}`} className="h-full w-full object-cover transition duration-700 hover:scale-[1.025]" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex aspect-[16/8] items-end rounded-[24px] bg-gradient-to-br from-indigo-600 via-violet-600 to-slate-950 p-7 text-white shadow-inner"><span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">Website Preview</span></div>
              )}
            </div>

            <div className="flex flex-col border-t border-slate-200 p-6 sm:p-8 lg:p-10 xl:border-l xl:border-t-0 dark:border-slate-800">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-950/50 dark:text-indigo-200">{site.category ?? "Website"}</span>
                <span className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] ${statusTone(site.status)}`}>{status}</span>
              </div>

              <h1 className="mt-5 break-words text-4xl font-black tracking-tight text-slate-950 sm:text-5xl dark:text-white">{site.title}</h1>
              <p className="mt-5 break-words text-base leading-8 text-slate-600 dark:text-slate-300">{site.summary ?? "A polished website experience built for a strong first impression."}</p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {[
                  ["Project Status", status],
                  ["Target Audience", site.targetAudience ?? "Not specified"],
                  ["Responsive", site.responsive ?? "Not specified"],
                  ["Launch Year", site.launchYear ? String(site.launchYear) : "Not specified"],
                  ["System", site.system ?? "Custom website system"],
                  ["Price", `${site.currency} ${site.price.toString()}`],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{label}</p>
                    <p className="mt-2 break-words text-sm font-bold text-slate-900 dark:text-white">{value}</p>
                  </div>
                ))}
              </div>

              {techStack.length ? <div className="mt-6"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Tech Stack</p><div className="mt-3 flex flex-wrap gap-2">{techStack.map((item) => <span key={item} className="max-w-full break-words rounded-full bg-slate-950 px-3 py-1.5 text-xs font-bold text-white dark:bg-white dark:text-slate-950">{item}</span>)}</div></div> : null}

              <div className="mt-auto pt-8">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <PurchaseWebsiteButton websiteId={site.id} />
                  <a href={site.websiteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-600 dark:bg-white dark:text-slate-950 dark:hover:bg-indigo-400"><span>Visit live website</span><ExternalLink className="h-4 w-4" /></a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {keyFeatures.length ? (
          <section className="detail-reveal rounded-[30px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_25px_70px_-35px_rgba(15,23,42,0.3)] dark:border-indigo-500/20 dark:bg-slate-900/70 sm:p-8" style={{ animationDelay: "80ms" }}>
            <div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.28em] text-indigo-500 dark:text-indigo-300">What you get</p><h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">Key Features</h2></div><span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-500 dark:border-slate-700 dark:text-slate-400">{keyFeatures.length} highlights</span></div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{keyFeatures.map((feature) => <div key={feature} className="min-w-0 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 transition hover:-translate-y-1 hover:shadow-md dark:border-indigo-500/20 dark:bg-indigo-950/25"><CheckCircle2 className="h-5 w-5 text-indigo-500 dark:text-indigo-300" /><p className="mt-3 break-words text-sm font-bold leading-6 text-indigo-900 dark:text-indigo-100">{feature}</p></div>)}</div>
          </section>
        ) : null}

        {videoUrl ? (
          <section className="detail-reveal overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_25px_70px_-35px_rgba(15,23,42,0.3)] dark:border-indigo-500/20 dark:bg-slate-900/70 sm:p-8" style={{ animationDelay: "140ms" }}>
            <div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.28em] text-indigo-500 dark:text-indigo-300">Inside the project</p><h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">Project Video</h2></div></div>
            <div className="mt-6 overflow-hidden rounded-[24px] bg-black shadow-2xl"><video controls preload="metadata" poster={gallery[0] ?? undefined} className="aspect-video w-full bg-black"><source src={videoUrl} />Your browser does not support video playback.</video></div>
          </section>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="detail-reveal min-w-0 rounded-[30px] border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 sm:p-8" style={{ animationDelay: "200ms" }}>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-indigo-500 dark:text-indigo-300">Project Story</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white">Description</h2>
            <div className="mt-5 whitespace-pre-line break-words text-base leading-8 text-slate-600 dark:text-slate-300">{site.description ?? site.summary ?? "No additional description has been added yet."}</div>
          </article>

          <article className="detail-reveal min-w-0 rounded-[30px] border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 sm:p-8" style={{ animationDelay: "260ms" }}>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-indigo-500 dark:text-indigo-300">Capabilities</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white">Features</h2>
            {features.length ? <div className="mt-5 grid gap-3">{features.map((feature) => <div key={feature} className="flex min-w-0 items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" /><span className="break-words text-sm font-semibold leading-6 text-slate-700 dark:text-slate-200">{feature}</span></div>)}</div> : <p className="mt-5 text-base leading-8 text-slate-600 dark:text-slate-300">No features have been added yet.</p>}
          </article>

          <article className="detail-reveal min-w-0 rounded-[30px] border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 sm:p-8 lg:col-span-2" style={{ animationDelay: "320ms" }}>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-indigo-500 dark:text-indigo-300">Additional Information</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white">Details</h2>
            <div className="mt-5 whitespace-pre-line break-words text-base leading-8 text-slate-600 dark:text-slate-300">{site.details ?? "Project details will appear here."}</div>
          </article>
        </section>
      </div>
    </main>
  );
}
