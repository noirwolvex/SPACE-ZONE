import { NextRequest, NextResponse } from "next/server";
import { resolveBookAccess } from "@/lib/book-access";
import { getBookFileSignedUrl, openLocalBookFile } from "@/lib/book-storage";
import { applyAuthCookies } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * Authorized book access.
 *
 *   GET /api/books/<id>/access?mode=read|download
 *
 * Free book  -> signed URL / authorized stream
 * Paid book  -> only when the caller owns it (or is an admin)
 *
 * The file location is never returned to an unauthorized caller, and no
 * response path bypasses resolveBookAccess().
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Scratch response carrying Supabase's refreshed auth cookies; every return
  // path re-applies them so an access check never costs the user their session.
  const authCarrier = NextResponse.next();
  const json = (body: unknown, init?: ResponseInit) =>
    applyAuthCookies(authCarrier, NextResponse.json(body, init));

  const mode = request.nextUrl.searchParams.get("mode") === "download" ? "download" : "read";
  const wantsJson = request.nextUrl.searchParams.get("format") === "json";

  const decision = await resolveBookAccess(request, authCarrier, id);

  if (decision.status === "not_found") {
    return json({ error: "Book not found." }, { status: 404 });
  }

  if (decision.status === "unauthenticated") {
    return json(
      {
        status: "authentication_required",
        code: "AUTH_REQUIRED",
        error: "Authentication required to access this book.",
        bookId: id,
      },
      { status: 401 }
    );
  }

  if (decision.status === "payment_required") {
    return json(
      {
        status: "payment_required",
        code: "PAYMENT_REQUIRED",
        error: "You do not own this book.",
        bookId: id,
        price: decision.book.price != null ? Number(decision.book.price) : null,
        currency: decision.book.currency,
      },
      { status: 402 }
    );
  }

  const { book } = decision;
  const downloadName = `${(book.title ?? book.filename ?? "book").replace(/[^\w\-. ]+/g, "_")}.pdf`;

  // Supabase-hosted objects: hand back a short-lived signed URL.
  const signedUrl = await getBookFileSignedUrl(book.path, mode === "download" ? downloadName : undefined);
  if (signedUrl) {
    if (wantsJson) {
      return json({ status: "granted", url: signedUrl, mode, expiresIn: 60 });
    }
    return applyAuthCookies(authCarrier, NextResponse.redirect(signedUrl));
  }

  // Locally stored (oversized) files: stream them through this authorized route.
  const localFile = await openLocalBookFile(book.path);
  if (localFile) {
    if (wantsJson) {
      return json({ status: "granted", url: `${request.nextUrl.pathname}?mode=${mode}`, mode, expiresIn: null });
    }

    const nodeStream = localFile.stream();
    const webStream = new ReadableStream<Uint8Array>({
      start(controller) {
        nodeStream.on("data", (chunk: string | Buffer) => {
          controller.enqueue(typeof chunk === "string" ? new TextEncoder().encode(chunk) : new Uint8Array(chunk));
        });
        nodeStream.on("end", () => controller.close());
        nodeStream.on("error", (streamError) => controller.error(streamError));
      },
      cancel() {
        nodeStream.destroy();
      },
    });

    return applyAuthCookies(
      authCarrier,
      new NextResponse(webStream, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Length": String(localFile.size),
          "Content-Disposition": `${mode === "download" ? "attachment" : "inline"}; filename="${downloadName}"`,
          // Never let a shared cache retain an authorized response.
          "Cache-Control": "private, no-store, max-age=0",
        },
      })
    );
  }

  // Fail closed: an unresolvable storage reference is an error, never a redirect
  // to whatever string happens to be in the database.
  console.error(`Unresolvable storage reference for book ${book.id}: ${book.path}`);
  return json({ error: "Book file is unavailable." }, { status: 500 });
}
