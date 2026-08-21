export type PortfolioProject = {
  title: string;
  category: string;
  summary: string;
  outcome: string;
  services: string[];
  gradient: string;
  metrics: {
    label: string;
    value: string;
  }[];
};

export const portfolioProjects: PortfolioProject[] = [
  {
    title: "Retail Launch Campaign",
    category: "Printing & Campaign Design",
    summary:
      "A full launch identity for a retail promotion, including print-ready posters, offer cards, storefront graphics, and matching digital campaign assets.",
    outcome:
      "Built a consistent visual system that could move from physical displays to Instagram posts without losing the campaign message.",
    services: ["Poster design", "Print layout", "Campaign visuals", "Social adaptations"],
    gradient: "from-rose-100 via-orange-50 to-sky-100 dark:from-rose-950/40 dark:via-slate-900 dark:to-sky-950/40",
    metrics: [
      { label: "Asset formats", value: "12" },
      { label: "Campaign uses", value: "Print + Digital" },
    ],
  },
  {
    title: "Store Banner System",
    category: "E-commerce Design",
    summary:
      "Responsive store banners for seasonal offers, product collections, and homepage hero placements with a clear offer hierarchy.",
    outcome:
      "Created a repeatable banner style that helps store visitors understand promotions quickly across desktop and mobile layouts.",
    services: ["Homepage banners", "Mobile crops", "Promo graphics", "Export optimization"],
    gradient: "from-indigo-100 via-white to-emerald-100 dark:from-indigo-950/40 dark:via-slate-900 dark:to-emerald-950/30",
    metrics: [
      { label: "Banner sizes", value: "8" },
      { label: "Placements", value: "Storewide" },
    ],
  },
  {
    title: "Social Media Content Kit",
    category: "Marketing Design",
    summary:
      "A branded content kit for Instagram and TikTok campaigns with post templates, highlight covers, story layouts, and launch captions.",
    outcome:
      "Gave the brand a consistent publishing look while keeping the content flexible enough for weekly campaigns and product drops.",
    services: ["Post templates", "Story design", "Caption structure", "Campaign calendar"],
    gradient: "from-fuchsia-100 via-violet-50 to-cyan-100 dark:from-fuchsia-950/40 dark:via-slate-900 dark:to-cyan-950/40",
    metrics: [
      { label: "Templates", value: "18" },
      { label: "Channels", value: "IG + TikTok" },
    ],
  },
  {
    title: "Business Identity Refresh",
    category: "Brand Identity",
    summary:
      "A refreshed visual identity for a growing local business, including logo direction, color palette, typography, and print applications.",
    outcome:
      "Turned scattered visuals into a clear brand system that works across business cards, packaging inserts, banners, and digital profiles.",
    services: ["Logo direction", "Brand kit", "Business cards", "Print guidelines"],
    gradient: "from-amber-100 via-white to-violet-100 dark:from-amber-950/30 dark:via-slate-900 dark:to-violet-950/40",
    metrics: [
      { label: "Brand assets", value: "20+" },
      { label: "Use cases", value: "Online + Print" },
    ],
  },
  {
    title: "SEO Growth Audit",
    category: "Digital Marketing",
    summary:
      "A search visibility review covering technical SEO, page structure, metadata, keyword opportunities, and content priorities.",
    outcome:
      "Delivered a practical roadmap that separated urgent fixes from longer-term content opportunities for organic growth.",
    services: ["Technical audit", "Keyword mapping", "Content plan", "Reporting"],
    gradient: "from-lime-100 via-white to-blue-100 dark:from-lime-950/30 dark:via-slate-900 dark:to-blue-950/40",
    metrics: [
      { label: "Audit areas", value: "6" },
      { label: "Roadmap", value: "30 days" },
    ],
  },
  {
    title: "Startup Website Launch",
    category: "Web & App Development",
    summary:
      "A fast website build for a new business, focused on service clarity, contact conversion, mobile performance, and launch readiness.",
    outcome:
      "Created a clean digital presence that explains the offer, supports lead generation, and gives the brand a credible home online.",
    services: ["Website design", "Responsive build", "Contact flow", "Launch setup"],
    gradient: "from-sky-100 via-white to-slate-100 dark:from-sky-950/40 dark:via-slate-900 dark:to-slate-800",
    metrics: [
      { label: "Pages", value: "5" },
      { label: "Launch focus", value: "Leads" },
    ],
  },
];

export const portfolioCapabilities = [
  "Printing materials",
  "Store banners",
  "Brand identity",
  "Social media content",
  "SEO campaigns",
  "Web launch pages",
];
