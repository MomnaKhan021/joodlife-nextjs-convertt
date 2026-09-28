import "server-only";

import { cache } from "react";

import {
  mergeWeightLoss,
  type WeightLossContent,
} from "@/lib/weightLossContentTypes";
import { getPayloadInstance } from "@/lib/payload";

/**
 * Server-side reader for the weight loss page.
 *
 * Falls back to the shipped copy on any failure, so a missing table or an
 * unreachable database renders /weight-loss unchanged. Cached per request, so
 * the page and its sections share one read.
 */

export * from "@/lib/weightLossContentTypes";

export const getWeightLossContent = cache(
  async (): Promise<WeightLossContent> => {
    try {
      const payload = await getPayloadInstance();
      const doc = (await payload.findGlobal({
        slug: "weight-loss-page",
        depth: 0,
        overrideAccess: true,
      })) as Record<string, unknown>;
      return mergeWeightLoss(doc);
    } catch (err) {
      console.error("[weightLossContent] falling back to shipped copy:", err);
      return mergeWeightLoss(null);
    }
  },
);
