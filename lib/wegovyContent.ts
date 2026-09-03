import "server-only";

import { getPayloadInstance } from "@/lib/payload";
import { mergeWegovy, type WegovyContent } from "@/lib/wegovyContentTypes";

/**
 * Server-side reader for the Wegovy Pills page.
 *
 * Falls back to the shipped copy on any failure, so a missing table or an
 * unreachable database renders /wegovy-pills unchanged rather than blank —
 * which matters here, because the page carries the regulated efficacy and
 * safety copy for a prescription medicine.
 */

export * from "@/lib/wegovyContentTypes";

export async function getWegovyContent(): Promise<WegovyContent> {
  try {
    const payload = await getPayloadInstance();
    const doc = (await payload.findGlobal({
      slug: "wegovy-page",
      depth: 0,
      overrideAccess: true,
    })) as Record<string, unknown>;
    return mergeWegovy(doc);
  } catch {
    // Same merge with nothing stored, so the shipped copy comes back whole.
    return mergeWegovy(null);
  }
}
