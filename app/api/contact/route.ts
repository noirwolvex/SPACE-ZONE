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
const MAX_EMAIL_LENGTH = 254;
const MAX_COMPANY_LENGTH = 160;
const MAX_PHONE_LENGTH = 40;
const MAX_SERVICE_LENGTH = 80;
const MAX_BUDGET_LENGTH = 80;
const MAX_TIMELINE_LENGTH = 80;
const MAX_MESSAGE_LENGTH = 5000;

const ALLOWED_SERVICES = new Set([
  "Website / Web App",
  "Branding & Design",
  "Digital Product",
  "Startup Tool",
  "E-commerce",
  "Custom Development",
  "Website Improvement",
  "Other",
]);

const ALLOWED_BUDGETS = new Set([
  "Under 500 BHD",
  "500 – 1,000 BHD",
  "1,000 – 2,500 BHD",
  "2,500 – 5,000 BHD",
  "5,000+ BHD",
  "Not sure yet",
]);

const ALLOWED_TIMELINES = new Set([
  "ASAP",
  "1–2 weeks",
  "Within 1 month",
  "1–3 months",
  "Flexible",
]);

function text(value: FormDataEntryValue | null, maxLength: number, fallback = "") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length <= maxLength ? trimmed : fallback;
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
      );
    }

    const formData = await request.formData();
    const name = text(formData.get("name"), MAX_NAME_LENGTH);
    const email = text(formData.get("email"), MAX_EMAIL_LENGTH);
    const company = text(formData.get("company"), MAX_COMPANY_LENGTH) || null;
    const phone = text(formData.get("phone"), MAX_PHONE_LENGTH) || null;
    const service = text(formData.get("service"), MAX_SERVICE_LENGTH);
    const budget = text(formData.get("budget"), MAX_BUDGET_LENGTH) || null;
    const timeline = text(formData.get("timeline"), MAX_TIMELINE_LENGTH) || null;
    const projectDetails = text(formData.get("projectDetails"), MAX_MESSAGE_LENGTH);
    const attachment = formData.get("attachment");

    if (!name || !email || !service || !projectDetails) {
      return NextResponse.json({ error: "Name, email, service, and project details are required." }, { status: 400 });
    }

    if (!validEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    if (!ALLOWED_SERVICES.has(service)) {
      return NextResponse.json({ error: "Please choose a valid service." }, { status: 400 });
    }

    if (budget && !ALLOWED_BUDGETS.has(budget)) {
      return NextResponse.json({ error: "Please choose a valid budget range." }, { status: 400 });
    }

    if (timeline && !ALLOWED_TIMELINES.has(timeline)) {
      return NextResponse.json({ error: "Please choose a valid timeline." }, { status: 400 });
    }

    let attachmentUrl: string | null = null;
    let attachmentName: string | null = null;

    if (attachment instanceof File && attachment.size > 0) {
      const extension = IMAGE_EXTENSIONS.get(attachment.type);
      if (!extension) {
        return NextResponse.json({ error: "Only PNG, JPG, WEBP, and GIF images are allowed." }, { status: 400 });
      }
      if (attachment.size > MAX_IMAGE_SIZE_BYTES) {
        return NextResponse.json({ error: "Attachment must be smaller than 5MB." }, { status: 400 });
      }

      const safeOriginalName = attachment.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 120) || "attachment";
      const filename = `${randomUUID()}.${extension}`;
      const upload = await uploadMediaImage(
        filename,
        Buffer.from(await attachment.arrayBuffer()),
        attachment.type,
        CONTACT_ATTACHMENT_DIR,
      );
      attachmentUrl = upload.path;
      attachmentName = safeOriginalName;
    }

    const rows = await prisma.$queryRaw<any[]>`
      INSERT INTO "ContactMessage"
        ("name", "email", "phone", "company", "service", "budget", "timeline", "contactType", "message", "details", "attachmentUrl", "attachmentName")
      VALUES
        (${name}, ${email}, ${phone}, ${company}, ${service}, ${budget}, ${timeline}, ${"Project Request"}, ${projectDetails}, ${null}, ${attachmentUrl}, ${attachmentName})
      RETURNING *
    `;

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error("Contact project request error:", error);
    return NextResponse.json({ error: "Failed to send project request." }, { status: 500 });
  }
}
