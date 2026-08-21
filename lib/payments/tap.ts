import { createHmac, timingSafeEqual } from "crypto";

/**
 * Tap Payments integration.
 *
 * Charge creation is the only outbound call; ownership is never decided here.
 * A charge merely produces a hosted payment URL — the webhook is what grants
 * access, and it re-verifies the amount independently.
 *
 * Required environment variables:
 *   TAP_SECRET_KEY       server-side API key (sk_test_… / sk_live_…)
 *   TAP_WEBHOOK_SECRET   shared secret used to sign webhook payloads
 */

export const TAP_SECRET_KEY = process.env.TAP_SECRET_KEY ?? "";
export const TAP_WEBHOOK_SECRET = process.env.TAP_WEBHOOK_SECRET ?? "";

const TAP_CHARGES_ENDPOINT = "https://api.tap.company/v2/charges";
const TAP_REQUEST_TIMEOUT_MS = 15_000;

export function isTapConfigured() {
  return Boolean(TAP_SECRET_KEY);
}

export type TapChargeRequest = {
  orderNo: string;
  amount: number;
  currency: string;
  description: string;
  customer: { id: string; email: string | null; name: string | null };
  redirectUrl: string;
  postUrl: string;
};

export type TapChargeResult =
  | { ok: true; chargeId: string; paymentUrl: string }
  | { ok: false; error: string };

/** Tap requires a non-empty name; fall back to the local part of the email. */
function splitCustomerName(name: string | null, email: string | null) {
  const source = (name ?? email?.split("@")[0] ?? "Customer").trim();
  const [first, ...rest] = source.split(/\s+/);
  return { first: first || "Customer", last: rest.join(" ") || "-" };
}

/**
 * Create a charge with Tap and return the hosted payment URL.
 *
 * `reference.order` carries our orderNo, which is how the webhook finds the
 * order again. Network and shape failures are returned, never thrown, so a
 * provider outage leaves the order PENDING instead of 500-ing the Buy click.
 */
export async function createTapCharge(request: TapChargeRequest): Promise<TapChargeResult> {
  if (!isTapConfigured()) {
    return { ok: false, error: "Payment provider is not configured yet." };
  }

  const { first, last } = splitCustomerName(request.customer.name, request.customer.email);

  const payload = {
    amount: request.amount,
    currency: request.currency,
    description: request.description,
    // Tap echoes this back on the webhook.
    reference: { order: request.orderNo },
    customer: {
      first_name: first,
      last_name: last,
      ...(request.customer.email ? { email: request.customer.email } : {}),
    },
    // Hosted checkout across all enabled methods.
    source: { id: "src_all" },
    threeDSecure: true,
    save_card: false,
    customer_initiated: true,
    post: { url: request.postUrl },
    redirect: { url: request.redirectUrl },
    metadata: { customerId: request.customer.id, orderNo: request.orderNo },
  };

  try {
    const response = await fetch(TAP_CHARGES_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TAP_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TAP_REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });

    const body = (await response.json().catch(() => null)) as
      | { id?: string; transaction?: { url?: string }; errors?: { description?: string }[] }
      | null;

    if (!response.ok) {
      const description = body?.errors?.[0]?.description;
      console.error(`Tap charge creation failed (HTTP ${response.status}):`, description ?? body);
      return { ok: false, error: description ?? "Could not start the payment. Please try again." };
    }

    const chargeId = typeof body?.id === "string" ? body.id : null;
    const paymentUrl = typeof body?.transaction?.url === "string" ? body.transaction.url : null;

    if (!chargeId || !paymentUrl) {
      console.error("Tap charge response was missing an id or payment URL:", body);
      return { ok: false, error: "Payment provider returned an unexpected response." };
    }

    return { ok: true, chargeId, paymentUrl };
  } catch (error) {
    console.error("Tap charge request threw:", error);
    return { ok: false, error: "Could not reach the payment provider. Please try again." };
  }
}

/**
 * Verify a webhook signature using a constant-time comparison.
 * Returns false when no secret is configured, so unsigned calls are never trusted.
 */
export function verifyTapWebhookSignature(rawBody: string, signature: string | null) {
  if (!TAP_WEBHOOK_SECRET || !signature) return false;

  const expected = createHmac("sha256", TAP_WEBHOOK_SECRET).update(rawBody, "utf8").digest("hex");
  const received = signature.trim().toLowerCase();

  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(received, "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

/** Map a Tap charge status onto our BookOrder status vocabulary. */
export function mapTapStatus(status: string | undefined): "PAID" | "FAILED" | "CANCELLED" | "PENDING" {
  switch ((status ?? "").toUpperCase()) {
    case "CAPTURED":
    case "PAID":
      return "PAID";
    case "FAILED":
    case "DECLINED":
    case "TIMEDOUT":
      return "FAILED";
    case "CANCELLED":
    case "VOID":
      return "CANCELLED";
    default:
      return "PENDING";
  }
}
