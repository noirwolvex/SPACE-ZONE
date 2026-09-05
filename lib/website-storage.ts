import { StorageTarget, deletePublicFile, uploadPublicFile, parseStorageObjectPath } from "@/lib/storage";
import { supabaseAdmin } from "@/lib/supabase";

export const WEBSITES_STORAGE: StorageTarget = {
  bucket: "website",
  localDir: "websites",
  localBaseUrl: "/websites",
};

export const PUBLIC_WEBSITES_BASE_URL = WEBSITES_STORAGE.localBaseUrl;
export type { StorageMode } from "@/lib/storage";

export async function uploadWebsiteFile(
  filename: string,
  fileBuffer: Buffer,
  contentType = "image/jpeg",
  directory = ""
) {
  return uploadPublicFile(WEBSITES_STORAGE, filename, fileBuffer, contentType, directory);
}

async function getWebsiteMediaUrl(filePath: string | null | undefined) {
  if (!filePath) return null;

  const objectPath = parseStorageObjectPath(WEBSITES_STORAGE, filePath);
  if (!objectPath) return filePath;

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(WEBSITES_STORAGE.bucket)
      .createSignedUrl(objectPath, 60 * 60);

    if (!error && data?.signedUrl) return data.signedUrl;
  } catch (error) {
    console.warn("Failed to create signed URL for website media:", error);
  }

  return filePath;
}

export async function getWebsiteImageUrl(imagePath: string | null | undefined) {
  return getWebsiteMediaUrl(imagePath);
}

export async function getWebsiteVideoUrl(videoPath: string | null | undefined) {
  return getWebsiteMediaUrl(videoPath);
}

export async function deleteWebsiteFile(filePath: string) {
  return deletePublicFile(WEBSITES_STORAGE, filePath);
}
