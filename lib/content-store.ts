import { prisma } from "@/lib/prisma";
import { getService, services, type Service } from "@/lib/services";
import { getStartupTool, startupTools, type StartupTool } from "@/lib/startup-tools";

export type EditableService = Service & {
  id?: string;
  image?: string | null;
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

function mapServiceRecord(
  record: {
    id: string;
    slug: string;
    name: string;
    description: string;
    examples: string | null;
    workflow: string | null;
    bestFor: string | null;
    imageUrl?: string | null;
  },
) {
  const fallback = getService(record.slug);

  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    summary: record.description,
    description: fallback?.description ?? record.description,
    icon: fallback?.icon ?? iconForService(record.slug, record.name),
    image: record.imageUrl ?? null,
    deliverables: linesToList(record.examples, fallback?.deliverables ?? ["Service deliverables"]),
    process: linesToList(record.workflow, fallback?.process ?? ["Plan the work", "Create the assets", "Prepare handoff"]),
    bestFor: linesToList(record.bestFor, fallback?.bestFor ?? ["Businesses", "Founders", "Marketing teams"]),
  } satisfies EditableService;
}

function mapToolRecord(record: {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  price: number;
  thumbnail: string | null;
  benefits: string[];
  includedFiles: string[];
  bestFor: string[];
  category: { name: string };
}) {
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
    bestFor: record.bestFor.length ? record.bestFor : fallback?.bestFor ?? ["Founders", "Marketing teams", "Small agencies"],
  } satisfies EditableStartupTool;
}

export async function getEditableServices(): Promise<EditableService[]> {
  try {
    const records = await prisma.service.findMany({
      orderBy: { createdAt: "asc" },
    });
    if (!records.length) return services;

    let imageByServiceId = new Map<string, string | null>();
    try {
      const mediaRows = await prisma.serviceMedia.findMany({
        where: { imageUrl: { not: null } },
        select: { serviceId: true, imageUrl: true },
      });
      imageByServiceId = new Map(mediaRows.map((row) => [row.serviceId, row.imageUrl]));
    } catch (mediaError) {
      console.warn("Service media lookup failed; continuing without images:", mediaError);
    }

    return records.map((record) =>
      mapServiceRecord({ ...record, imageUrl: imageByServiceId.get(record.id) ?? null }),
    );
  } catch (error) {
    console.error("Service content lookup failed:", error);
    return services;
  }
}

export async function getEditableService(slug: string) {
  try {
    const record = await prisma.service.findUnique({
      where: { slug },
      include: { media: { select: { imageUrl: true } } },
    });
    if (!record) return undefined;
    return mapServiceRecord({ ...record, imageUrl: record.media?.imageUrl ?? null });
  } catch (error) {
    console.error(`Service lookup failed for ${slug}:`, error);
    return getService(slug);
  }
}

export async function getEditableStartupTools(): Promise<EditableStartupTool[]> {
  try {
    const records = await prisma.startupTool.findMany({
      include: { category: true },
      orderBy: { createdAt: "asc" },
    });

    if (!records.length) return startupTools;
    return records.map(mapToolRecord);
  } catch (error) {
    console.error("Startup tools content lookup failed:", error);
    return startupTools;
  }
}

export async function getEditableStartupTool(slug: string) {
  try {
    const record = await prisma.startupTool.findUnique({
      where: { slug },
      include: { category: true },
    });
    if (!record) return undefined;
    return mapToolRecord(record);
  } catch (error) {
    console.error(`Startup tool lookup failed for ${slug}:`, error);
    return getStartupTool(slug);
  }
}
