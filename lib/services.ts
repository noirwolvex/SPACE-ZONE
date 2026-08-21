export type Service = {
  slug: string;
  name: string;
  summary: string;
  description: string;
  icon: "code" | "rocket" | "sparkles" | "image";
  deliverables: string[];
  process: string[];
  bestFor: string[];
};

export const services: Service[] = [
  {
    slug: "web-app-development",
    name: "Web & App Development",
    summary: "Custom, scalable applications built with modern frameworks to power your digital presence.",
    description:
      "We design and build fast, maintainable web apps, dashboards, and customer-facing products using modern frameworks. The work covers product planning, UI implementation, backend integration, performance, deployment, and the kind of polish that makes a digital product feel dependable from day one.",
    icon: "code",
    deliverables: [
      "Responsive website or application interface",
      "Reusable component structure",
      "Backend and API integration",
      "Deployment-ready build with performance checks",
    ],
    process: [
      "Clarify the product goal, user journeys, and technical requirements.",
      "Design the application structure and build the core user-facing flows.",
      "Connect data, payments, admin workflows, or third-party services as needed.",
      "Test, optimize, and prepare the project for launch.",
    ],
    bestFor: ["SaaS products", "Startup MVPs", "Business websites", "Internal dashboards"],
  },
  {
    slug: "seo-digital-marketing",
    name: "SEO & Digital Marketing",
    summary: "Data-driven strategies to increase your visibility and drive high-quality traffic to your platform.",
    description:
      "We improve how people discover your brand through technical SEO, content planning, search intent research, campaign setup, and practical reporting. The goal is not just more traffic; it is better-qualified attention that can turn into leads, signups, and sales.",
    icon: "rocket",
    deliverables: [
      "Technical SEO audit and priority fixes",
      "Keyword and search-intent research",
      "Content plan for landing pages or blog growth",
      "Campaign tracking and performance reporting",
    ],
    process: [
      "Audit current visibility, site structure, metadata, speed, and content gaps.",
      "Map high-value search opportunities to practical page or campaign ideas.",
      "Implement improvements and set up measurement.",
      "Review results and refine based on conversion and ranking signals.",
    ],
    bestFor: ["Growing startups", "Local businesses", "Content-led brands", "Service companies"],
  },
  {
    slug: "brand-identity",
    name: "Brand Identity",
    summary: "Memorable design systems and branding that resonate with your target audience.",
    description:
      "We shape the visual and verbal foundation of your brand so every touchpoint feels consistent. This can include logo direction, color systems, typography, social templates, brand guidelines, and core messaging that gives your team a clear creative lane.",
    icon: "sparkles",
    deliverables: [
      "Logo direction and visual identity system",
      "Color, typography, and layout guidance",
      "Brand voice and messaging notes",
      "Starter templates for social or web use",
    ],
    process: [
      "Understand your audience, offer, competitors, and existing brand signals.",
      "Develop visual directions and refine the strongest route.",
      "Build a practical brand kit your team can actually use.",
      "Package guidelines and assets for handoff.",
    ],
    bestFor: ["New brands", "Rebrands", "Creator businesses", "Product launches"],
  },
  {
    slug: "designing-store-banners",
    name: "Designing Store Banners",
    summary: "Conversion-focused banners for online stores, seasonal campaigns, product launches, and promotions.",
    description:
      "We create polished store banners that help shoppers understand your offer quickly. Each banner is designed around the campaign goal, product category, brand style, and the placement where it will appear, from homepage hero banners to collection promos and sale announcements.",
    icon: "image",
    deliverables: [
      "Homepage hero banners for desktop and mobile",
      "Promotion, sale, and seasonal campaign banners",
      "Product category and collection banners",
      "Exported assets ready for Shopify, WooCommerce, or custom storefronts",
    ],
    process: [
      "Define the campaign message, audience, offer, and required sizes.",
      "Create a visual direction that matches your store and product positioning.",
      "Design responsive banner variations for key placements.",
      "Prepare optimized files for upload and launch.",
    ],
    bestFor: ["E-commerce stores", "Product launches", "Seasonal sales", "Marketplace brands"],
  },
];

export function getService(slug: string) {
  return services.find((service) => service.slug === slug);
}
