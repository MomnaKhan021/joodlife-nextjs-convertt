import "server-only";

import { getPayloadInstance } from "@/lib/payload";

/**
 * Header / footer content, read from the Payload globals with a fallback
 * to the values that were hard-coded in the components.
 *
 * The fallbacks matter: they are what makes this safe to deploy. Until
 * someone fills the globals in — and if the tables are missing, or the DB
 * is unreachable — the site renders exactly as it does today. Nothing
 * about shipping this should change a single pixel of the live site.
 *
 * Keep DEFAULT_* in sync with the design if the components change; they
 * are the source of truth whenever the CMS is empty.
 */

export type SiteLink = { label: string; href: string; mega?: boolean };

export const DEFAULT_NAV_LINKS: SiteLink[] = [
  { label: "Home", href: "/" },
  { label: "Treatments", href: "/shop", mega: true },
  { label: "FAQs", href: "/#faq" },
  { label: "Reviews", href: "/#reviews" },
  { label: "Support", href: "/support" },
];

export const DEFAULT_JOOD_LINKS: SiteLink[] = [
  { label: "Log in", href: "/login" },
  { label: "Treatments", href: "/shop" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Library", href: "/blogs" },
  { label: "Support", href: "/support" },
];

export const DEFAULT_TREATMENT_LINKS: SiteLink[] = [
  { label: "Mounjaro", href: "/weight-loss" },
  { label: "Wegovy", href: "/weight-loss" },
  { label: "Wegovy Pills", href: "/wegovy-pills" },
];

export const DEFAULT_POLICY_LINKS: SiteLink[] = [
  { label: "Terms & conditions", href: "/policies/terms" },
  { label: "Refund & Complaints Procedure", href: "/policies/refund-complaints" },
  { label: "Privacy & Cookies", href: "/policies/privacy" },
];

export const DEFAULT_FOOTER_TEXT = {
  contactHeading: "Have a question?",
  phone: "07756 099075",
  email: "support@joodlife.com",
  newsletterHeading: "Sign Up For Our Newsletter",
  newsletterSubtext: "Stay up to date on our news, education and offers",
  legalText: "",
};

export type HeaderContent = { navLinks: SiteLink[] };
export type FooterContent = {
  joodLinks: SiteLink[];
  treatmentLinks: SiteLink[];
  policyLinks: SiteLink[];
} & typeof DEFAULT_FOOTER_TEXT;

/** Accept only well-formed link rows; anything else falls back. */
function toLinks(value: unknown, fallback: SiteLink[]): SiteLink[] {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .filter(
      (v): v is SiteLink =>
        Boolean(v) &&
        typeof v === "object" &&
        typeof (v as SiteLink).label === "string" &&
        typeof (v as SiteLink).href === "string",
    )
    .map((v) => ({
      label: v.label,
      href: v.href,
      ...(v.mega ? { mega: true } : {}),
    }));
  return cleaned.length ? cleaned : fallback;
}

function str(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

export async function getHeaderContent(): Promise<HeaderContent> {
  try {
    const payload = await getPayloadInstance();
    const doc = (await payload.findGlobal({
      slug: "header",
      depth: 0,
      overrideAccess: true,
    })) as { navLinks?: unknown };
    return { navLinks: toLinks(doc?.navLinks, DEFAULT_NAV_LINKS) };
  } catch {
    return { navLinks: DEFAULT_NAV_LINKS };
  }
}

export async function getFooterContent(): Promise<FooterContent> {
  const fallback: FooterContent = {
    joodLinks: DEFAULT_JOOD_LINKS,
    treatmentLinks: DEFAULT_TREATMENT_LINKS,
    policyLinks: DEFAULT_POLICY_LINKS,
    ...DEFAULT_FOOTER_TEXT,
  };
  try {
    const payload = await getPayloadInstance();
    const doc = (await payload.findGlobal({
      slug: "footer",
      depth: 0,
      overrideAccess: true,
    })) as Record<string, unknown>;
    return {
      joodLinks: toLinks(doc?.joodLinks, DEFAULT_JOOD_LINKS),
      treatmentLinks: toLinks(doc?.treatmentLinks, DEFAULT_TREATMENT_LINKS),
      policyLinks: toLinks(doc?.policyLinks, DEFAULT_POLICY_LINKS),
      contactHeading: str(doc?.contactHeading, DEFAULT_FOOTER_TEXT.contactHeading),
      phone: str(doc?.phone, DEFAULT_FOOTER_TEXT.phone),
      email: str(doc?.email, DEFAULT_FOOTER_TEXT.email),
      newsletterHeading: str(
        doc?.newsletterHeading,
        DEFAULT_FOOTER_TEXT.newsletterHeading,
      ),
      newsletterSubtext: str(
        doc?.newsletterSubtext,
        DEFAULT_FOOTER_TEXT.newsletterSubtext,
      ),
      legalText: str(doc?.legalText, DEFAULT_FOOTER_TEXT.legalText),
    };
  } catch {
    return fallback;
  }
}
