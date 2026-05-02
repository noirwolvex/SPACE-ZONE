import Link from "next/link";

const tools = [
  {
    title: "Startup Launch Kit",
    description: "A complete bundle of templates, legal docs, and financial models for early-stage startups.",
    price: "$49",
    category: "Bundle",
    href: "/tools/startup-launch-kit"
  },
  {
    title: "SEO Audit Pro",
    description: "Automated technical and content SEO auditing tool designed for modern Next.js/React apps.",
    price: "$29/mo",
    category: "SaaS",
    href: "/tools/seo-audit-pro"
  },
  {
    title: "Social Media Automation",
    description: "Schedule and auto-generate engaging content across platforms with AI.",
    price: "$19/mo",
    category: "SaaS",
    href: "/tools/social-automation"
  }
];

export default function FeaturedTools() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Startup Tools Marketplace</h2>
            <p className="mt-4 text-lg text-gray-600">
              Premium digital tools and resources engineered to give your team a competitive edge.
            </p>
          </div>
          <Link href="/tools" className="mt-4 md:mt-0 text-blue-600 font-medium hover:underline inline-flex items-center">
            View all tools <span className="ml-1">→</span>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tools.map((tool, index) => (
            <div key={index} className="flex flex-col border border-gray-200 rounded-2xl overflow-hidden hover:border-blue-300 transition">
              <div className="bg-gray-100 h-48 w-full flex items-center justify-center">
                <span className="text-gray-400">Image Placeholder</span>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                    {tool.category}
                  </span>
                  <span className="font-bold text-gray-900">{tool.price}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{tool.title}</h3>
                <p className="text-gray-600 mb-6 flex-1">{tool.description}</p>
                <Link
                  href={tool.href}
                  className="w-full text-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
