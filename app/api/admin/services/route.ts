import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { getEditableServices, slugify } from "@/lib/content-store";
import { prisma } from "@/lib/prisma";
import { services } from "@/lib/services";

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
    const name = String(body.name ?? "").trim();
    const summary = String(body.summary ?? "").trim();
    const image = String(body.image ?? "").trim() || null;

    if (!name || !summary) {
      return NextResponse.json({ error: "Name and summary are required." }, { status: 400 });
    }

    const slug = slugify(String(body.slug ?? name));

    const service = await prisma.service.create({
      data: {
        name,
        slug,
        description: summary,
        workflow: String(body.process ?? "").trim(),
        examples: String(body.deliverables ?? "").trim(),
      },
    });

    if (image) {
      await prisma.$executeRaw`
        INSERT INTO "ServiceMedia" ("serviceId", "imageUrl")
        VALUES (${service.id}, ${image})
        ON CONFLICT ("serviceId") DO UPDATE SET "imageUrl" = EXCLUDED."imageUrl", "updatedAt" = CURRENT_TIMESTAMP
      `;
    }

    revalidatePath("/");
    revalidatePath("/services");
    revalidatePath(`/services/${service.slug}`);

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Unable to save service." }, { status: 500 });
  }
}
