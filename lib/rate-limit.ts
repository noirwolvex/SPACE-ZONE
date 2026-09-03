import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

type RateLimitResult = {
  limited: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * Distributed fixed-window limiter backed by PostgreSQL.
 *
 * Unlike an in-memory Map, counters are shared across all server instances and
 * Cloudflare/Node worker isolates. This is intentionally used only as abuse
 * protection, never for financial accounting.
 */
export async function consumeRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const normalizedKey = key.trim().slice(0, 255) || "unknown";
  const safeMax = Math.max(1, Math.floor(maxRequests));
  const safeWindowMs = Math.max(1000, Math.floor(windowMs));

  const rows = await prisma.$queryRaw<Array<{ count: number; resetAt: Date }>>`
    INSERT INTO "RateLimitCounter" ("id", "key", "windowStart", "count", "resetAt", "updatedAt")
    VALUES (
      ${randomUUID()},
      ${normalizedKey},
      NOW(),
      1,
      NOW() + (${safeWindowMs} * INTERVAL '1 millisecond'),
      NOW()
    )
    ON CONFLICT ("key") DO UPDATE
    SET
      "windowStart" = CASE
        WHEN "RateLimitCounter"."resetAt" <= NOW() THEN NOW()
        ELSE "RateLimitCounter"."windowStart"
      END,
      "count" = CASE
        WHEN "RateLimitCounter"."resetAt" <= NOW() THEN 1
        ELSE "RateLimitCounter"."count" + 1
      END,
      "resetAt" = CASE
        WHEN "RateLimitCounter"."resetAt" <= NOW()
          THEN NOW() + (${safeWindowMs} * INTERVAL '1 millisecond')
        ELSE "RateLimitCounter"."resetAt"
      END,
      "updatedAt" = NOW()
    RETURNING "count", "resetAt" AS "resetAt"
  `;

  const row = rows[0];
  if (!row) {
    throw new Error("Rate limit counter did not return a result.");
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((row.resetAt.getTime() - Date.now()) / 1000));
  const limited = row.count > safeMax;

  return {
    limited,
    remaining: Math.max(0, safeMax - row.count),
    retryAfterSeconds: limited ? retryAfterSeconds : 0,
  };
}

export function clientIp(request: Request) {
  return (
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}
