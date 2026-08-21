import { prisma } from "@/lib/prisma";
import { getService, services, type Service } from "@/lib/services";
import { getStartupTool, startupTools, type StartupTool } from "@/lib/startup-tools";

export type EditableService = Service & {
  id?: string;
};

export type EditableStartupTool = StartupTool & {
  id?: string;
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function linesToList(value: string | null | undefined, fallback: string[]) {
  const items = value
    ?.split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  return items?.length ? items : fallback;
}

function iconForService(slug: string, name: string): Service["icon"] {
  const key = `${slug} ${name}`.toLowerCase();

  if (key.includes("web") || key.includes("app")) return "code";
  if (key.includes("seo") || key.includes("marketing")) return "rocket";
  if (key.includes("banner") || key.includes("store")) return "image";
  return "sparkles";
}

export async function getEditableServices(): Promise<EditableService[]> {
  try {
    const records = await prisma.service.findMany({
      orderBy: { createdAt: "asc" },
    });

    if (!records.length) return services;

    return records.map((record) => {
      const fallback = getService(record.slug);

      return {
        id: record.id,
        slug: record.slug,
        name: record.name,
        summary: record.description,
        description: fallback?.description ?? record.description,
        icon: fallback?.icon ?? iconForService(record.slug, record.name),
        deliverables: linesToList(record.examples, fallback?.deliverables ?? ["Service deliverables"]),
        process: linesToList(record.workflow, fallback?.process ?? ["Plan the work", "Create the assets", "Prepare handoff"]),
        bestFor: fallback?.bestFor ?? ["Businesses", "Founders", "Marketing teams"],
      };
    });
  } catch {
    return services;
  }
}

export async function getEditableService(slug: string) {
  const allServices = await getEditableServices();
  return allServices.find((service) => service.slug === slug);
}

export async function getEditableStartupTools(): Promise<EditableStartupTool[]> {
  try {
    const records = await prisma.startupTool.findMany({
      include: { category: true },
      orderBy: { createdAt: "asc" },
    });

    if (!records.length) return startupTools;

    return records.map((record) => {
      const fallback = getStartupTool(record.slug);

      return {
        id: record.id,
        slug: record.slug,
        name: record.name,
        summary: record.summary,
        description: record.description,
        price: record.price,
        priceLabel: fallback?.priceLabel ?? `$${record.price}`,
        category: record.category.name,
        thumbnail: record.thumbnail ?? fallback?.thumbnail ?? "/tools/startup-launch-kit.png",
        benefits: record.benefits.length ? record.benefits : fallback?.benefits ?? ["Clearer launch workflow"],
        includedFiles: record.includedFiles.length ? record.includedFiles : fallback?.includedFiles ?? ["Product resources"],
        bestFor: fallback?.bestFor ?? ["Founders", "Marketing teams", "Small agencies"],
      };
    });
  } catch {
    return startupTools;
  }
}

export async function getEditableStartupTool(slug: string) {
  const allTools = await getEditableStartupTools();
  return allTools.find((tool) => tool.slug === slug);
}
