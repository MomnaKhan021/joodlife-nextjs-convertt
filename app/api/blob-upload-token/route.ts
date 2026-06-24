/**
 * Admin-only token endpoint for Vercel Blob CLIENT-direct uploads.
 *
 * Why this exists: the previous /api/blob-upload route streamed the whole
 * file through our serverless function — but Vercel's default request body
 * limit (~4.5 MB) silently rejected larger product photos before our code
 * ever ran. Switching to client-direct upload (file goes browser → Blob
 * directly) removes that ceiling entirely. The server's only job is to
 * sign the client token after verifying the caller is an admin.
 *
 * See https://vercel.com/docs/storage/vercel-blob/client-upload
 */
import { NextResponse, type NextRequest } from "next/server";
import { headers as nextHeaders } from "next/headers";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

import { getPayloadInstance } from "@/lib/payload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "BLOB_READ_WRITE_TOKEN missing. Connect Vercel Blob in Settings → Storage and redeploy.",
      },
      { status: 503 },
    );
  }

  const body = (await req.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request: req,
      // Guard the token: only signed-in admins can request upload URLs.
      onBeforeGenerateToken: async () => {
        const payload = await getPayloadInstance();
        const { user } = await payload.auth({ headers: await nextHeaders() });
        if (!user || (user as unknown as { role?: string }).role !== "admin") {
          throw new Error("Admin role required");
        }
        return {
          allowedContentTypes: [
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/webp",
            "image/gif",
            "image/avif",
          ],
          // Random-prefix the path so two uploads with the same filename
          // don't collide. handleUpload returns the final URL to the client.
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ uploadedBy: (user as { email?: string }).email ?? null }),
        };
      },
      onUploadCompleted: async () => {
        // Optional hook for post-upload server work. We skip the Media-row
        // insert here — the product editor stores the URL directly on the
        // product, which is enough for the storefront.
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 400 },
    );
  }
}
