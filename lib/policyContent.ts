import "server-only";

import { getPayloadInstance } from "@/lib/payload";
import { type PolicySlug } from "@/lib/policyDefaults";
import {
  mergePolicy,
  POLICY_FIELD,
  type PolicyDoc,
} from "@/lib/policyContentTypes";

/**
 * Server-side reader for the policy pages.
 *
 * Falls back to the shipped copy on any failure, so a missing table or an
 * unreachable database renders the legal pages unchanged rather than blank.
 */

export * from "@/lib/policyContentTypes";

export async function getPolicy(slug: PolicySlug): Promise<PolicyDoc> {
  try {
    const payload = await getPayloadInstance();
    const doc = (await payload.findGlobal({
      slug: "policies",
      depth: 0,
      overrideAccess: true,
    })) as Record<string, unknown>;
    return mergePolicy(slug, doc?.[POLICY_FIELD[slug]]);
  } catch {
    // Same merge with nothing stored, so the shipped copy comes back
    // complete — contact card and all — rather than a partial object.
    return mergePolicy(slug, null);
  }
}
