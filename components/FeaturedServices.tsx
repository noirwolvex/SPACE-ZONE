import Link from "next/link";
import { Code, ImageIcon, Rocket, Sparkles } from "lucide-react";
import { getEditableServices, type EditableService } from "@/lib/content-store";

function ServiceIcon({ icon }: { icon: EditableService["icon"] }) {
  if (icon === "code") return <Code className="h-8 w-8" />;
  if (icon === "rocket") return <Rocket className="h-8 w-8" />;
  if (icon === "image") return <ImageIcon className="h-8 w-8" />;
  return <Sparkles className="h-8 w-8" />;
}

export default async function FeaturedServices() {
  const services = (await getEditableServices()).slice(-4);

  return (
    <section className="py-24 relative z-10 transition-colors">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-md sm:text-4xl">Our Core Services</h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto drop-shadow-sm dark:drop-shadow">
            Comprehensive digital solutions designed to help your business scale efficiently and securely.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <Link key={service.slug} href={`/services/${service.slug}`} className="group bg-white dark:bg-slate-900/40 backdrop-blur-md p-8 rounded-2xl shadow-md dark:shadow-sm border border-slate-200 dark:border-indigo-500/20 hover:border-indigo-400/50 dark:hover:bg-slate-800/60 hover:shadow-[0_0_20px_rgba(79,70,229,0.15)] dark:hover:shadow-[0_0_20px_rgba(79,70,229,0.2)] transition duration-300">
              <div className="mb-4 inline-flex rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-indigo-600 transition-transform group-hover:scale-105 dark:border-indigo-500/30 dark:bg-indigo-900/30 dark:text-indigo-400">
                <ServiceIcon icon={service.icon} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">{service.name}</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6">{service.summary}</p>
              <span className="text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-500 dark:hover:text-indigo-300 inline-flex items-center">
                Learn more <span className="ml-1 group-hover:translate-x-1 transition-transform">&rarr;</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
