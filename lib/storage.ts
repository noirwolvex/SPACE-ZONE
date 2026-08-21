import fs from "fs/promises";
import path from "path";
import { supabaseAdmin } from "@/lib/supabase";

export type StorageMode = "supabase" | "local";

export type StorageTarget = {
  /** Supabase Storage bucket to upload into. Must be a PRIVATE bucket for protected assets. */
  bucket: string;
  /**
   * Directory under `private-storage/` (protected assets) or `public/` (legacy
   * public assets) used when Supabase is unavailable.
   */
  localDir: string;
  /**
   * URL prefix that serves `localDir` from `public/`.
   * Only set for public assets (tool/website images). Protected assets such as
   * book PDFs MUST leave this undefined so they are never statically served.
   */
  localBaseUrl?: string;
};

/**
 * Storage references are provider-agnostic strings persisted in the database.
 * A raw URL is never stored, so a database row can never leak a directly
 * fetchable asset location.
 *
 *   supabase://<bucket>/<objectKey>
 *   local://<relativePath>
 */
export type StorageRef =
  | { kind: "supabase"; bucket: string; objectKey: string }
  | { kind: "local"; relativePath: string };

const LOCAL_ROOT = path.join(process.cwd(), "private-storage");

export function buildSupabaseRef(bucket: string, objectKey: string) {
  return `supabase://${bucket}/${objectKey}`;
}

export function buildLocalRef(relativePath: string) {
  return `local://${relativePath.replace(/\\/g, "/")}`;
}

/** Parse a stored reference. Returns null for anything unrecognized. */
export function parseStorageRef(value: string | null | undefined): StorageRef | null {
  if (!value) return null;

  if (value.startsWith("supabase://")) {
    const rest = value.slice("supabase://".length);
    const slash = rest.indexOf("/");
    if (slash <= 0) return null;
    const objectKey = rest.slice(slash + 1);
    if (!objectKey) return null;
    return { kind: "supabase", bucket: rest.slice(0, slash), objectKey };
  }

  if (value.startsWith("local://")) {
    const relativePath = value.slice("local://".length);
    if (!relativePath) return null;
    return { kind: "local", relativePath };
  }

  return null;
}

/**
 * Resolve a local reference to an absolute path, guarding against traversal
 * outside the private storage root.
 */
export function resolveLocalPath(target: StorageTarget, relativePath: string) {
  const baseDir = path.join(LOCAL_ROOT, target.localDir);
  const resolved = path.resolve(baseDir, relativePath);
  const normalizedBase = path.resolve(baseDir);

  if (resolved !== normalizedBase && !resolved.startsWith(normalizedBase + path.sep)) {
    return null;
  }

  return resolved;
}

/**
 * Upload a file and return a storage reference.
 *
 * Falls back to the private local directory when Supabase rejects the upload
 * (e.g. the object exceeds the project's storage size limit). The fallback is
 * still private: nothing under `private-storage/` is statically served.
 */
export async function uploadFile(
  target: StorageTarget,
  filename: string,
  fileBuffer: Buffer,
  contentType: string,
  directory = ""
): Promise<{ ref: string; storageMode: StorageMode }> {
  const objectKey = directory ? `${directory}/${filename}` : filename;

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(target.bucket)
      .upload(objectKey, fileBuffer, { contentType, upsert: false });

    if (!error && data) {
      return { ref: buildSupabaseRef(target.bucket, objectKey), storageMode: "supabase" };
    }

    if (error) {
      console.warn(`Supabase Storage upload to "${target.bucket}" failed, storing privately on disk:`, error.message);
    }
  } catch (error) {
    console.warn(`Supabase Storage upload to "${target.bucket}" threw, storing privately on disk:`, error);
  }

  const baseDir = path.join(LOCAL_ROOT, target.localDir);
  const destinationDir = directory ? path.join(baseDir, directory) : baseDir;
  await fs.mkdir(destinationDir, { recursive: true });
  await fs.writeFile(path.join(destinationDir, filename), fileBuffer);

  return { ref: buildLocalRef(objectKey), storageMode: "local" };
}

