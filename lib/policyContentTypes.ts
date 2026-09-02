import type { PolicyBlock, PolicySection } from "@/app/(site)/policies/PolicyPage";
import { POLICY_DEFAULTS, type PolicySlug } from "@/lib/policyDefaults";

/**
 * Shape and validation for an editable policy page.
 *
 * Client-safe (no `server-only`, no Payload import) so the /cms editors can
 * import it. `lib/policyContent.ts` is the server-side reader.
 */

export type PolicyDoc = {
  title: string;
  titleAccent: string;
  intro: string;
  updated: string;
  sections: PolicySection[];
};

/** Which json field on the global holds which page. */
export const POLICY_FIELD: Record<PolicySlug, string> = {
  terms: "terms",
  "refund-complaints": "refundComplaints",
  privacy: "privacy",
};

export const POLICY_LABEL: Record<PolicySlug, string> = {
  terms: "Terms & conditions",
  "refund-complaints": "Refund & Complaints",
  privacy: "Privacy & Cookies",
};

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() ? v : fallback;
}

/** Accept only well-formed blocks; drop anything unrecognised. */
function toBlocks(value: unknown): PolicyBlock[] {
  if (!Array.isArray(value)) return [];
  const out: PolicyBlock[] = [];
  for (const b of value) {
    if (!b || typeof b !== "object") continue;
    const t = (b as PolicyBlock).type;
    if (t === "p" || t === "h") {
      const text = (b as { text?: unknown }).text;
      if (typeof text === "string" && text.trim()) out.push({ type: t, text });
    } else if (t === "list") {
      const items = (b as { items?: unknown }).items;
      if (Array.isArray(items)) {
        const clean = items.filter(
          (i): i is string => typeof i === "string" && i.trim() !== "",
        );
        if (clean.length) out.push({ type: "list", items: clean });
      }
    }
  }
  return out;
}

function toSections(value: unknown): PolicySection[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (s): s is PolicySection =>
        Boolean(s) &&
        typeof s === "object" &&
        typeof (s as PolicySection).heading === "string",
    )
    .map((s) => ({ heading: s.heading, blocks: toBlocks(s.blocks) }))
    .filter((s) => s.heading.trim() || s.blocks.length);
}

/**
 * Merge a stored value over the shipped defaults.
 *
 * Each field falls back individually, so a partially-filled policy still
 * renders the rest of the document rather than blanking it — which matters
 * more here than anywhere else on the site.
 */
export function mergePolicy(slug: PolicySlug, stored: unknown): PolicyDoc {
  const base = POLICY_DEFAULTS[slug];
  const d = (stored && typeof stored === "object" ? stored : {}) as Partial<PolicyDoc>;
  const sections = toSections(d.sections);
  return {
    title: str(d.title, base.title),
    titleAccent: str(d.titleAccent, base.titleAccent),
    intro: str(d.intro, base.intro),
    updated: str(d.updated, base.updated),
    sections: sections.length ? sections : base.sections,
  };
}
