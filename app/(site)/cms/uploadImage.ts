import { CMS_IMAGE_MAX_BYTES } from "@/lib/cmsImageUpload";

/**
 * Upload one image for the CMS straight from the browser to Vercel Blob.
 *
 * Sending the file through our own API route hit Vercel's 4.5 MB request
 * limit (HTTP 413) for ordinary phone and design exports; the direct upload
 * only asks /api/blob-upload-token to sign it.
 */
export async function uploadCmsImage(file: File) {
  if (file.size > CMS_IMAGE_MAX_BYTES) {
    throw new Error(
      `${file.name} is ${Math.round(file.size / 1024 / 1024)} MB — images can be up to ${CMS_IMAGE_MAX_BYTES / 1024 / 1024} MB.`,
    );
  }
  const { upload } = await import("@vercel/blob/client");
  const safeName =
    file.name
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100) || "image";
  const blob = await upload(`media/${safeName}`, file, {
    access: "public",
    handleUploadUrl: "/api/blob-upload-token?image=1",
    contentType: file.type || undefined,
  });
  return { url: blob.url, filename: safeName, contentType: file.type, size: file.size };
}
