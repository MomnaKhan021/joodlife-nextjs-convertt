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

export type MegaTreatment = {
  label: string;
  desc: string;
  href: string;
  icon: string;
};

export const DEFAULT_MEGA_TREATMENTS: MegaTreatment[] = [
  {
    label: "Weight loss",
    desc: "Sustainable fat reduction",
    href: "/wegovy-pills",
    icon: "/assets/megamenu/treat-wl.png",
  },
  {
    label: "Erectile dysfunction",
    desc: "Improved sexual performance",
    href: "/erectile-dysfunction",
    icon: "/assets/megamenu/treat-ed.png",
  },
  {
    label: "Period Delay",
    desc: "Delay menstrual cycle",
    href: "/period-delay",
    icon: "/assets/megamenu/treat-pd.png",
  },
];

export const DEFAULT_MEGA = {
  megaHeading: "Our Treatments",
  megaPromoTitle: "Weight loss,",
  megaPromoEmphasis: "made for you.",
  megaPromoCta: "Explore More",
  megaPromoHref: "/shop",
};

export const DEFAULT_MEGA_BULLETS: string[] = [
  "Lose up to 27% body weight",
  "Plans tailored to you",
  "Guidance for lasting results",
];

export type HeaderContent = {
  navLinks: SiteLink[];
  megaTreatments: MegaTreatment[];
  megaPromoBullets: string[];
} & typeof DEFAULT_MEGA;
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

function toTreatments(
  value: unknown,
  fallback: MegaTreatment[],
): MegaTreatment[] {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .filter(
      (v): v is MegaTreatment =>
        Boolean(v) &&
        typeof v === "object" &&
        typeof (v as MegaTreatment).label === "string" &&
        typeof (v as MegaTreatment).href === "string",
    )
    .map((v) => ({
      label: v.label,
      desc: typeof v.desc === "string" ? v.desc : "",
      href: v.href,
      icon: typeof v.icon === "string" ? v.icon : "",
    }));
  return cleaned.length ? cleaned : fallback;
}

function toStrings(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value.filter((v): v is string => typeof v === "string" && v.trim() !== "");
  return cleaned.length ? cleaned : fallback;
}

function str(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function headerFallback(): HeaderContent {
  return {
    navLinks: DEFAULT_NAV_LINKS,
    megaTreatments: DEFAULT_MEGA_TREATMENTS,
    megaPromoBullets: DEFAULT_MEGA_BULLETS,
    ...DEFAULT_MEGA,
  };
}

export async function getHeaderContent(): Promise<HeaderContent> {
  try {
    const payload = await getPayloadInstance();
    const doc = (await payload.findGlobal({
      slug: "header",
      depth: 0,
      overrideAccess: true,
    })) as Record<string, unknown>;
    return {
      navLinks: toLinks(doc?.navLinks, DEFAULT_NAV_LINKS),
      megaTreatments: toTreatments(doc?.megaTreatments, DEFAULT_MEGA_TREATMENTS),
      megaPromoBullets: toStrings(doc?.megaPromoBullets, DEFAULT_MEGA_BULLETS),
      megaHeading: str(doc?.megaHeading, DEFAULT_MEGA.megaHeading),
      megaPromoTitle: str(doc?.megaPromoTitle, DEFAULT_MEGA.megaPromoTitle),
      megaPromoEmphasis: str(doc?.megaPromoEmphasis, DEFAULT_MEGA.megaPromoEmphasis),
      megaPromoCta: str(doc?.megaPromoCta, DEFAULT_MEGA.megaPromoCta),
      megaPromoHref: str(doc?.megaPromoHref, DEFAULT_MEGA.megaPromoHref),
    };
  } catch {
    return headerFallback();
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
