import Link from "next/link";

const services = [
  {
    title: "Web & App Development",
    description: "Custom, scalable applications built with modern frameworks to power your digital presence.",
    icon: "💻",
    href: "/services/web-development"
  },
  {
    title: "SEO & Digital Marketing",
    description: "Data-driven strategies to increase your visibility and drive high-quality traffic to your platform.",
    icon: "🚀",
    href: "/services/seo-marketing"
  },
  {
    title: "Brand Identity",
    description: "Memorable design systems and branding that resonate with your target audience.",
    icon: "✨",
    href: "/services/brand-identity"
  }
];

export default function FeaturedServices() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Our Core Services</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Comprehensive digital solutions designed to help your business scale efficiently and securely.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div key={index} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="text-4xl mb-4">{service.icon}</div>
              <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
              <p className="text-gray-600 mb-6">{service.description}</p>
              <Link href={service.href} className="text-blue-600 font-medium hover:underline inline-flex items-center">
                Learn more <span className="ml-1">→</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
