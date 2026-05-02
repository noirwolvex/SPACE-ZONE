import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowRight, Code, Presentation, Rocket } from "lucide-react";

// Helper to map DB slugs/names to nice icons
function getIconForService(slug: string) {
  if (slug.includes('web')) return <Code className="w-8 h-8" />;
  if (slug.includes('seo')) return <Rocket className="w-8 h-8" />;
  return <Presentation className="w-8 h-8" />;
}

export default async function ServicesPage() {
  // Fetch services directly from the DB using Prisma
  const services = await prisma.service.findMany({
    orderBy: { createdAt: 'asc' }
  });

  return (
    <main className="flex-1 flex flex-col pt-24 pb-16 dark:bg-gray-950">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
            Our Services
          </h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Comprehensive digital solutions tailored for ambitious startups and forward-thinking enterprises.
          </p>
        </div>

        {services.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
            <p className="text-gray-500 dark:text-gray-400 font-medium">No services found. Please run the database seeder.</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {services.map((service) => (
              <div 
                key={service.id} 
                className="group relative flex flex-col p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl hover:shadow-lg dark:hover:shadow-gray-900/50 hover:border-blue-100 dark:hover:border-blue-900/50 transition-all duration-300"
              >
                <div className="mb-6 inline-flex p-3 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 w-fit">
                  {getIconForService(service.slug)}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {service.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 flex-1 leading-relaxed">
                  {service.description}
                </p>
                <Link 
                  href={`/services/${service.slug}`} 
                  className="inline-flex items-center font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 group-hover:underline"
                >
                  Explore Service <ArrowRight className="ml-2 w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
