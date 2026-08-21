import { StorageTarget, deletePublicFile, uploadPublicFile } from "@/lib/storage";

export const MEDIA_STORAGE: StorageTarget = {
  bucket: "media",
  localDir: "tools",
  localBaseUrl: "/tools",
};

/** Directory within the media bucket for startup tool thumbnails. */
export const TOOL_THUMBNAIL_DIR = "tools";

export const IMAGE_EXTENSIONS = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export async function uploadMediaImage(
  filename: string,
  fileBuffer: Buffer,
  contentType: string,
  directory = TOOL_THUMBNAIL_DIR
) {
  return uploadPublicFile(MEDIA_STORAGE, filename, fileBuffer, contentType, directory);
}

export async function deleteMediaImage(filePath: string) {
  return deletePublicFile(MEDIA_STORAGE, filePath);
}
