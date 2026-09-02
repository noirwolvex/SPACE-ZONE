import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { getEditableServices, slugify } from "@/lib/content-store";
import { prisma } from "@/lib/prisma";
import { services } from "@/lib/services";

const MAX_NAME_LENGTH = 120;
const MAX_SUMMARY_LENGTH = 2000;
const MAX_WORKFLOW_LENGTH = 5000;
const MAX_EXAMPLES_LENGTH = 5000;
const MAX_BEST_FOR_LENGTH = 2000;
const MAX_IMAGE_LENGTH = 2000;

function boundedText(value: unknown, maxLength: number) {
  const text = String(value ?? "").trim();
  return text.length <= maxLength ? text : null;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  try {
    const count = await prisma.service.count();
    if (count === 0) {
      for (const service of services) {
        await prisma.service.create({
          data: {
            name: service.name,
            slug: service.slug,
            description: service.summary,
            workflow: service.process.join("\n"),
            examples: service.deliverables.join("\n"),
            bestFor: service.bestFor.join("\n"),
          },
        });
      }
    }
  } catch {
    return NextResponse.json(await getEditableServices());
  }

  return NextResponse.json(await getEditableServices());
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  try {
    const body = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid service payload." }, { status: 400 });
    }

    const name = boundedText(body.name, MAX_NAME_LENGTH);
    const summary = boundedText(body.summary, MAX_SUMMARY_LENGTH);
    const image = boundedText(body.image, MAX_IMAGE_LENGTH) || null;
    const bestFor = boundedText(body.bestFor, MAX_BEST_FOR_LENGTH) ?? null;
    const workflow = boundedText(body.process, MAX_WORKFLOW_LENGTH) ?? null;
    const examples = boundedText(body.deliverables, MAX_EXAMPLES_LENGTH) ?? null;
    const slug = slugify(String(body.slug ?? name ?? ""));

    if (!name || !summary) {
      return NextResponse.json({ error: "Name and summary are required and within the allowed length." }, { status: 400 });
    }

    if (!slug) {
      return NextResponse.json({ error: "A valid slug is required." }, { status: 400 });
    }

    if (body.image != null && image === null) {
      return NextResponse.json({ error: "Image URL is too long." }, { status: 400 });
    }

    if (body.process != null && workflow === null) {
      return NextResponse.json({ error: "Process content is too long." }, { status: 400 });
    }

    if (body.deliverables != null && examples === null) {
      return NextResponse.json({ error: "Deliverables content is too long." }, { status: 400 });
    }

    if (body.bestFor != null && bestFor === null) {
      return NextResponse.json({ error: "Best-for content is too long." }, { status: 400 });
    }

    const existing = await prisma.service.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: `A service with slug "${slug}" already exists.` }, { status: 409 });
    }

    const service = await prisma.service.create({
      data: {
        name,
        slug,
        description: summary,
        workflow,
        examples,
        bestFor,
      },
    });

    if (image) {
      await prisma.$executeRaw`
        INSERT INTO "ServiceMedia" ("serviceId", "imageUrl")
        VALUES (${service.id}, ${image})
        ON CONFLICT ("serviceId") DO UPDATE
        SET "imageUrl" = EXCLUDED."imageUrl", "updatedAt" = CURRENT_TIMESTAMP
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
