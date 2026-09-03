import { NextRequest, NextResponse } from "next/server";
import { clientIp, consumeRateLimit } from "@/lib/rate-limit";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
const MAX_MESSAGE_LENGTH = 4000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const PROVIDER_TIMEOUT_MS = 15_000;

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await consumeRateLimit(
      `ai-chat:${clientIp(request)}`,
      RATE_LIMIT_MAX_REQUESTS,
      RATE_LIMIT_WINDOW_MS,
    );

    if (rateLimit.limited) {
      return NextResponse.json(
        { error: "Too many AI requests. Please try again shortly." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        },
      );
    }

    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.` },
        { status: 413 },
      );
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key is not configured on the server." },
        { status: 500 },
      );
    }

    const prompt = `You are a highly professional AI assistant for Space Zone Media.
- Help users in Arabic or English.
- Be concise, polished, and friendly.
- Explain services, pricing, website/branding support, product guidance, and business recommendations.
- Keep tone professional, confident, and helpful.

User message:
${message}`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 800,
          },
        }),
        signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
        cache: "no-store",
      },
    );

    const responseData = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error("Gemini API request failed:", responseData?.error?.message || "unknown provider error");
      return NextResponse.json(
        { error: "AI service is temporarily unavailable. Please try again later." },
        { status: 502 },
      );
    }

    const reply =
      responseData?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text ?? "")
        .join("")
        .trim() ||
      "عذراً، لم أستطع توليد رد مناسب الآن. حاول مرة أخرى.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("AI chat route error:", error);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 },
    );
  }
}
