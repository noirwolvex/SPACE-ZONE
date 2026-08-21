import Link from "next/link";
import { ArrowRight, Code, ImageIcon, Presentation, Rocket, Sparkles } from "lucide-react";
import { getEditableServices, type EditableService } from "@/lib/content-store";

function ServiceIcon({ icon }: { icon: EditableService["icon"] }) {
  if (icon === "code") return <Code className="w-8 h-8" />;
  if (icon === "rocket") return <Rocket className="w-8 h-8" />;
  if (icon === "image") return <ImageIcon className="w-8 h-8" />;
  if (icon === "sparkles") return <Sparkles className="w-8 h-8" />;
  return <Presentation className="w-8 h-8" />;
}

export default async function ServicesPage() {
  const services = await getEditableServices();

  return (
    <main className="flex-1 flex flex-col pt-24 pb-16 bg-slate-50 dark:bg-[#050505] min-h-[90vh] transition-colors">
      <div className="container mx-auto px-4 max-w-5xl relative z-10">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-md">
            Our Services
          </h1>
          <p className="mt-4 text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto drop-shadow-sm dark:drop-shadow">
            Comprehensive digital solutions tailored for ambitious startups and forward-thinking enterprises.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {services.map((service) => (
            <Link
              key={service.slug}
              href={`/services/${service.slug}`}
              className="group relative flex flex-col p-8 bg-white dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-indigo-500/20 rounded-2xl shadow-md dark:shadow-none hover:shadow-[0_0_25px_rgba(79,70,229,0.15)] dark:hover:shadow-[0_0_25px_rgba(79,70,229,0.2)] hover:border-indigo-400/50 dark:hover:bg-slate-800/60 transition-all duration-300"
            >
              <div className="mb-6 inline-flex p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/30 w-fit drop-shadow-sm dark:drop-shadow">
                <ServiceIcon icon={service.icon} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 drop-shadow-sm">
                {service.name}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-8 flex-1 leading-relaxed">
                {service.summary}
              </p>
              <span className="inline-flex items-center font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 group-hover:underline">
                Explore Service <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
