import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

type RouteProps = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteProps) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;
  try {
    const { id } = await params;
    const body = await request.json();
    const status = String(body?.status ?? "").trim().toUpperCase();
    if (!["UNREAD", "READ", "ARCHIVED"].includes(status)) return NextResponse.json({ error: "Invalid message status." }, { status: 400 });
    const message = await prisma.contactMessage.update({ where: { id }, data: { status } });
    return NextResponse.json(message);
  } catch (error) {
    console.error("Unable to update message:", error);
    return NextResponse.json({ error: "Unable to update message." }, { status: 500 });
  }
}