export async function deleteFile(target: StorageTarget, storedRef: string) {
  const ref = parseStorageRef(storedRef);
  if (!ref) return;

  if (ref.kind === "supabase") {
    await supabaseAdmin.storage.from(ref.bucket).remove([ref.objectKey]);
    return;
  }

  const absolutePath = resolveLocalPath(target, ref.relativePath);
  if (absolutePath) {
    await fs.unlink(absolutePath).catch(() => undefined);
  }
}

/**
 * Create a short-lived signed URL for a Supabase-hosted object.
 * Returns null for locally stored objects, which must be streamed by the caller.
 */
export async function createSignedUrl(storedRef: string, expiresInSeconds: number, download?: string | boolean) {
  const ref = parseStorageRef(storedRef);
  if (!ref || ref.kind !== "supabase") return null;

  const { data, error } = await supabaseAdmin.storage
    .from(ref.bucket)
    .createSignedUrl(ref.objectKey, expiresInSeconds, download ? { download } : undefined);

  if (error || !data?.signedUrl) {
    console.error("Failed to create signed URL:", error);
    return null;
  }

  return data.signedUrl;
}

/* ------------------------------------------------------------------------- */
/* Legacy public-asset helpers                                               */
/*                                                                            */
/* Used by tool/website images, which are intentionally public and whose      */
/* existing rows store absolute URLs. Do NOT use these for protected assets.  */
/* ------------------------------------------------------------------------- */

function publicUrl(bucket: string, objectPath: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL for Supabase public URL generation.");
  }

  const encodedPath = objectPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${bucket}/${encodedPath}`;
}

/** Legacy upload that returns a URL/public path instead of a storage reference. */
export async function uploadPublicFile(
  target: StorageTarget,
  filename: string,
  fileBuffer: Buffer,
  contentType: string,
  directory = ""
): Promise<{ path: string; storageMode: StorageMode }> {
  const objectPath = directory ? `${directory}/${filename}` : filename;

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(target.bucket)
      .upload(objectPath, fileBuffer, { contentType, upsert: false });

    if (!error && data) {
      return { path: publicUrl(target.bucket, objectPath), storageMode: "supabase" };
    }

    if (error) {
      console.warn(`Supabase Storage upload to "${target.bucket}" failed, falling back to local:`, error.message);
    }
  } catch (error) {
    console.warn(`Supabase Storage upload to "${target.bucket}" threw, falling back to local:`, error);
  }

  const baseDir = path.join(process.cwd(), "public", target.localDir);
  const publicDir = directory ? path.join(baseDir, directory) : baseDir;
  await fs.mkdir(publicDir, { recursive: true });
  await fs.writeFile(path.join(publicDir, filename), fileBuffer);

  return {
    path: `${target.localBaseUrl}/${directory ? `${directory}/` : ""}${filename}`,
    storageMode: "local",
  };
}

export async function deletePublicFile(target: StorageTarget, filePath: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const supabasePrefix = supabaseUrl ? `${supabaseUrl}/storage/v1/object/public/${target.bucket}/` : null;

  if (supabasePrefix && filePath.startsWith(supabasePrefix)) {
    const objectPath = decodeURIComponent(filePath.substring(supabasePrefix.length));
    await supabaseAdmin.storage.from(target.bucket).remove([objectPath]);
    return;
  }

  if (target.localBaseUrl && filePath.startsWith(`${target.localBaseUrl}/`)) {
    const relativePath = filePath.substring(target.localBaseUrl.length + 1);
    await fs.unlink(path.join(process.cwd(), "public", target.localDir, relativePath)).catch(() => undefined);
  }
}

export function parseStorageObjectPath(target: StorageTarget, filePath: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const supabasePrefix = supabaseUrl ? `${supabaseUrl}/storage/v1/object/public/${target.bucket}/` : null;

  if (supabasePrefix && filePath.startsWith(supabasePrefix)) {
    return decodeURIComponent(filePath.substring(supabasePrefix.length));
  }

  return null;
}
