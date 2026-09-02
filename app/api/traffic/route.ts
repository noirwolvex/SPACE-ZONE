import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

const MAX_PATH_LENGTH = 512;
const MAX_USER_AGENT_LENGTH = 512;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 60;

const requestCounts = new Map<string, { startedAt: number; count: number }>();

function getClientKey(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  return forwardedFor || realIp || "unknown";
}

function isRateLimited(key: string) {
  const now = Date.now();
  const current = requestCounts.get(key);

  if (!current || now - current.startedAt >= RATE_LIMIT_WINDOW_MS) {
    requestCounts.set(key, { startedAt: now, count: 1 });
    return false;
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) return true;
  current.count += 1;
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const clientKey = getClientKey(request);
    if (isRateLimited(clientKey)) {
      return NextResponse.json({ success: false, error: "Rate limit exceeded." }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const rawPathname = typeof body?.pathname === "string" ? body.pathname.trim() : "/";
    const pathname = rawPathname.slice(0, MAX_PATH_LENGTH) || "/";
    const userAgent = (request.headers.get("user-agent") || "").slice(0, MAX_USER_AGENT_LENGTH);

    if (userAgent.toLowerCase().includes("bot")) {
      return NextResponse.json({ success: true });
    }

    await prisma.pageVisit.create({
      data: {
        path: pathname,
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
