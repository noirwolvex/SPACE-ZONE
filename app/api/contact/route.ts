import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { consumeRateLimit } from "@/lib/rate-limit";
import { CONTACT_ATTACHMENT_DIR, IMAGE_EXTENSIONS, MAX_IMAGE_SIZE_BYTES, uploadMediaImage } from "@/lib/media-storage";

export const runtime = "nodejs";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const MAX_NAME_LENGTH = 120;
const MAX_MESSAGE_LENGTH = 5000;
const MAX_PHONE_LENGTH = 40;
const MAX_DETAILS_LENGTH = 2000;
const ALLOWED_CONTACT_TYPES = new Set(["Inquiry", "Problem", "Suggestion", "Offer"]);

function text(value: FormDataEntryValue | null, maxLength: number, fallback = "") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length <= maxLength ? trimmed : fallback;
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentUser();
  if (!auth?.profile) {
    return NextResponse.json({ error: "Authentication required. Please log in to contact us." }, { status: 401 });
  }

  try {
    const rateLimit = await consumeRateLimit(`contact:${auth.user.id}`, MAX_REQUESTS_PER_WINDOW, WINDOW_MS);
    if (rateLimit.limited) {
      return NextResponse.json(
        { error: "Too many messages. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
      );
    }

    const formData = await request.formData();
    const name = text(formData.get("name"), MAX_NAME_LENGTH);
    const message = text(formData.get("message"), MAX_MESSAGE_LENGTH);
    const details = text(formData.get("details"), MAX_DETAILS_LENGTH);
    const phone = text(formData.get("phone"), MAX_PHONE_LENGTH) || null;
    const requestedContactType = text(formData.get("contactType"), 50, "Inquiry");
    const contactType = ALLOWED_CONTACT_TYPES.has(requestedContactType) ? requestedContactType : "Inquiry";
    const attachment = formData.get("attachment");

    if (!name || !message) {
      return NextResponse.json({ error: "Name and message are required." }, { status: 400 });
    }

    if (typeof formData.get("name") !== "string" || typeof formData.get("message") !== "string") {
      return NextResponse.json({ error: "Invalid contact form data." }, { status: 400 });
    }

    let attachmentUrl: string | null = null;
    let attachmentName: string | null = null;

    if (attachment instanceof File && attachment.size > 0) {
      const extension = IMAGE_EXTENSIONS.get(attachment.type);
      if (!extension) {
        return NextResponse.json({ error: "Only PNG, JPG, WEBP, and GIF images are allowed." }, { status: 400 });
      }
      if (attachment.size > MAX_IMAGE_SIZE_BYTES) {
        return NextResponse.json({ error: "Image must be smaller than 5MB." }, { status: 400 });
      }

      const safeOriginalName = attachment.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 120) || "attachment";
      const filename = `${randomUUID()}.${extension}`;
      const upload = await uploadMediaImage(filename, Buffer.from(await attachment.arrayBuffer()), attachment.type, CONTACT_ATTACHMENT_DIR);
      attachmentUrl = upload.path;
      attachmentName = safeOriginalName;
    }

    const contactMessage = await prisma.contactMessage.create({
      data: {
        name,
        email: auth.profile.email ?? auth.user.email ?? "",
        phone,
        contactType,
        message,
        details: details || null,
        attachmentUrl,
        attachmentName,
      },
    });

    return NextResponse.json(contactMessage, { status: 201 });
  } catch (error) {
    console.error("Contact message error:", error);
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
  }
}
