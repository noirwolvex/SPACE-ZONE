import { NextRequest, NextResponse } from "next/server";

/**
 * Legacy download URL, kept so existing links keep working.
 * All authorization and file resolution now lives in /api/books/[id]/access.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const target = new URL(`/api/books/${id}/access`, request.nextUrl.origin);
  target.searchParams.set("mode", "download");
  return NextResponse.redirect(target);
}
