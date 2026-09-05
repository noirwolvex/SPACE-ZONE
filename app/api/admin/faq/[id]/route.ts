import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

function text(value: unknown, max = 3000) { return String(value ?? "").trim().slice(0, max); }
function normalize(body: any) { return { question: text(body?.question, 500), answer: text(body?.answer, 4000), category: text(body?.category, 160) || null, page: text(body?.page, 200) || "/", sortOrder: Number.isFinite(Number(body?.sortOrder)) ? Math.round(Number(body.sortOrder)) : 0, isPublished: Boolean(body?.isPublished) }; }

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;
  try {
    const { id } = await params;
    const data = normalize(await request.json());
    if (!data.question || !data.answer) return NextResponse.json({ error: "Question and answer are required." }, { status: 400 });
    const rows = await prisma.$queryRaw<any[]>`UPDATE "FAQ" SET "question"=${data.question},"answer"=${data.answer},"category"=${data.category},"page"=${data.page},"sortOrder"=${data.sortOrder},"isPublished"=${data.isPublished},"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${id} RETURNING *`;
    if (!rows.length) return NextResponse.json({ error: "FAQ not found." }, { status: 404 });
    revalidatePath(data.page); revalidatePath("/");
    return NextResponse.json(rows[0]);
  } catch (error) { console.error("Unable to update FAQ:", error); return NextResponse.json({ error: "Unable to update FAQ." }, { status: 500 }); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;
  try {
    const { id } = await params;
    await prisma.$executeRaw`DELETE FROM "FAQ" WHERE "id"=${id}`;
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch (error) { console.error("Unable to delete FAQ:", error); return NextResponse.json({ error: "Unable to delete FAQ." }, { status: 500 }); }
}
