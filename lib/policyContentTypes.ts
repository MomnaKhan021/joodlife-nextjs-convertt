import type { PolicyBlock, PolicySection } from "@/app/(site)/policies/PolicyPage";
import {
  POLICY_CONTACT_DEFAULT,
  POLICY_DEFAULTS,
  POLICY_EYEBROW_DEFAULT,
  type PolicyContact,
  type PolicyContactLink,
  type PolicySlug,
} from "@/lib/policyDefaults";

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
  eyebrow: string;
  contact: PolicyContact;
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

/** Drop link rows that lost their label or href. */
function toLinks(value: unknown): PolicyContactLink[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((l): l is PolicyContactLink => Boolean(l) && typeof l === "object")
    .map((l) => ({ label: String(l.label ?? ""), href: String(l.href ?? "") }))
    .filter((l) => l.label.trim() && l.href.trim());
}

/**
 * The help card falls back field by field, so clearing one line doesn't
 * take the whole card down with it. An empty link list falls back too —
 * removing every way to contact the pharmacy is never the intent.
 */
function toContact(value: unknown): PolicyContact {
  const c = (value && typeof value === "object" ? value : {}) as Partial<PolicyContact>;
  const links = toLinks(c.links);
  return {
    heading: str(c.heading, POLICY_CONTACT_DEFAULT.heading),
    body: str(c.body, POLICY_CONTACT_DEFAULT.body),
    links: links.length ? links : POLICY_CONTACT_DEFAULT.links,
    // The button is the one part that may legitimately be emptied, so an
    // empty label is honoured rather than replaced — the page hides it.
    ctaLabel: typeof c.ctaLabel === "string" ? c.ctaLabel : POLICY_CONTACT_DEFAULT.ctaLabel,
    ctaHref: str(c.ctaHref, POLICY_CONTACT_DEFAULT.ctaHref),
  };
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
    eyebrow: str(d.eyebrow, POLICY_EYEBROW_DEFAULT),
    contact: toContact(d.contact),
  };
}
