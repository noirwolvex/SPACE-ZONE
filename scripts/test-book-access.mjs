/**
 * End-to-end verification of the book access-control rules against a running
 * server, using real Supabase sessions (no mocking of the auth layer).
 *
 * Usage: node scripts/test-book-access.mjs [baseUrl]
 */
import "dotenv/config";
import { createHmac } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";

const BASE = process.argv[2] ?? "http://localhost:3100";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const admin = createClient(SUPABASE_URL, SERVICE, { auth: { persistSession: false } });

const projectRef = new URL(SUPABASE_URL).hostname.split(".")[0];
const COOKIE_NAME = `sb-${projectRef}-auth-token`;

const TAP_WEBHOOK_SECRET = process.env.TAP_WEBHOOK_SECRET;

let pass = 0;
let fail = 0;
let skipped = 0;
function check(name, ok, detail) {
  if (ok) {
    pass += 1;
    console.log(`  PASS  ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    fail += 1;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function skip(name, why) {
  skipped += 1;
  console.log(`  SKIP  ${name} — ${why}`);
}

/**
 * Post a webhook payload signed exactly as verifyTapWebhookSignature() expects:
 * HMAC-SHA256 over the raw body, hex, in the `hashstring` header.
 */
async function postSignedWebhook(payload) {
  const rawBody = JSON.stringify(payload);
  const signature = createHmac("sha256", TAP_WEBHOOK_SECRET).update(rawBody, "utf8").digest("hex");

  const res = await fetch(`${BASE}/api/payments/tap/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json", hashstring: signature },
    body: rawBody,
  });

  return { status: res.status, body: await res.json().catch(() => ({})) };
}

