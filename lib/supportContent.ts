import "server-only";

import { getPayloadInstance } from "@/lib/payload";
import { mergeSupport, type SupportContent } from "@/lib/supportContentTypes";

/**
 * Server-side reader for the Support page.
 *
 * Falls back to the shipped copy on any failure, so a missing table or an
 * unreachable database renders /support unchanged rather than blank.
 */

export * from "@/lib/supportContentTypes";

export async function getSupportContent(): Promise<SupportContent> {
  try {
    const payload = await getPayloadInstance();
    const doc = (await payload.findGlobal({
      slug: "support",
      depth: 0,
      overrideAccess: true,
    })) as Record<string, unknown>;
    return mergeSupport(doc);
  } catch (err) {
    console.error("[supportContent] falling back to shipped copy:", err);
    // Same merge with nothing stored, so the shipped copy comes back whole.
    return mergeSupport(null);
  }
}
