import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const { pathname } = await request.json();
    const userAgent = request.headers.get("user-agent") || "";

    if (userAgent.toLowerCase().includes("bot")) {
      return NextResponse.json({ success: true });
    }

    await prisma.pageVisit.create({
      data: {
        path: pathname || "/",
        userAgent,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Traffic recording failed:", error);
    // Analytics must never make the page request fail.
    return NextResponse.json({ success: false }, { status: 200 });
  }
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  try {
    const count = await prisma.pageVisit.count();
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Traffic count failed:", error);
    return NextResponse.json({ count: 0 });
  }
}
