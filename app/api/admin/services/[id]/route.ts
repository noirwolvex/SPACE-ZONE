import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { slugify } from "@/lib/content-store";
import { prisma } from "@/lib/prisma";

type RouteProps = { params: Promise<{ id: string }> };

function text(value: unknown) { return String(value ?? "").trim(); }

export async function PUT(request: NextRequest, { params }: RouteProps) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const name = text(body?.name);
    const summary = text(body?.summary);
    const description = text(body?.description);
    const image = text(body?.image) || null;
    const bestFor = text(body?.bestFor);

    if (!name || !summary || !description) {
      return NextResponse.json({ error: "Name, summary, and description are required." }, { status: 400 });
    }

    const previous = await prisma.service.findUnique({ where: { id } });
    const service = await prisma.service.update({
      where: { id },
      data: {
        name,
        slug: slugify(String(body?.slug ?? name)),
        summary,
        description,
        workflow: text(body?.process) || null,
        examples: text(body?.deliverables) || null,
        bestFor: bestFor || null,
      },
    });

    if (image) {
      await prisma.$executeRaw`
        INSERT INTO "ServiceMedia" ("serviceId", "imageUrl") VALUES (${service.id}, ${image})
        ON CONFLICT ("serviceId") DO UPDATE SET "imageUrl" = EXCLUDED."imageUrl", "updatedAt" = CURRENT_TIMESTAMP
      `;
    } else {
      await prisma.$executeRaw`DELETE FROM "ServiceMedia" WHERE "serviceId" = ${service.id}`;
    }

    revalidatePath("/");
    revalidatePath("/services");
    revalidatePath(`/services/${service.slug}`);
    if (previous) revalidatePath(`/services/${previous.slug}`);
    return NextResponse.json(service);
  } catch (error) {
    console.error("Unable to update service:", error);
    return NextResponse.json({ error: "Unable to update service." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteProps) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  try {
    const { id } = await params;
    const service = await prisma.service.delete({ where: { id } });
    revalidatePath("/");
    revalidatePath("/services");
    revalidatePath(`/services/${service.slug}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Unable to delete service:", error);
    return NextResponse.json({ error: "Unable to delete service." }, { status: 500 });
  }
}
