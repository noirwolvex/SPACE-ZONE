import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    const subscriber = await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { active: true },
      create: { email, active: true },
    });
    return NextResponse.json({ ok: true, id: subscriber.id });
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return NextResponse.json({ error: "Unable to subscribe right now." }, { status: 500 });
  }
}
