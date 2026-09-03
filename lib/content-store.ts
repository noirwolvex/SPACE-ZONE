import { prisma } from "@/lib/prisma";

export type EditableService = {
  id?: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  icon: "code" | "rocket" | "sparkles" | "image";
  image?: string | null;
  deliverables: string[];
  process: string[];
  bestFor: string[];
};

export type EditableStartupTool = {
  id?: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  price: number;
  priceLabel: string;
  category: string;
  thumbnail: string | null;
  benefits: string[];
  includedFiles: string[];
  bestFor: string[];
};

export function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function linesToList(value: string | null | undefined) {
  return (value ?? "").split("\n").map((item) => item.trim()).filter(Boolean);
}

function iconForService(slug: string, name: string): EditableService["icon"] {
  const key = `${slug} ${name}`.toLowerCase();
  if (key.includes("web") || key.includes("app")) return "code";
  if (key.includes("seo") || key.includes("marketing")) return "rocket";
  if (key.includes("banner") || key.includes("store")) return "image";
  return "sparkles";
}

function formatPrice(price: number) {
  return Number.isInteger(price) ? `$${price}` : `$${price.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}`;
}

function mapServiceRecord(record: {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  examples: string | null;
  workflow: string | null;
  bestFor: string | null;
  imageUrl?: string | null;
}): EditableService {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    summary: record.summary,
    description: record.description,
    icon: iconForService(record.slug, record.name),
    image: record.imageUrl ?? null,
    deliverables: linesToList(record.examples),
    process: linesToList(record.workflow),
    bestFor: linesToList(record.bestFor),
  };
}

function mapToolRecord(record: {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  price: number | { toString(): string };
  thumbnail: string | null;
  benefits: string[] | null;
  includedFiles: string[] | null;
  bestFor: string[];
  category: { name: string };
}): EditableStartupTool {
  const price = Number(record.price);
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    summary: record.summary,
    description: record.description,
    price,
    priceLabel: formatPrice(price),
    category: record.category.name,
    thumbnail: record.thumbnail,
    benefits: record.benefits ?? [],
    includedFiles: record.includedFiles ?? [],
    bestFor: record.bestFor ?? [],
  };
}

export async function getEditableServices(): Promise<EditableService[]> {
  const records = await prisma.service.findMany({ orderBy: { createdAt: "asc" } });
  if (!records.length) return [];
  const mediaRows = await prisma.serviceMedia.findMany({ where: { serviceId: { in: records.map((record) => record.id) } }, select: { serviceId: true, imageUrl: true } });
  const imageByServiceId = new Map(mediaRows.map((row) => [row.serviceId, row.imageUrl]));
  return records.map((record) => mapServiceRecord({ ...record, imageUrl: imageByServiceId.get(record.id) ?? null }));
}

export async function getEditableService(slug: string): Promise<EditableService | undefined> {
  const record = await prisma.service.findUnique({ where: { slug } });
  if (!record) return undefined;
  const media = await prisma.serviceMedia.findUnique({ where: { serviceId: record.id }, select: { imageUrl: true } });
  return mapServiceRecord({ ...record, imageUrl: media?.imageUrl ?? null });
}

export async function getEditableStartupTools(): Promise<EditableStartupTool[]> {
  const records = await prisma.startupTool.findMany({ include: { category: true }, orderBy: { createdAt: "asc" } });
  return records.map(mapToolRecord);
}

export async function getEditableStartupTool(slug: string): Promise<EditableStartupTool | undefined> {
  const record = await prisma.startupTool.findUnique({ where: { slug }, include: { category: true } });
  return record ? mapToolRecord(record) : undefined;
}
