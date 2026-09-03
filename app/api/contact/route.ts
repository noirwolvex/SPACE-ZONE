import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const MAX_NAME_LENGTH = 120;
const MAX_MESSAGE_LENGTH = 5000;
const MAX_PHONE_LENGTH = 40;
const MAX_DETAILS_LENGTH = 2000;
const MAX_CONTACT_TYPE_LENGTH = 100;
const MAX_ATTACHMENT_NAME_LENGTH = 255;

const recentRequests = new Map<string, number[]>();

function getRateLimitKey(request: NextRequest, userId: string) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `${userId}:${forwardedFor || "unknown"}`;
}

function isRateLimited(key: string) {
  const now = Date.now();
  const existing = recentRequests.get(key) ?? [];
  const active = existing.filter((timestamp) => now - timestamp < WINDOW_MS);

  if (active.length >= MAX_REQUESTS_PER_WINDOW) {
    recentRequests.set(key, active);
    return true;
  }

  active.push(now);
  recentRequests.set(key, active);

  if (recentRequests.size > 10_000) {
    for (const [storedKey, timestamps] of recentRequests) {
      if (!timestamps.some((timestamp) => now - timestamp < WINDOW_MS)) {
        recentRequests.delete(storedKey);
      }
    }
  }

  return false;
}

function optionalText(value: unknown, maxLength: number) {
  if (value == null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length <= maxLength ? trimmed : null;
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentUser();
  if (!auth?.profile) {
    return NextResponse.json(
      { error: "Authentication required. Please log in to contact us." },
      { status: 401 }
    );
  }

  const rateLimitKey = getRateLimitKey(request, auth.user.id);
  if (isRateLimited(rateLimitKey)) {
    return NextResponse.json(
      { error: "Too many messages. Please try again later." },
      { status: 429, headers: { "Retry-After": "600" } }
    );
  }

  try {
    const json = await request.json();
    const name = optionalText(json?.name, MAX_NAME_LENGTH);
    const message = optionalText(json?.message, MAX_MESSAGE_LENGTH);
    const phone = optionalText(json?.phone, MAX_PHONE_LENGTH);
    const details = optionalText(json?.details, MAX_DETAILS_LENGTH);
    const contactType = optionalText(json?.contactType, MAX_CONTACT_TYPE_LENGTH);
    const attachmentName = optionalText(json?.attachmentName, MAX_ATTACHMENT_NAME_LENGTH);

    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    if (
      (json?.name != null && typeof json.name !== "string") ||
      (json?.message != null && typeof json.message !== "string") ||
      (json?.phone != null && typeof json.phone !== "string") ||
      (json?.details != null && typeof json.details !== "string") ||
      (json?.contactType != null && typeof json.contactType !== "string") ||
      (json?.attachmentName != null && typeof json.attachmentName !== "string")
    ) {
      return NextResponse.json({ error: "Invalid contact form data." }, { status: 400 });
    }

    const finalMessage = [
      message,
      contactType ? `Contact type: ${contactType}` : null,
      details ? `Other details: ${details}` : null,
      attachmentName ? `Attachment: ${attachmentName}` : null,
    ]
      .filter(Boolean)
      .join("\n\n");

    const contactMessage = await prisma.contactMessage.create({
      data: {
        name,
        // Always trust the authenticated profile address, never a client-supplied email.
        email: auth.profile.email ?? auth.user.email ?? "",
        message: finalMessage,
        phone,
      },
    });

    return NextResponse.json(contactMessage, { status: 201 });
  } catch (error) {
    console.error("Contact message error:", error);
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
  }
}
