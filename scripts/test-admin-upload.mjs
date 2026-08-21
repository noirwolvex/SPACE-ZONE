/**
 * Verifies the admin book-creation flow end to end: free upload, paid upload,
 * and server-side rejection of invalid pricing.
 *
 * Usage: node scripts/test-admin-upload.mjs [baseUrl]
 */
import "dotenv/config";
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

let pass = 0;
let fail = 0;
const check = (name, ok, detail) => {
  ok ? pass++ : fail++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};

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
  const CHUNK = 3180;
  if (encoded.length <= CHUNK) return `${COOKIE_NAME}=${encoded}`;
  const parts = [];
  for (let i = 0, n = 0; i < encoded.length; i += CHUNK, n += 1) {
    parts.push(`${COOKIE_NAME}.${n}=${encoded.slice(i, i + CHUNK)}`);
  }
  return parts.join("; ");
}

// A disposable admin account, removed at the end.
const EMAIL = `admintest_${Date.now()}@example.com`;
const PASSWORD = `Adm!${Math.random().toString(36).slice(2)}Aa1`;
const { data: created, error: createErr } = await admin.auth.admin.createUser({
  email: EMAIL,
  password: PASSWORD,
  email_confirm: true,
});
if (createErr) throw new Error(createErr.message);

const anonClient = createClient(SUPABASE_URL, ANON, { auth: { persistSession: false } });
const { data: signIn, error: signInErr } = await anonClient.auth.signInWithPassword({
  email: EMAIL,
  password: PASSWORD,
});
if (signInErr) throw new Error(signInErr.message);
const cookie = sessionCookie(signIn.data?.session ?? signIn.session);

// Provision the Customer row, then promote it to ADMIN.
await fetch(`${BASE}/api/admin/books/list`, { headers: { cookie } });
await pool.query(
  `insert into "Customer" (id, email, name, role, "supabaseId", "updatedAt")
   values ($1,$2,'Admin Test','ADMIN',$3, now())
   on conflict (email) do update set role='ADMIN'`,
  [`admtest_${Date.now()}`, EMAIL, created.user.id]
);

const { rows: adminRows } = await pool.query(`select id from "Customer" where email=$1`, [EMAIL]);
const adminCustomerId = adminRows[0].id;

// Minimal valid PDF payload (passes the magic-byte check).
const pdfBytes = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n", "latin1");

async function upload(fields) {
  const form = new FormData();
  form.append("file", new Blob([pdfBytes], { type: "application/pdf" }), "test.pdf");
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  const res = await fetch(`${BASE}/api/admin/books/upload`, { method: "POST", headers: { cookie }, body: form });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

const createdIds = [];

try {
  console.log(`\nTesting admin upload against ${BASE}\n`);

  console.log("TEST A — admin can create a FREE book");
  {
    const { status, body } = await upload({
      title: "E2E Free Book",
      category: "Storybook",
      accessType: "FREE",
      price: "",
      currency: "BHD",
    });
    check("upload succeeds", status === 200, `HTTP ${status} ${body.error ?? ""}`);
    check("saved as free", body.isFree === true, `isFree=${body.isFree}`);
    check("price is null for free book", body.price === null, `price=${JSON.stringify(body.price)}`);
    check("no storage path in response", !JSON.stringify(body).includes("supabase://"), "clean");
    if (body.id) createdIds.push(body.id);
  }

  console.log("\nTEST B — admin can create a PAID book");
  {
    const { status, body } = await upload({
      title: "E2E Paid Book",
      category: "Science",
      accessType: "PAID",
      price: "5",
      currency: "BHD",
    });
    check("upload succeeds", status === 200, `HTTP ${status} ${body.error ?? ""}`);
    check("saved as paid", body.isFree === false, `isFree=${body.isFree}`);
    check("price stored as 5", Number(body.price) === 5, `price=${body.price}`);
    check("currency stored as BHD", body.currency === "BHD", `currency=${body.currency}`);
    if (body.id) createdIds.push(body.id);
  }

  console.log("\nTEST C — server rejects invalid pricing");
  {
    const missing = await upload({ title: "Bad 1", category: "Science", accessType: "PAID", price: "", currency: "BHD" });
    check("paid book without price rejected", missing.status === 400, `HTTP ${missing.status} — ${missing.body.error ?? ""}`);

    const zero = await upload({ title: "Bad 2", category: "Science", accessType: "PAID", price: "0", currency: "BHD" });
    check("paid book with price 0 rejected", zero.status === 400, `HTTP ${zero.status} — ${zero.body.error ?? ""}`);

    const negative = await upload({ title: "Bad 3", category: "Science", accessType: "PAID", price: "-5", currency: "BHD" });
    check("negative price rejected", negative.status === 400, `HTTP ${negative.status} — ${negative.body.error ?? ""}`);

    const badCurrency = await upload({ title: "Bad 4", category: "Science", accessType: "PAID", price: "5", currency: "XYZ" });
    check("unsupported currency rejected", badCurrency.status === 400, `HTTP ${badCurrency.status} — ${badCurrency.body.error ?? ""}`);
  }

  console.log("\nTEST D — non-PDF upload is rejected");
  {
    const form = new FormData();
    form.append("file", new Blob([Buffer.from("not a pdf at all")], { type: "application/pdf" }), "fake.pdf");
    form.append("title", "Fake");
    form.append("category", "Other");
    form.append("accessType", "FREE");
    const res = await fetch(`${BASE}/api/admin/books/upload`, { method: "POST", headers: { cookie }, body: form });
    const body = await res.json().catch(() => ({}));
    check("file without PDF magic bytes rejected", res.status === 400, `HTTP ${res.status} — ${body.error ?? ""}`);
  }

  console.log("\nTEST E — free book created above is publicly readable");
  {
    const freeId = createdIds[0];
    const res = await fetch(`${BASE}/api/books/${freeId}/access?mode=read`, { redirect: "manual" });
    check("anonymous can read the new free book", res.status === 307 || res.status === 200, `HTTP ${res.status}`);
  }

  console.log("\nTEST F — paid book created above is locked for anonymous users");
  {
    const paidId = createdIds[1];
    const res = await fetch(`${BASE}/api/books/${paidId}/access?mode=read`, { redirect: "manual" });
    check("anonymous refused on the new paid book", res.status === 401, `HTTP ${res.status}`);
  }
} finally {
  for (const id of createdIds) {
    await pool.query(`delete from "PurchasedBook" where "bookId"=$1`, [id]);
    await pool.query(`delete from "BookOrder" where "bookId"=$1`, [id]);
    await pool.query(`delete from "Book" where id=$1`, [id]);
  }
  await pool.query(`delete from "Customer" where id=$1`, [adminCustomerId]);
  await admin.auth.admin.deleteUser(created.user.id).catch(() => undefined);
  await pool.end();
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
