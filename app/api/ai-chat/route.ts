import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key is not configured on the server." },
        { status: 500 }
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
      }
    );

    const responseData = await geminiResponse.json();

    if (!geminiResponse.ok) {
      const errorMessage =
        responseData?.error?.message ||
        "Gemini API request failed.";

      return NextResponse.json({ error: errorMessage }, { status: 500 });
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
      {
        error:
          error instanceof Error ? error.message : "Unexpected server error.",
      },
      { status: 500 }
    );
  }
}
