/**
 * Token endpoint for Vercel Blob CLIENT-direct uploads.
 *
 * Why this exists: the previous /api/blob-upload route streamed the whole
 * file through our serverless function — but Vercel's default request body
 * limit (~4.5 MB) silently rejected larger uploads (product photos, and
 * phone photos of prescriptions in the consultation) before our code ever
 * ran. Switching to client-direct upload (file goes browser → Blob
 * directly) removes that ceiling entirely. The server's only job is to
 * sign the client token.
 *
 * Two modes:
 *   default        — admin-gated. Media library / product images.
 *   ?public=1      — anonymous, for the consultation prescription upload.
 *                    Locked down to images/PDF up to 15 MB (patients aren't
 *                    logged in, so we can't require an admin cookie here).
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

  // The consultation prescription upload runs unauthenticated (patients
  // aren't logged in). That path passes ?public=1 and is locked to
  // images/PDF up to 15 MB. Everything else stays admin-gated.
  const isPublic = req.nextUrl.searchParams.get("public") === "1";

  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        if (isPublic) {
          return {
            allowedContentTypes: [
              "image/png",
              "image/jpeg",
              "image/jpg",
              "image/webp",
              "image/gif",
              "image/avif",
              "image/heic",
              "image/heif",
              "application/pdf",
            ],
            maximumSizeInBytes: 15 * 1024 * 1024,
            addRandomSuffix: true,
            tokenPayload: JSON.stringify({ source: "consultation" }),
          };
        }

        // Guard the token: only signed-in admins can request upload URLs.
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
