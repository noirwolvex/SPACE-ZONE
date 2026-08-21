/**
 * Verifies the book preview-gallery flow end to end: the 5–7 image rule, the
 * atomic add/remove/reorder plan, storage cleanup, cascade delete, and the fact
 * that no storage reference reaches the public details page.
 *
 * Usage: node scripts/test-book-gallery.mjs [baseUrl]
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
const EMAIL = `gallerytest_${Date.now()}@example.com`;
const PASSWORD = `Gal!${Math.random().toString(36).slice(2)}Aa1`;
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
const cookie = sessionCookie(signIn.session);

await fetch(`${BASE}/api/admin/books/list`, { headers: { cookie } });
await pool.query(
  `insert into "Customer" (id, email, name, role, "supabaseId", "updatedAt")
   values ($1,$2,'Gallery Test','ADMIN',$3, now())
   on conflict (email) do update set role='ADMIN'`,
  [`galtest_${Date.now()}`, EMAIL, created.user.id]
);

const pdfBytes = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n", "latin1");
// 1x1 PNG — smallest payload that is a genuinely valid image.
const pngBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

/** Build a multipart save request: metadata + optional PDF + gallery plan. */
async function save({ bookId, images = [], keep = [], withPdf = true, title = "E2E Gallery Book" }) {
  const form = new FormData();
  if (withPdf) form.append("file", new Blob([pdfBytes], { type: "application/pdf" }), "test.pdf");
  form.append("title", title);
  form.append("category", "Storybook");
  form.append("accessType", "FREE");
  form.append("price", "");
  form.append("currency", "BHD");
  if (bookId) form.append("bookId", bookId);

  const plan = [...keep.map((id) => ({ kind: "existing", id }))];
  images.forEach((_, index) => {
    form.append("previewImages", new Blob([pngBytes], { type: "image/png" }), `preview-${index}.png`);
    plan.push({ kind: "new", fileIndex: index });
  });
  form.append("gallery", JSON.stringify(plan));

  const res = await fetch(`${BASE}/api/admin/books/upload`, { method: "POST", headers: { cookie }, body: form });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

const imagesOf = async (bookId) =>
  (await pool.query(`select id, "imageUrl", "sortOrder" from "BookImage" where "bookId"=$1 order by "sortOrder" asc`, [bookId])).rows;

const createdIds = [];
const five = Array.from({ length: 5 }, (_, i) => i);

try {
  console.log(`\nTesting book gallery against ${BASE}\n`);

  console.log("TEST A — creating a book with 5 previews");
  let bookId = null;
  {
    const { status, body } = await save({ images: five });
    check("create succeeds", status === 200, `HTTP ${status} ${body.error ?? ""}`);
    bookId = body.id;
    if (bookId) createdIds.push(bookId);
    const rows = bookId ? await imagesOf(bookId) : [];
    check("5 BookImage rows created", rows.length === 5, `rows=${rows.length}`);
    check("sortOrder is 0..4", rows.map((r) => r.sortOrder).join(",") === "0,1,2,3,4", rows.map((r) => r.sortOrder).join(","));
    check(
      "images stored as storage refs, not URLs",
      rows.every((r) => r.imageUrl.startsWith("supabase://") || r.imageUrl.startsWith("local://")),
      rows[0]?.imageUrl?.slice(0, 24)
    );
  }

  console.log("\nTEST B — the 5–7 rule is enforced server-side");
  {
    const tooFew = await save({ images: [0, 1, 2, 3] });
    check("4 previews rejected", tooFew.status === 400, `HTTP ${tooFew.status} — ${tooFew.body.error ?? ""}`);

    const tooMany = await save({ images: Array.from({ length: 8 }, (_, i) => i) });
    check("8 previews rejected", tooMany.status === 400, `HTTP ${tooMany.status} — ${tooMany.body.error ?? ""}`);

    const none = await save({ images: [] });
    check("new book with 0 previews rejected", none.status === 400, `HTTP ${none.status} — ${none.body.error ?? ""}`);
  }

  console.log("\nTEST C — reorder + delete + add commit atomically");
  {
    const before = await imagesOf(bookId);
    const removed = before[0];
    // Keep 4 (reversed), drop the first, add 1 new: still 5 images.
    const keep = before.slice(1).map((r) => r.id).reverse();
    const { status, body } = await save({ bookId, keep, images: [0], withPdf: false });
    check("edit succeeds", status === 200, `HTTP ${status} ${body.error ?? ""}`);

    const after = await imagesOf(bookId);
    check("still 5 images", after.length === 5, `rows=${after.length}`);
    check("removed image is gone", !after.some((r) => r.id === removed.id), "deleted");
    check(
      "kept images reordered as requested",
      after.slice(0, 4).map((r) => r.id).join(",") === keep.join(","),
      "order matches plan"
    );
    check("new image appended last", after[4].id !== undefined && !before.some((b) => b.id === after[4].id), "appended");

    // The dropped object must be gone from storage, not just from the table.
    const [, bucket, ...rest] = removed.imageUrl.split("/").filter(Boolean);
    const objectKey = rest.join("/");
    const { data: listed } = await admin.storage.from(bucket).list(objectKey.split("/").slice(0, -1).join("/"));
    const stillThere = (listed ?? []).some((entry) => entry.name === objectKey.split("/").pop());
    check("removed image deleted from storage", !stillThere, stillThere ? "object still present" : "object removed");
  }

  console.log("\nTEST D — a plan cannot adopt another book's image");
  {
    const other = await save({ images: five, title: "E2E Gallery Other" });
    if (other.body.id) createdIds.push(other.body.id);
    const otherRows = await imagesOf(other.body.id);
    const mine = await imagesOf(bookId);

    const form = new FormData();
    form.append("title", "E2E Gallery Book");
    form.append("category", "Storybook");
    form.append("accessType", "FREE");
    form.append("price", "");
    form.append("currency", "BHD");
    form.append("bookId", bookId);
    form.append(
      "gallery",
      JSON.stringify([...mine.slice(0, 4).map((r) => ({ kind: "existing", id: r.id })), { kind: "existing", id: otherRows[0].id }])
    );
    const res = await fetch(`${BASE}/api/admin/books/upload`, { method: "POST", headers: { cookie }, body: form });
    check("cross-book image id rejected", res.status === 400, `HTTP ${res.status}`);
    check("victim book keeps its 5 images", (await imagesOf(other.body.id)).length === 5, "untouched");
  }

  console.log("\nTEST E — public details page leaks nothing");
  {
    const res = await fetch(`${BASE}/books/${bookId}`);
    const html = await res.text();
    check("details page renders", res.status === 200, `HTTP ${res.status}`);
    check("no supabase:// reference in HTML", !html.includes("supabase://"), "clean");
    check("no local:// reference in HTML", !html.includes("local://"), "clean");
    check("no .pdf object key in HTML", !html.includes(".pdf"), "clean");
    check("gallery images rendered as signed URLs", html.includes("/storage/v1/object/sign/"), "signed");
    check("read/download actions available for a free book", html.includes(`/api/books/${bookId}/access`), "present");
  }

  console.log("\nTEST F — book delete cascades to BookImage");
  {
    const target = createdIds.pop();
    const res = await fetch(`${BASE}/api/admin/books/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({ id: target }),
    });
    check("delete succeeds", res.status === 200, `HTTP ${res.status}`);
    check("BookImage rows removed", (await imagesOf(target)).length === 0, "cascaded");
  }
} finally {
  for (const id of createdIds) {
    await fetch(`${BASE}/api/admin/books/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }
  await pool.query(`delete from "Customer" where email=$1`, [EMAIL]).catch(() => {});
  await admin.auth.admin.deleteUser(created.user.id).catch(() => {});
  await pool.end();

  console.log(`\n${pass} passed, ${fail} failed\n`);
  process.exit(fail === 0 ? 0 : 1);
}
