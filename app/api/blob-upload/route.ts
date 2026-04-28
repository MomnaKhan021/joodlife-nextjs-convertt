/**
 * Admin-only file upload endpoint.
 *
 * Replaces the @payloadcms/storage-vercel-blob plugin (which broke our
 * admin-side hydration twice). Admins call this from the
 * /admin/collections/media/create form by clicking "Paste URL", but
 * we also expose the raw POST so external tools / browser DevTools
 * can use it.
 *
 * POST /api/blob-upload
 *   Multipart body with a `file` part.
 *   Auth: requires the caller to be a Payload admin (cookie-based).
 *
 *   Returns: { ok: true, url, filename, size, contentType }
 *
 * Once you have the URL:
 *   /admin/collections/media/create → "Paste URL" → paste the URL.
 *   The Media record is created with that URL and shows up everywhere
 *   uploads are referenced (Products → Product images, etc.).
 */
import { NextResponse, type NextRequest } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "BLOB_READ_WRITE_TOKEN missing in env. Connect Vercel Blob in your project Storage tab and redeploy.",
      },
      { status: 503 }
    );
  }

  // Auth: require an admin caller. We use Payload's cookie-based auth
  // so this only works for someone already logged into /admin.
  let payload: Awaited<ReturnType<typeof getPayloadInstance>>;
  try {
    payload = await getPayloadInstance();
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Payload init failed", detail: String(err) },
      { status: 500 }
    );
  }

  const { user } = await payload.auth({ headers: await nextHeaders() });
  if (!user || (user as unknown as { role?: string }).role !== "admin") {
    return NextResponse.json(
      { ok: false, error: "Admin role required" },
      { status: 403 }
    );
  }

  // Multipart parse
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Expected multipart/form-data with a `file` field" },
      { status: 400 }
    );
  }

  const file = form.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json(
      { ok: false, error: "Missing `file` part" },
      { status: 400 }
    );
  }

  const rawName = (file as File).name || "upload";
  const safeName = rawName
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);

  // Random prefix to avoid collisions between uploads with the same
  // filename (Vercel Blob requires globally-unique paths).
  const prefix = Math.random().toString(36).slice(2, 10);
  const path = `media/${prefix}/${safeName}`;

  try {
    const { put } = (await import("@vercel/blob")) as typeof import("@vercel/blob");
    const result = await put(path, file as Blob, {
      access: "public",
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return NextResponse.json({
      ok: true,
      url: result.url,
      filename: safeName,
      size: (file as File).size,
      contentType: (file as File).type,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "Blob put failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/blob-upload",
    method: "POST",
    contentType: "multipart/form-data",
    field: "file",
    auth: "Payload admin cookie required",
    blobToken: process.env.BLOB_READ_WRITE_TOKEN ? "present" : "missing",
  });
}
