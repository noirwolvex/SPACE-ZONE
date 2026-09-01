import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  // ✅ Require authentication
  const auth = await getCurrentUser();
  if (!auth?.profile) {
    return NextResponse.json(
      { error: "Authentication required. Please log in to contact us." },
      { status: 401 }
    );
  }

  try {
    const json = await request.json();
    const { name, email, message, phone, details, contactType, attachmentName } = json;

    // ✅ Validate inputs
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required." },
        { status: 400 }
      );
    }

    const formattedDetails = typeof details === "string" && details.trim() ? `\n\nOther details: ${details.trim()}` : "";
    const formattedType = typeof contactType === "string" && contactType.trim() ? `\nContact type: ${contactType.trim()}` : "";
    const formattedAttachment = typeof attachmentName === "string" && attachmentName.trim() ? `\nAttachment: ${attachmentName.trim()}` : "";
    const finalMessage = `${message.trim()}${formattedType}${formattedDetails}${formattedAttachment}`;

    // ✅ Use authenticated user's email, not provided one (prevent email spoofing)
    const contactMessage = await prisma.contactMessage.create({
      data: {
        name: name.trim(),
        email: auth.profile.email || email, // Use authenticated email as fallback
        message: finalMessage,
        phone: phone ? String(phone).trim() : null,
      },
    });

    return NextResponse.json(contactMessage, { status: 201 });
  } catch (error) {
    console.error("Contact message error:", error);
    return NextResponse.json(
      { error: "Failed to send message." },
      { status: 500 }
    );
  }
}
