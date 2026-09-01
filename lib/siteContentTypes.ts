/**
 * Header / footer content types and defaults.
 *
 * Deliberately free of `server-only` and of any Payload import so client
 * components (the /cms editors) can use these types. `lib/siteContent.ts`
 * is the server-side counterpart that actually reads the globals, and it
 * re-exports everything here so server code has a single import.
 *
 * The DEFAULT_* values are what shipped hard-coded in the components. They
 * are the fallback whenever the CMS is empty, which is what makes the CMS
 * safe to deploy: an unfilled global renders the site exactly as before.
 */

export type MegaTreatment = {
  label: string;
  desc: string;
  href: string;
  icon: string;
};

/** Mega-menu content attached to a single nav link. */
export type MegaContent = {
  megaHeading?: string;
  megaTreatments?: MegaTreatment[];
  megaPromoTitle?: string;
  megaPromoEmphasis?: string;
  megaPromoBullets?: string[];
  megaPromoCta?: string;
  megaPromoHref?: string;
};

export type SiteLink = {
  label: string;
  href: string;
  /** Opens a mega panel on hover instead of navigating straight away. */
  mega?: boolean;
  /**
   * This link's own mega-menu content. Optional: a link with `mega` but no
   * `megaContent` falls back to the header-level fields, which is what
   * existing single-mega-menu setups rely on.
   */
  megaContent?: MegaContent;
};

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
export function toLinks(value: unknown, fallback: SiteLink[]): SiteLink[] {
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
      ...(v.megaContent && typeof v.megaContent === "object"
        ? { megaContent: v.megaContent }
        : {}),
    }));
  return cleaned.length ? cleaned : fallback;
}

export function toTreatments(
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

export function toStrings(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value.filter(
    (v): v is string => typeof v === "string" && v.trim() !== "",
  );
  return cleaned.length ? cleaned : fallback;
}

export function str(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function headerFallback(): HeaderContent {
  return {
    navLinks: DEFAULT_NAV_LINKS,
    megaTreatments: DEFAULT_MEGA_TREATMENTS,
    megaPromoBullets: DEFAULT_MEGA_BULLETS,
    ...DEFAULT_MEGA,
  };
}

export function footerFallback(): FooterContent {
  return {
    joodLinks: DEFAULT_JOOD_LINKS,
    treatmentLinks: DEFAULT_TREATMENT_LINKS,
    policyLinks: DEFAULT_POLICY_LINKS,
    ...DEFAULT_FOOTER_TEXT,
  };
}
