import "server-only";

import { mergeEd, type EdContent } from "@/lib/edContentTypes";
import { getPayloadInstance } from "@/lib/payload";

/**
 * Server-side reader for the erectile dysfunction page.
 *
 * Falls back to the shipped copy on any failure, so a missing table or an
 * unreachable database renders /erectile-dysfunction unchanged.
 */

export * from "@/lib/edContentTypes";

export async function getEdContent(): Promise<EdContent> {
  try {
    const payload = await getPayloadInstance();
    const doc = (await payload.findGlobal({
      slug: "ed-page",
      depth: 0,
      overrideAccess: true,
    })) as Record<string, unknown>;
    return mergeEd(doc);
  } catch {
    // Same merge with nothing stored, so the shipped copy comes back whole.
    return mergeEd(null);
  }
}
