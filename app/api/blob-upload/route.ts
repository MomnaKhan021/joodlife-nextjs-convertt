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

  let blobUrl: string;
  let blobSize: number;
  let blobMime: string;
  try {
    const { put } = (await import("@vercel/blob")) as typeof import("@vercel/blob");
    const result = await put(path, file as Blob, {
      access: "public",
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    blobUrl = result.url;
    blobSize = (file as File).size;
    blobMime = (file as File).type;
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

  // Caller can opt out of Media-row creation by passing ?no-record=1.
  // Default is to also create the Media row so the upload immediately
  // shows up in /admin/collections/media and Product image pickers.
  const skipRecord = req.nextUrl.searchParams.get("no-record") === "1";
  if (skipRecord) {
    return NextResponse.json({
      ok: true,
      url: blobUrl,
      filename: safeName,
      size: blobSize,
      contentType: blobMime,
    });
  }

  // Optional alt text from the form, defaulting to the filename.
  const alt = (form.get("alt") as string | null)?.toString().trim() || safeName;
  const caption = (form.get("caption") as string | null)?.toString().trim() ?? "";

  // Direct SQL INSERT into the media table. Payload's Local API .create()
  // routes through the upload pipeline (multipart parse + disk write) and
  // fails on Vercel's read-only filesystem, so we sidestep it by writing
  // the row directly. The schema columns we touch all exist via
  // /api/diag?action=migrate.
  let mediaId: number | null = null;
  try {
    const drizzle = (
      payload.db as unknown as {
        drizzle?: { execute?: (q: unknown) => Promise<unknown> };
      }
    ).drizzle;
    if (!drizzle?.execute) {
      throw new Error("payload.db.drizzle.execute unavailable");
    }
    const { sql: drizzleSql } = (await import("drizzle-orm")) as {
      sql: { raw: (s: string) => unknown };
    };
    const esc = (s: string) => "'" + s.replace(/'/g, "''") + "'";
    const stmt = `
      INSERT INTO "media"
        (alt, caption, url, filename, mime_type, filesize, updated_at, created_at)
      VALUES
        (${esc(alt)}, ${caption ? esc(caption) : "NULL"}, ${esc(blobUrl)},
         ${esc(safeName)}, ${esc(blobMime || "application/octet-stream")},
         ${blobSize || 0}, now(), now())
      RETURNING id;
    `;
    const result = (await drizzle.execute(drizzleSql.raw(stmt))) as
      | { rows?: Array<{ id: number }> }
      | Array<{ id: number }>;
    const rows = Array.isArray(result) ? result : (result.rows ?? []);
    mediaId = rows[0]?.id ?? null;
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "Media row insert failed",
        url: blobUrl,
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    url: blobUrl,
    filename: safeName,
    size: blobSize,
    contentType: blobMime,
    mediaId,
  });
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
