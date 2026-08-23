import Link from "next/link";
import { ArrowRight, Code, ImageIcon, Presentation, Rocket, Sparkles } from "lucide-react";
import { getEditableServices, type EditableService } from "@/lib/content-store";

export const dynamic = "force-dynamic";

function ServiceIcon({ icon }: { icon: EditableService["icon"] }) {
  if (icon === "code") return <Code className="h-8 w-8" />;
  if (icon === "rocket") return <Rocket className="h-8 w-8" />;
  if (icon === "image") return <ImageIcon className="h-8 w-8" />;
  if (icon === "sparkles") return <Sparkles className="h-8 w-8" />;
  return <Presentation className="h-8 w-8" />;
}

export default async function ServicesPage() {
  const services = await getEditableServices();

  return (
    <main className="min-h-[90vh] flex-1 bg-slate-50 pt-24 pb-16 text-slate-900 transition-colors dark:bg-[#050505] dark:text-white">
      <div className="container relative z-10 mx-auto max-w-6xl px-4">
        <div className="mb-14 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-950/30 dark:text-indigo-300">
            What we do
          </span>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white md:text-6xl">Our Services</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300 md:text-xl">
            Comprehensive digital solutions tailored for ambitious startups and forward-thinking enterprises.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {services.map((service) => (
            <Link
              key={service.slug}
              href={`/services/${service.slug}`}
              className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-[0_24px_70px_-30px_rgba(79,70,229,0.35)] dark:border-indigo-500/20 dark:bg-slate-900/60 dark:hover:border-indigo-400/40 dark:hover:bg-slate-900/80"
            >
              <div className="relative h-52 overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.22),transparent_42%),linear-gradient(135deg,#eef2ff_0%,#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.28),transparent_42%),linear-gradient(135deg,#111827_0%,#050505_100%)]">
                {service.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={service.image} alt={service.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center text-indigo-600 dark:text-indigo-300">
                    <div className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                      <ServiceIcon icon={service.icon} />
                    </div>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/35 to-transparent" />
                <div className="absolute left-5 top-5 rounded-full border border-white/50 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-800 backdrop-blur-md dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-200">
                  Service
                </div>
              </div>

              <div className="p-7 sm:p-8">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{service.name}</h3>
                    <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{service.summary}</p>
                  </div>
                  <span className="mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition-all duration-300 group-hover:border-indigo-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:group-hover:border-indigo-500/30 dark:group-hover:bg-indigo-950/40 dark:group-hover:text-indigo-300">
                    <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {service.deliverables.slice(0, 3).map((item) => (
                    <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-7 flex items-center justify-between border-t border-slate-200 pt-5 dark:border-slate-800">
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-300">Explore Service</span>
                  <span className="text-xs font-medium text-slate-400">View details →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
