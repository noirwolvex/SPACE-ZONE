import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { getEditableServices } from "@/lib/content-store";
import { prisma } from "@/lib/prisma";

const LIMITS = {
  name: 120,
  summary: 2000,
  description: 5000,
  workflow: 5000,
  examples: 5000,
  bestFor: 2000,
  image: 2000,
} as const;

function boundedText(value: unknown, maxLength: number) {
  const text = String(value ?? "").trim();
  return text.length <= maxLength ? text : null;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  try {
    return NextResponse.json(await getEditableServices());
  } catch (error) {
    console.error("Unable to load services:", error);
    return NextResponse.json({ error: "Unable to load services." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  try {
    const body = await request.json();
    const name = boundedText(body?.name, LIMITS.name);
    const summary = boundedText(body?.summary, LIMITS.summary);
    const description = boundedText(body?.description, LIMITS.description);
    const workflow = boundedText(body?.process, LIMITS.workflow);
    const examples = boundedText(body?.deliverables, LIMITS.examples);
    const bestFor = boundedText(body?.bestFor, LIMITS.bestFor);
    const image = boundedText(body?.image, LIMITS.image) || null;
    const slug = String(body?.slug ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || String(name ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    if (!name || !summary || !description) return NextResponse.json({ error: "Name, summary, and description are required." }, { status: 400 });
    if (!slug) return NextResponse.json({ error: "A valid slug is required." }, { status: 400 });
    if (body?.process != null && workflow === null) return NextResponse.json({ error: "Process content is too long." }, { status: 400 });
    if (body?.deliverables != null && examples === null) return NextResponse.json({ error: "Deliverables content is too long." }, { status: 400 });
    if (body?.bestFor != null && bestFor === null) return NextResponse.json({ error: "Best-for content is too long." }, { status: 400 });
    if (body?.image != null && image === null) return NextResponse.json({ error: "Image URL is too long." }, { status: 400 });

    const existing = await prisma.service.findUnique({ where: { slug } });
    if (existing) return NextResponse.json({ error: `A service with slug "${slug}" already exists.` }, { status: 409 });

    const service = await prisma.service.create({ data: { name, slug, summary, description, workflow, examples, bestFor } });

    if (image) {
      await prisma.$executeRaw`
        INSERT INTO "ServiceMedia" ("serviceId", "imageUrl") VALUES (${service.id}, ${image})
        ON CONFLICT ("serviceId") DO UPDATE SET "imageUrl" = EXCLUDED."imageUrl", "updatedAt" = CURRENT_TIMESTAMP
      `;
    }

    revalidatePath("/");
    revalidatePath("/services");
    revalidatePath(`/services/${service.slug}`);
    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error("Unable to create service:", error);
    return NextResponse.json({ error: "Unable to save service." }, { status: 500 });
  }
}