/** Start a purchase as the signed-in test user and return the created order. */
async function startPurchase(bookId, cookie) {
  const res = await fetch(`${BASE}/api/books/buy`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({ bookId }),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

/** Build the cookie header @supabase/ssr expects for a given session. */
function sessionCookie(session) {
  const payload = JSON.stringify({
    access_token: session.access_token,
    token_type: session.token_type,
    expires_in: session.expires_in,
    expires_at: session.expires_at,
    refresh_token: session.refresh_token,
    user: session.user,
  });
  const encoded = "base64-" + Buffer.from(payload, "utf8").toString("base64url");

  // Chunk to stay under the 4KB per-cookie browser limit, as the SDK does.
  const CHUNK = 3180;
  if (encoded.length <= CHUNK) return `${COOKIE_NAME}=${encoded}`;

  const parts = [];
  for (let i = 0, n = 0; i < encoded.length; i += CHUNK, n += 1) {
    parts.push(`${COOKIE_NAME}.${n}=${encoded.slice(i, i + CHUNK)}`);
  }
  return parts.join("; ");
}

async function signIn(email, password) {
  const client = createClient(SUPABASE_URL, ANON, { auth: { persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`);
  return sessionCookie(data.session);
}

async function req(path, cookie) {
  const res = await fetch(`${BASE}${path}`, {
    headers: cookie ? { cookie } : {},
    redirect: "manual",
  });
  return { status: res.status, location: res.headers.get("location"), res };
}

console.log(`\nTesting against ${BASE}\n`);

// ---------------------------------------------------------------------------
// Fixtures: a free book and a paid book, created directly so the test is
// independent of the admin UI. Both point at a real stored PDF.
// ---------------------------------------------------------------------------
const { rows: sample } = await pool.query(
  `select path from "Book" where path like 'supabase://%' limit 1`
);
const supabaseRef = sample[0]?.path;
if (!supabaseRef) throw new Error("No Supabase-hosted book found to use as fixture.");

const { rows: localSample } = await pool.query(
  `select path from "Book" where path like 'local://%' limit 1`
);
const localRef = localSample[0]?.path;

const ids = {};
const PRICES = { paid: 5, webhook: 7.5, tamper: 3.25 };
for (const [key, isFree, price] of [
  ["free", true, null],
  ["paid", false, PRICES.paid],
  // Dedicated fixtures so the payment tests never depend on each other's state.
  ["webhook", false, PRICES.webhook],
  ["tamper", false, PRICES.tamper],
]) {
  const id = `test_${key}_${Date.now()}`;
  await pool.query(
    `insert into "Book" (id, filename, path, size, title, category, "isFree", price, currency, "updatedAt")
     values ($1,$2,$3,$4,$5,'Other',$6,$7,'BHD', now())`,
    [id, `${key}.pdf`, `${supabaseRef}#${id}`, 1000, `TEST ${key.toUpperCase()}`, isFree, price]
  );
  ids[key] = id;
}
// Point every fixture at the real object so signing succeeds.
for (const id of Object.values(ids)) {
  await pool.query(`update "Book" set path = $1 where id = $2`, [supabaseRef + "?t=" + id, id]);
}

const { rows: cust } = await pool.query(
  `select id, email from "Customer" where email = 'debugsignup5@example.com'`
);

// Disposable test user, created and deleted by this script so no real account
// is modified and no real password is needed.
const TEST_EMAIL = `booktest_${Date.now()}@example.com`;
const TEST_PASSWORD = `Tst!${Math.random().toString(36).slice(2)}Aa1`;
const { data: createdUser, error: createErr } = await admin.auth.admin.createUser({
  email: TEST_EMAIL,
  password: TEST_PASSWORD,
  email_confirm: true,
});
if (createErr) throw new Error(`could not create test user: ${createErr.message}`);
const testAuthUserId = createdUser.user.id;

let userCustomerId = null;

try {
  // -------------------------------------------------------------------------
  console.log("TEST 1 — free book: anonymous user can read");
  {
    const { status, location } = await req(`/api/books/${ids.free}/access?mode=read`);
    check(
      "free book grants access without login",
      status === 307 || status === 302 || status === 200,
      `HTTP ${status}${location ? ` -> ${location.slice(0, 60)}...` : ""}`
    );
    check("free book URL is a signed URL (not public)", !location || location.includes("/object/sign/"), location ? location.split("?")[0].slice(-40) : "streamed");
  }

  // -------------------------------------------------------------------------
  console.log("\nTEST 2 — paid book: anonymous user is refused");
  {
    const { status, res } = await req(`/api/books/${ids.paid}/access?mode=read`);
    const body = await res.json().catch(() => ({}));
    check("anonymous gets 401 on paid book", status === 401, `HTTP ${status} ${body.code ?? ""}`);
    check("no file location leaked in refusal", !JSON.stringify(body).includes("supabase.co"), "body clean");
  }

  // -------------------------------------------------------------------------
  console.log("\nTEST 3 — paid book: signed-in non-owner is refused with 402");
  const userCookie = await signIn(TEST_EMAIL, TEST_PASSWORD);
  {
    // Requesting a paid book is what resolves the Supabase user to a Customer.
    const { status, res } = await req(`/api/books/${ids.paid}/access?mode=read`, userCookie);
    const body = await res.json().catch(() => ({}));
    check("non-owner gets 402 payment_required", status === 402, `HTTP ${status} ${body.code ?? ""}`);
    check("no file location leaked", !JSON.stringify(body).includes("supabase.co"), "body clean");

    const { rows } = await pool.query(`select id from "Customer" where email = $1`, [TEST_EMAIL]);
    userCustomerId = rows[0]?.id ?? null;
    check("Supabase user auto-linked to a Customer row", Boolean(userCustomerId), userCustomerId ?? "missing");
  }

  // -------------------------------------------------------------------------
  console.log("\nTEST 4 — buy does NOT grant access (payment-ready flow)");
  {
    const res = await fetch(`${BASE}/api/books/buy`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: userCookie },
      body: JSON.stringify({ bookId: ids.paid }),
    });
    const body = await res.json().catch(() => ({}));
    check("buy returns 402 payment_required", res.status === 402, `HTTP ${res.status} ${body.code ?? ""}`);

    const { rows } = await pool.query(
      `select count(*)::int c from "PurchasedBook" where "customerId"=$1 and "bookId"=$2`,
      [userCustomerId, ids.paid]
    );
    check("no PurchasedBook created by buy", rows[0].c === 0, `rows=${rows[0].c}`);

    const { rows: orders } = await pool.query(
      `select status from "BookOrder" where "customerId"=$1 and "bookId"=$2`,
      [userCustomerId, ids.paid]
    );
    check("pending BookOrder was created", orders.length === 1 && orders[0].status === "PENDING", `status=${orders[0]?.status}`);

    // still refused after buying
    const after = await req(`/api/books/${ids.paid}/access?mode=read`, userCookie);
    check("access still refused after buy", after.status === 402, `HTTP ${after.status}`);
  }

  // -------------------------------------------------------------------------
  console.log("\nTEST 5 — owner can read paid book");
  {
    await pool.query(
      `insert into "PurchasedBook" (id, "customerId", "bookId", price, currency, source, "updatedAt")
       values ($1,$2,$3,5,'BHD','ADMIN_GRANT', now())
       on conflict ("customerId","bookId") do nothing`,
      [`test_purchase_${Date.now()}`, userCustomerId, ids.paid]
    );

    const { status, location } = await req(`/api/books/${ids.paid}/access?mode=read`, userCookie);
    check("owner is granted access", status === 307 || status === 302 || status === 200, `HTTP ${status}`);
    check("owner receives a signed URL", !location || location.includes("/object/sign/"), location ? "signed" : "streamed");
  }

  // -------------------------------------------------------------------------
  console.log("\nTEST 6 — direct storage URL access is blocked");
  {
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/book2/47bca59e-749b-4d4e-b675-d162786e520c.pdf`;
    const r1 = await fetch(publicUrl, { redirect: "manual" });
    check("private bucket rejects anonymous direct URL", r1.status >= 400, `HTTP ${r1.status}`);

    const legacyUrl = `${SUPABASE_URL}/storage/v1/object/public/books/0dbbaf43-a893-4056-ae53-68f834b2f213.pdf?cb=${Date.now()}`;
    const r2 = await fetch(legacyUrl, { redirect: "manual" });
    check("legacy bucket rejects anonymous direct URL", r2.status >= 400, `HTTP ${r2.status}`);

    const r3 = await fetch(`${BASE}/books/31792550-ef9f-4eff-97ae-2f7c1aa50723.pdf`, { redirect: "manual" });
    check("local PDFs no longer served from /public", r3.status === 404, `HTTP ${r3.status}`);
  }

  // -------------------------------------------------------------------------
  console.log("\nTEST 7 — admin routes reject non-admins");
  {
    const anon = await req(`/api/admin/books/list`);
    check("admin list rejects anonymous", anon.status === 401, `HTTP ${anon.status}`);

    const asUser = await req(`/api/admin/books/list`, userCookie);
    check("admin list rejects normal user", asUser.status === 403, `HTTP ${asUser.status}`);

    const legacy = await fetch(`${BASE}/api/admin/books/list`, {
      headers: { "x-admin-username": "admin", "x-admin-password": "admin" },
      redirect: "manual",
    });
    check("legacy admin/admin header no longer works", legacy.status === 401, `HTTP ${legacy.status}`);
  }

  // -------------------------------------------------------------------------
  console.log("\nTEST 8 — webhook cannot be forged");
  {
    const res = await fetch(`${BASE}/api/payments/tap/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "chg_fake", status: "CAPTURED", reference: { order: "BK-FAKE" } }),
    });
    check("unsigned webhook refused", res.status === 401 || res.status === 503, `HTTP ${res.status}`);
  }

  // -------------------------------------------------------------------------
  console.log("\nTEST 9 — listing pages never expose a storage path");
  {
    const res = await fetch(`${BASE}/books`);
    const html = await res.text();
    check("/books HTML contains no supabase URL", !html.includes("supabase.co/storage/v1/object/public"), "clean");
    check("/books HTML contains no storage ref", !html.includes("supabase://") && !html.includes("local://"), "clean");
  }

  // -------------------------------------------------------------------------
  console.log("\nTEST 10 — a REFUNDED purchase revokes access");
  {
    // The user owns ids.paid from TEST 5. Refund it and the file must close.
    await pool.query(
      `update "PurchasedBook" set status = 'REFUNDED' where "customerId" = $1 and "bookId" = $2`,
      [userCustomerId, ids.paid]
    );

    const refunded = await req(`/api/books/${ids.paid}/access?mode=read`, userCookie);
    check("refunded owner is refused with 402", refunded.status === 402, `HTTP ${refunded.status}`);

    const libraryRes = await fetch(`${BASE}/library`, { headers: { cookie: userCookie } });
    const libraryHtml = await libraryRes.text();
    check("refunded book is absent from /library", !libraryHtml.includes(ids.paid), "not listed");

    // Restore so later assertions see the original state.
    await pool.query(
      `update "PurchasedBook" set status = 'COMPLETED' where "customerId" = $1 and "bookId" = $2`,
      [userCustomerId, ids.paid]
    );

    const restored = await req(`/api/books/${ids.paid}/access?mode=read`, userCookie);
    check("access returns when the purchase is COMPLETED again", restored.status !== 402, `HTTP ${restored.status}`);
  }

  // -------------------------------------------------------------------------
  console.log("\nTEST 11 — CASE 3: confirmed payment creates ownership");
  if (!TAP_WEBHOOK_SECRET) {
    skip("signed webhook fulfilment", "TAP_WEBHOOK_SECRET is not set");
  } else {
    await startPurchase(ids.webhook, userCookie);

    const { rows: created } = await pool.query(
      `select id, "orderNo", status from "BookOrder" where "customerId" = $1 and "bookId" = $2`,
      [userCustomerId, ids.webhook]
    );
    check("buy created exactly one PENDING order", created.length === 1 && created[0].status === "PENDING", `n=${created.length}`);

    const orderNo = created[0]?.orderNo;
    const chargeId = `chg_test_${Date.now()}`;
    const paidPayload = {
      id: chargeId,
      status: "CAPTURED",
      amount: PRICES.webhook,
      currency: "BHD",
      reference: { order: orderNo },
    };

    const first = await postSignedWebhook(paidPayload);
    check("signed webhook accepted", first.status === 200, `HTTP ${first.status} ${first.body?.error ?? ""}`);

    const { rows: paidOrder } = await pool.query(`select status, "tapChargeId" from "BookOrder" where "orderNo" = $1`, [orderNo]);
    check("order became PAID", paidOrder[0]?.status === "PAID", `status=${paidOrder[0]?.status}`);
    check("charge id recorded on the order", paidOrder[0]?.tapChargeId === chargeId, paidOrder[0]?.tapChargeId ?? "null");

    const { rows: owned } = await pool.query(
      `select id, status, "transactionId", price::float, currency, source
         from "PurchasedBook" where "customerId" = $1 and "bookId" = $2`,
      [userCustomerId, ids.webhook]
    );
    check("PurchasedBook was created", owned.length === 1, `rows=${owned.length}`);
    check("ownership is COMPLETED", owned[0]?.status === "COMPLETED", owned[0]?.status ?? "missing");
    check("transactionId is persisted", owned[0]?.transactionId === chargeId, owned[0]?.transactionId ?? "null");
    check("source is PAYMENT", owned[0]?.source === "PAYMENT", owned[0]?.source ?? "missing");
    check("amount recorded matches the order", owned[0]?.price === PRICES.webhook, String(owned[0]?.price));

    const access = await req(`/api/books/${ids.webhook}/access?mode=read`, userCookie);
    check("user can now read the book", access.status === 307 || access.status === 302 || access.status === 200, `HTTP ${access.status}`);

    // Providers retry. A replay must not double-grant or error.
    const replay = await postSignedWebhook(paidPayload);
    check("replayed webhook is idempotent", replay.status === 200 && replay.body?.alreadyFulfilled === true, `HTTP ${replay.status}`);

    const { rows: afterReplay } = await pool.query(
      `select count(*)::int c from "PurchasedBook" where "customerId" = $1 and "bookId" = $2`,
      [userCustomerId, ids.webhook]
    );
    check("still exactly one ownership row after replay", afterReplay[0].c === 1, `rows=${afterReplay[0].c}`);

    // A late failure notice must not undo a settled payment.
    const late = await postSignedWebhook({ ...paidPayload, status: "FAILED" });
    const { rows: stillPaid } = await pool.query(`select status from "BookOrder" where "orderNo" = $1`, [orderNo]);
    check("late FAILED webhook cannot reopen a PAID order", stillPaid[0]?.status === "PAID", `status=${stillPaid[0]?.status} (HTTP ${late.status})`);
  }

  // -------------------------------------------------------------------------
  console.log("\nTEST 12 — a tampered amount cannot buy a book");
  if (!TAP_WEBHOOK_SECRET) {
    skip("amount tampering rejected", "TAP_WEBHOOK_SECRET is not set");
  } else {
    await startPurchase(ids.tamper, userCookie);

    const { rows: order } = await pool.query(
      `select "orderNo" from "BookOrder" where "customerId" = $1 and "bookId" = $2 and status = 'PENDING'`,
      [userCustomerId, ids.tamper]
    );
    const orderNo = order[0]?.orderNo;

    // Correctly signed, but paying 0.100 for a 3.250 book.
    const underpaid = await postSignedWebhook({
      id: `chg_tamper_${Date.now()}`,
      status: "CAPTURED",
      amount: 0.1,
      currency: "BHD",
      reference: { order: orderNo },
    });
    check("underpaid charge is rejected", underpaid.status === 422, `HTTP ${underpaid.status}`);

    const wrongCurrency = await postSignedWebhook({
      id: `chg_currency_${Date.now()}`,
      status: "CAPTURED",
      amount: PRICES.tamper,
      currency: "USD",
      reference: { order: orderNo },
    });
    check("mismatched currency is rejected", wrongCurrency.status === 422, `HTTP ${wrongCurrency.status}`);

    const { rows: owned } = await pool.query(
      `select count(*)::int c from "PurchasedBook" where "customerId" = $1 and "bookId" = $2`,
      [userCustomerId, ids.tamper]
    );
    check("no ownership granted by a rejected charge", owned[0].c === 0, `rows=${owned[0].c}`);

    const { rows: stillPending } = await pool.query(`select status from "BookOrder" where "orderNo" = $1`, [orderNo]);
    check("order remains PENDING", stillPending[0]?.status === "PENDING", `status=${stillPending[0]?.status}`);

    const stillLocked = await req(`/api/books/${ids.tamper}/access?mode=read`, userCookie);
    check("book stays locked", stillLocked.status === 402, `HTTP ${stillLocked.status}`);
  }

  // -------------------------------------------------------------------------
  console.log("\nTEST 13 — CASE 5: the same book cannot be bought twice");
  {
    // Concurrent Buy clicks must collapse to a single payable order.
    const [a, b] = await Promise.all([
      startPurchase(ids.paid, userCookie),
      startPurchase(ids.paid, userCookie),
    ]);
    check("concurrent buys do not 500", a.status < 500 && b.status < 500, `HTTP ${a.status}/${b.status}`);

    // The user already owns ids.paid (restored in TEST 10), so both are no-ops.
    check("owner is told they already own it", a.body?.alreadyOwned === true, JSON.stringify(a.body?.status ?? ""));

    const { rows: ownedRows } = await pool.query(
      `select count(*)::int c from "PurchasedBook" where "customerId" = $1 and "bookId" = $2`,
      [userCustomerId, ids.paid]
    );
    check("still exactly one ownership row", ownedRows[0].c === 1, `rows=${ownedRows[0].c}`);

    // And on an unowned book, two parallel clicks still yield one PENDING order.
    await pool.query(`delete from "BookOrder" where "customerId" = $1 and "bookId" = $2`, [
      userCustomerId,
      ids.tamper,
    ]);

    const [c, d] = await Promise.all([
      startPurchase(ids.tamper, userCookie),
      startPurchase(ids.tamper, userCookie),
    ]);
    check("parallel first-time buys do not 500", c.status < 500 && d.status < 500, `HTTP ${c.status}/${d.status}`);

    const { rows: pendingRows } = await pool.query(
      `select count(*)::int c from "BookOrder" where "customerId" = $1 and "bookId" = $2 and status = 'PENDING'`,
      [userCustomerId, ids.tamper]
    );
    check("only one PENDING order exists", pendingRows[0].c === 1, `rows=${pendingRows[0].c}`);
  }
} finally {
  // Clean up fixtures only (never touches pre-existing rows).
  await pool.query(`delete from "PurchasedBook" where "bookId" = any($1)`, [Object.values(ids)]);
  await pool.query(`delete from "BookOrder" where "bookId" = any($1)`, [Object.values(ids)]);
  await pool.query(`delete from "Book" where id = any($1)`, [Object.values(ids)]);
  if (userCustomerId) {
    await pool.query(`delete from "PurchasedBook" where "customerId" = $1`, [userCustomerId]);
    await pool.query(`delete from "BookOrder" where "customerId" = $1`, [userCustomerId]);
    await pool.query(`delete from "Customer" where id = $1`, [userCustomerId]);
  }
  await admin.auth.admin.deleteUser(testAuthUserId).catch(() => undefined);
  await pool.end();
}

console.log(`\n${pass} passed, ${fail} failed${skipped ? `, ${skipped} skipped` : ""}\n`);

if (skipped) {
  console.log("Set TAP_SECRET_KEY and TAP_WEBHOOK_SECRET (any non-empty values) to run the payment tests.\n");
}

process.exit(fail === 0 ? 0 : 1);
