import fs from "fs/promises";
import { createReadStream } from "fs";
import {
  StorageTarget,
  createSignedUrl,
  deleteFile,
  parseStorageRef,
  resolveLocalPath,
  uploadFile,
} from "@/lib/storage";
import { supabaseAdmin } from "@/lib/supabase";

/** Private bucket. Never make this bucket public — access is granted per request. */
export const BOOKS_STORAGE: StorageTarget = {
  bucket: "book2",
  localDir: "books",
};

/** Signed URLs are deliberately short-lived so a leaked link expires quickly. */
export const BOOK_FILE_URL_TTL_SECONDS = 60;
export const BOOK_COVER_URL_TTL_SECONDS = 60 * 60;

export type { StorageMode } from "@/lib/storage";

export async function uploadBookFile(
  filename: string,
  fileBuffer: Buffer,
  contentType = "application/pdf",
  directory = ""
) {
  return uploadFile(BOOKS_STORAGE, filename, fileBuffer, contentType, directory);
}

/** Directory inside the private books bucket holding gallery preview images. */
export const BOOK_PREVIEWS_DIRECTORY = "previews";

/**
 * Upload one gallery preview image. Previews live in the same private bucket as
 * covers and PDFs, so they are served through signed URLs like everything else.
 */
export async function uploadBookPreviewImage(
  filename: string,
  fileBuffer: Buffer,
  contentType: string
) {
  return uploadBookFile(filename, fileBuffer, contentType, BOOK_PREVIEWS_DIRECTORY);
}

export async function deleteBookFile(storedRef: string) {
  return deleteFile(BOOKS_STORAGE, storedRef);
}

/**
 * Signed URL for a book cover. Covers are non-sensitive but live in the private
 * bucket, so they still need signing. Returns null when unavailable.
 */
export async function getBookCoverUrl(coverRef: string | null | undefined) {
  if (!coverRef) return null;

  const ref = parseStorageRef(coverRef);
  if (!ref) return null;

  // Locally stored covers are streamed through the cover route instead.
  if (ref.kind === "local") return null;

  return createSignedUrl(coverRef, BOOK_COVER_URL_TTL_SECONDS);
}

/**
 * Sign many cover references in a single Supabase request per bucket.
 *
 * The per-book helper issues one network call each, which on a listing page
 * means one call per card on every request. This batches them, so cover signing
 * costs one round trip regardless of how many books are rendered.
 *
 * Returns a Map keyed by the original reference string.
 */
export async function getBookCoverUrls(
  coverRefs: (string | null | undefined)[]
): Promise<Map<string, string>> {
  const result = new Map<string, string>();

  // Unique, Supabase-hosted references only; local covers are not signable.
  const byBucket = new Map<string, Map<string, string>>();
  for (const coverRef of coverRefs) {
    if (!coverRef) continue;
    const ref = parseStorageRef(coverRef);
    if (!ref || ref.kind !== "supabase") continue;

    if (!byBucket.has(ref.bucket)) byBucket.set(ref.bucket, new Map());
    byBucket.get(ref.bucket)!.set(ref.objectKey, coverRef);
  }

  await Promise.all(
    Array.from(byBucket.entries()).map(async ([bucket, keys]) => {
      const objectKeys = Array.from(keys.keys());
      if (objectKeys.length === 0) return;

      try {
        const { data, error } = await supabaseAdmin.storage
          .from(bucket)
          .createSignedUrls(objectKeys, BOOK_COVER_URL_TTL_SECONDS);

        if (error || !data) {
          console.warn(`Batch cover signing failed for bucket "${bucket}":`, error?.message);
          return;
        }

        for (const entry of data) {
          if (!entry.signedUrl || entry.error) continue;
          // Supabase echoes back the requested path; map it to the original ref.
          const originalRef = keys.get(entry.path ?? "");
          if (originalRef) result.set(originalRef, entry.signedUrl);
        }
      } catch (batchError) {
        console.warn(`Batch cover signing threw for bucket "${bucket}":`, batchError);
      }
    })
  );

  return result;
}

/**
 * Gallery previews are signed exactly like covers — same private bucket, same
 * TTL, same batching. Aliased rather than reimplemented so the two can never
 * drift apart.
 */
export const getBookImageUrls = getBookCoverUrls;

/**
 * Signed URL for the book PDF itself. Callers MUST authorize access first.
 * Returns null for locally stored files, which are streamed via openLocalBookFile.
 */
export async function getBookFileSignedUrl(fileRef: string, download?: string | boolean) {
  return createSignedUrl(fileRef, BOOK_FILE_URL_TTL_SECONDS, download);
}

/**
 * Open a locally stored (private) book file for streaming.
 * Returns null when the reference is not local or the file is missing.
 */
export async function openLocalBookFile(fileRef: string) {
  const ref = parseStorageRef(fileRef);
  if (!ref || ref.kind !== "local") return null;

  const absolutePath = resolveLocalPath(BOOKS_STORAGE, ref.relativePath);
  if (!absolutePath) return null;

  try {
    const stat = await fs.stat(absolutePath);
    if (!stat.isFile()) return null;
    return { absolutePath, size: stat.size, stream: () => createReadStream(absolutePath) };
  } catch {
    return null;
  }
}
