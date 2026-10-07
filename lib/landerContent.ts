import "server-only";

import { cache } from "react";

import { getPayloadInstance } from "@/lib/payload";
import { mergeLander, type LanderContent } from "@/lib/landerContentTypes";

/**
 * Reads the weight-loss ads lander's content (one read per request). If the
 * database can't be reached the page still renders, with the shipped copy.
 */
export const getLanderContent = cache(async (): Promise<LanderContent> => {
  try {
    const payload = await getPayloadInstance();
    const doc = await payload.findGlobal({
      slug: "weight-loss-lander",
      depth: 0,
      overrideAccess: true,
    });
    return mergeLander(doc);
  } catch (err) {
    console.error("[weight-loss-lander] content read failed, falling back to shipped copy", err);
    return mergeLander(null);
  }
});
