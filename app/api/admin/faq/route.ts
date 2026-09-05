import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { getFaqs } from "@/lib/content-store";

function text(value: unknown, max = 3000) { return String(value ?? "").trim().slice(0, max); }
function normalize(body: any) { return { question: text(body?.question, 500), answer: text(body?.answer, 4000), category: text(body?.category, 160) || null, page: text(body?.page, 200) || "/", sortOrder: Number.isFinite(Number(body?.sortOrder)) ? Math.round(Number(body.sortOrder)) : 0, isPublished: Boolean(body?.isPublished) }; }

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;
  try { return NextResponse.json(await getFaqs({ limit: 100 })); }
  catch (error) { console.error("Unable to load FAQs:", error); return NextResponse.json({ error: "Unable to load FAQs." }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;
  try {
    const data = normalize(await request.json());
    if (!data.question || data.question.length < 3 || !data.answer || data.answer.length < 3) return NextResponse.json({ error: "Question and answer are required." }, { status: 400 });
    const rows = await prisma.$queryRaw<any[]>`INSERT INTO "FAQ" ("question","answer","category","page","sortOrder","isPublished") VALUES (${data.question},${data.answer},${data.category},${data.page},${data.sortOrder},${data.isPublished}) RETURNING *`;
    revalidatePath(data.page); revalidatePath("/");
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) { console.error("Unable to create FAQ:", error); return NextResponse.json({ error: "Unable to create FAQ." }, { status: 500 }); }
}
