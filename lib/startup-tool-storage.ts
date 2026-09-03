import fs from "fs/promises";
import { createReadStream } from "fs";
import { createSignedUrl, deleteFile, parseStorageRef, resolveLocalPath, uploadFile, type StorageTarget, type StorageMode } from "@/lib/storage";

export const STARTUP_TOOLS_STORAGE: StorageTarget = {
  bucket: "tool2",
  localDir: "startup-tools",
};

export const TOOL_FILE_URL_TTL_SECONDS = 60;

export async function uploadStartupToolFile(filename: string, buffer: Buffer, contentType: string) {
  return uploadFile(STARTUP_TOOLS_STORAGE, filename, buffer, contentType, "files");
}

export async function createStartupToolFileSignedUrl(fileRef: string, download?: string | boolean) {
  return createSignedUrl(fileRef, TOOL_FILE_URL_TTL_SECONDS, download);
}

export async function deleteStartupToolFile(fileRef: string) {
  return deleteFile(STARTUP_TOOLS_STORAGE, fileRef);
}

export async function openLocalStartupToolFile(fileRef: string) {
  const ref = parseStorageRef(fileRef);
  if (!ref || ref.kind !== "local") return null;
  const absolutePath = resolveLocalPath(STARTUP_TOOLS_STORAGE, ref.relativePath);
  if (!absolutePath) return null;
  try {
    const stat = await fs.stat(absolutePath);
    if (!stat.isFile()) return null;
    return { size: stat.size, stream: () => createReadStream(absolutePath) };
  } catch {
    return null;
  }
}

export type { StorageMode };
