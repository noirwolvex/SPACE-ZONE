import Link from "next/link";
import { ArrowRight, CheckCircle2, Compass, Layers3, Megaphone, Printer, Rocket, Sparkles } from "lucide-react";
import { services } from "@/lib/services";

const values = [
  {
    title: "Clarity before creativity",
    text: "Every design, banner, campaign, or website starts with the offer, audience, and business goal. Good visuals should make the message easier to understand.",
  },
  {
    title: "Launch-ready delivery",
    text: "We package work so it can actually be used: print-ready files, platform-ready graphics, responsive pages, and practical handoff notes.",
  },
  {
    title: "One brand, every channel",
    text: "Your print materials, Instagram posts, store banners, website, and marketing campaigns should feel like they belong to the same business.",
  },
];

const workflow = [
  "Understand the goal, audience, offer, and channels.",
  "Create a focused visual and messaging direction.",
  "Design, build, and prepare the assets for real use.",
  "Review, refine, and hand off the final launch-ready files.",
];

export default function About() {
  return (
    <main className="flex-1 bg-slate-50 pt-24 pb-16 text-slate-900 transition-colors dark:bg-[#050505] dark:text-white">
      <div className="container mx-auto max-w-6xl px-4">
        <section className="grid gap-10 border-b border-slate-200 pb-14 dark:border-indigo-900/30 lg:grid-cols-[1fr_0.72fr] lg:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-sm font-semibold text-indigo-700 shadow-sm dark:border-indigo-500/30 dark:bg-slate-900/60 dark:text-indigo-300 dark:shadow-none">
              <Sparkles className="h-4 w-4" />
              About Space Zone Media
            </div>
            <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white md:text-6xl">
              A creative media team for brands that need to look ready everywhere.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Space Zone Media brings printing, design, marketing, and digital execution together so businesses can launch with a consistent presence across storefronts, social platforms, websites, and campaigns.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/services" className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_15px_rgba(79,70,229,0.2)] transition hover:bg-indigo-500 dark:shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                Explore Services
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/portfolio" className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 dark:border-indigo-500/30 dark:bg-[#0a0f1e] dark:text-slate-200 dark:hover:bg-indigo-950/40">
                View Portfolio
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              { label: "Focus", value: "Print + Digital" },
              { label: "Approach", value: "Design-led" },
              { label: "Output", value: "Launch-ready" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/40 dark:shadow-none">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-950 dark:text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-8 py-14 lg:grid-cols-[0.75fr_1fr]">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">What we do</h2>
            <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">
              We help businesses show up professionally in the places customers actually see them: printed materials, store campaigns, social media, search results, and web experiences.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Printer, title: "Printing materials", text: "Posters, cards, flyers, menus, and production-ready campaign assets." },
              { icon: Megaphone, title: "Marketing content", text: "Social visuals, campaign graphics, launch messaging, and content systems." },
              { icon: Layers3, title: "Brand design", text: "Identity systems, store banners, layout direction, and consistent brand assets." },
              { icon: Rocket, title: "Digital growth", text: "Web pages, SEO, startup tools, and conversion-focused digital experiences." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/40 dark:shadow-none">
                <item.icon className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
                <h3 className="mt-4 font-bold text-slate-950 dark:text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/40 dark:shadow-none md:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1fr]">
            <div>
              <div className="inline-flex rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-900/30 dark:text-indigo-300">
                <Compass className="h-7 w-7" />
              </div>
              <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">How we think</h2>
              <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">
                Space Zone Media is built for practical creativity: the kind of work that looks polished, communicates fast, and can move from concept to real business use.
              </p>
            </div>

            <div className="grid gap-4">
              {values.map((value) => (
                <div key={value.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-indigo-500/20 dark:bg-slate-950/40">
                  <h3 className="font-bold text-slate-950 dark:text-white">{value.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{value.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-8 py-14 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/40 dark:shadow-none md:p-8">
            <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Our workflow</h2>
            <ol className="mt-6 space-y-4">
              {workflow.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/40 dark:shadow-none md:p-8">
            <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Services at a glance</h2>
            <div className="mt-6 space-y-3">
              {services.map((service) => (
                <Link key={service.slug} href={`/services/${service.slug}`} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-indigo-500/20 dark:bg-slate-950/40 dark:hover:bg-indigo-950/30">
                  <div>
                    <h3 className="font-bold text-slate-950 dark:text-white">{service.name}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{service.summary}</p>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-300" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-white via-indigo-50 to-sky-50 p-6 shadow-sm dark:border-indigo-500/20 dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-950 md:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.5fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Ready to make your brand feel complete?</h2>
              <p className="mt-4 max-w-2xl leading-7 text-slate-600 dark:text-slate-300">
                Bring the idea, product, campaign, or store goal. We&apos;ll help shape the visuals, message, and launch assets around it.
              </p>
            </div>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_15px_rgba(79,70,229,0.2)] transition hover:bg-indigo-500 dark:shadow-[0_0_15px_rgba(79,70,229,0.3)]">
              Get in Touch
              <CheckCircle2 className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
