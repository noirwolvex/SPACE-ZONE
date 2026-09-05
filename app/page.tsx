import Hero from "@/components/Hero";
import FeaturedServices from "@/components/FeaturedServices";
import FeaturedTools from "@/components/FeaturedTools";
import FeaturedPortfolio from "@/components/FeaturedPortfolio";
import HomeWhy from "@/components/HomeWhy";
import { getEditableHomePage } from "@/lib/content-store";
import Link from "next/link";

export default async function Home() {
  const home = await getEditableHomePage();
  return <main className="flex-1 flex flex-col bg-slate-50 dark:bg-[#050505] transition-colors">
    <Hero home={home} />
    <FeaturedServices title={home.servicesTitle} description={home.servicesDescription} />
    <FeaturedTools title={home.toolsTitle} description={home.toolsDescription} />
    <FeaturedPortfolio title={home.portfolioTitle} description={home.portfolioDescription} />
    <HomeWhy title={home.whyTitle} description={home.whyDescription} items={home.whyItems} />
    <section className="px-4 pb-24"><div className="container mx-auto max-w-5xl rounded-3xl border border-indigo-200 bg-gradient-to-br from-white via-indigo-50 to-sky-50 p-8 shadow-sm dark:border-indigo-500/20 dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-950 md:p-12"><div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white md:text-4xl">{home.finalCtaTitle}</h2><p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">{home.finalCtaDescription}</p></div><Link href={home.finalCtaHref} className="inline-flex shrink-0 items-center justify-center rounded-full bg-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] transition hover:bg-indigo-500">{home.finalCtaLabel}</Link></div></div></section>
  </main>;
}
