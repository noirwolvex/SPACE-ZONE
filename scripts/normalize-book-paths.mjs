/**
 * One-off data migration: rewrite Book.path / Book.coverImage from raw public URLs
 * (or public/ local paths) into storage-agnostic references.
 *
 *   https://<proj>.supabase.co/storage/v1/object/public/book2/<key>  ->  supabase://book2/<key>
 *   /books/<file>.pdf                                                ->  local://<file>.pdf
 *
 * Reference format is resolved at read time by lib/storage.ts, so no URL is ever
 * stored in — or served from — the database again.
 *
 * Usage:  node scripts/normalize-book-paths.mjs [--apply]
 * Without --apply it performs a dry run and changes nothing.
 */
import "dotenv/config";
import { Pool } from "pg";

const APPLY = process.argv.includes("--apply");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
const PUBLIC_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/`;
const SIGN_PREFIX = `${SUPABASE_URL}/storage/v1/object/sign/`;
const LOCAL_BOOKS_PREFIX = "/books/";

/** Convert one stored value into a storage reference, or null when already normalized. */
function normalize(value) {
  if (!value) return null;
  if (value.startsWith("supabase://") || value.startsWith("local://")) return null;

  for (const prefix of [PUBLIC_PREFIX, SIGN_PREFIX]) {
    if (SUPABASE_URL && value.startsWith(prefix)) {
      // strip any signing query string, then split "<bucket>/<objectKey>"
      const rest = value.slice(prefix.length).split("?")[0];
      const slash = rest.indexOf("/");
      if (slash <= 0) return null;
      const bucket = rest.slice(0, slash);
      const key = decodeURIComponent(rest.slice(slash + 1));
      return `supabase://${bucket}/${key}`;
    }
  }

  if (value.startsWith(LOCAL_BOOKS_PREFIX)) {
    return `local://${value.slice(LOCAL_BOOKS_PREFIX.length)}`;
  }

  return null;
}

const { rows } = await pool.query(
  'select id, title, path, "coverImage" from "Book" order by "uploadedAt" desc'
);

let changed = 0;
for (const book of rows) {
  const nextPath = normalize(book.path);
  const nextCover = normalize(book.coverImage);
  if (!nextPath && !nextCover) {
    console.log(`= ${book.title ?? book.id}: already normalized`);
    continue;
  }

  changed += 1;
  console.log(`~ ${book.title ?? book.id}`);
  if (nextPath) console.log(`    path : ${book.path}\n        -> ${nextPath}`);
  if (nextCover) console.log(`    cover: ${book.coverImage}\n        -> ${nextCover}`);

  if (APPLY) {
    await pool.query('update "Book" set path = $1, "coverImage" = $2 where id = $3', [
      nextPath ?? book.path,
      nextCover ?? book.coverImage,
      book.id,
    ]);
  }
}

console.log(
  APPLY
    ? `\nApplied. ${changed} book(s) updated, ${rows.length - changed} already normalized.`
    : `\nDRY RUN. ${changed} book(s) would change. Re-run with --apply to write.`
);

await pool.end();
