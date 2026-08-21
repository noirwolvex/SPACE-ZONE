export type StartupTool = {
  slug: string;
  name: string;
  summary: string;
  description: string;
  price: number;
  priceLabel: string;
  category: string;
  thumbnail: string;
  benefits: string[];
  includedFiles: string[];
  bestFor: string[];
};

export const startupTools: StartupTool[] = [
  {
    slug: "startup-launch-kit",
    name: "Startup Launch Kit",
    summary: "A complete bundle of templates, legal docs, and financial models for early-stage startups.",
    description:
      "The Startup Launch Kit gives early-stage teams a practical operating system for the first version of the business: planning docs, launch checklists, finance sheets, legal templates, and go-to-market prompts packaged so you can move from idea to execution with fewer blank pages.",
    price: 49,
    priceLabel: "$49",
    category: "Bundle",
    thumbnail: "/tools/startup-launch-kit.png",
    benefits: [
      "Validate your idea with a clear planning framework before investing too much time.",
      "Organize launch tasks, brand assets, legal basics, and financial assumptions in one place.",
      "Give co-founders, contractors, and investors a cleaner view of what you are building.",
      "Save days of setup work with templates that are already structured for startup execution.",
    ],
    includedFiles: [
      "Business plan and one-page pitch templates",
      "Financial model and pricing assumption sheets",
      "Launch checklist, MVP scope, and market research worksheet",
      "Basic legal document templates for early-stage operations",
    ],
    bestFor: ["First-time founders", "MVP teams", "Solo builders", "Startup accelerators"],
  },
  {
    slug: "seo-audit-pro",
    name: "SEO Audit Pro",
    summary: "Automated technical and content SEO auditing tool designed for modern Next.js/React apps.",
    description:
      "SEO Audit Pro helps teams identify technical SEO issues, content gaps, backlink opportunities, and page performance problems. It is designed for modern websites where speed, metadata, crawlability, and content structure all need to work together.",
    price: 29,
    priceLabel: "$29/mo",
    category: "SaaS",
    thumbnail: "/tools/seo-audit-pro.png",
    benefits: [
      "Surface high-priority SEO issues with a simple scoring model.",
      "Review technical SEO, on-page signals, site performance, and backlinks from one workflow.",
      "Create cleaner client or internal reports without manually rebuilding the same checklist.",
      "Track improvements over time so SEO work becomes measurable instead of vague.",
    ],
    includedFiles: [
      "Technical SEO audit checklist",
      "On-page optimization worksheet",
      "Performance and crawl report template",
      "Backlink and keyword opportunity tracker",
    ],
    bestFor: ["SEO consultants", "Marketing teams", "Next.js sites", "Agency audits"],
  },
  {
    slug: "social-automation",
    name: "Social Media Automation",
    summary: "Schedule and auto-generate engaging content across platforms with AI.",
    description:
      "Social Media Automation helps teams plan posts, schedule campaigns, organize channel-specific content, and review engagement signals from a single workspace. It is built for teams that need consistency without turning every week into a manual posting sprint.",
    price: 19,
    priceLabel: "$19/mo",
    category: "SaaS",
    thumbnail: "/tools/social-media-automation.png",
    benefits: [
      "Plan and schedule recurring posts across key social channels.",
      "Keep campaign assets, captions, and publishing dates organized.",
      "Review engagement trends so content decisions are based on signals, not guesswork.",
      "Reduce repetitive publishing work while keeping brand messaging consistent.",
    ],
    includedFiles: [
      "Social content calendar",
      "Post scheduling dashboard",
      "Campaign planning board",
      "Engagement report and platform breakdown templates",
    ],
    bestFor: ["Founders", "Creators", "Marketing teams", "Small agencies"],
  },
];

export function getStartupTool(slug: string) {
  return startupTools.find((tool) => tool.slug === slug);
}
