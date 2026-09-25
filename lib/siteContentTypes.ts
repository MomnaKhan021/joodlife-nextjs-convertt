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

import {
  DEFAULT_HEADER_SETTINGS,
  type HeaderSettings,
} from "@/lib/headerLayout";
import { EMPTY_STYLE, type SectionStyle } from "@/lib/sectionStyle";
import {
  FOOTER_TEXT_KEYS,
  HEADER_TEXT_KEYS,
  mergeTextStyles,
  type FooterTextKey,
  type HeaderTextKey,
  type TextStyle,
} from "@/lib/textStyle";

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

/** The social accounts the footer links to, and the icon each one draws. */
export type SocialPlatform =
  | "tiktok"
  | "facebook"
  | "instagram"
  | "x"
  | "youtube"
  | "linkedin";

export type SocialLink = { platform: SocialPlatform; href: string };

export const SOCIAL_PLATFORMS: { value: SocialPlatform; label: string }[] = [
  { value: "tiktok", label: "TikTok" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "x", label: "X" },
  { value: "youtube", label: "YouTube" },
  { value: "linkedin", label: "LinkedIn" },
];

export const DEFAULT_SOCIALS: SocialLink[] = [
  { platform: "tiktok", href: "https://www.tiktok.com/@myjoodlife" },
  { platform: "facebook", href: "https://www.facebook.com/myjoodlife/" },
  {
    platform: "instagram",
    href: "https://www.instagram.com/myjoodlife?igsh=eWFnOXl0ZzVja2Vh&utm_source=qr",
  },
];

/**
 * The registration and compliance line under the copyright.
 *
 * Held here rather than in the component so the editor can show the real
 * wording in its box. It used to default to an empty string, which meant the
 * CMS showed a blank field while the site rendered a paragraph — so anyone
 * looking to correct a registration number found nothing to correct.
 */
export const DEFAULT_LEGAL_TEXT =
  "Superintendent Pharmacist: Zahhaad Khalil (2228969) Powered by Jood Pharmacy, a GPhC-registered pharmacy (9012990) operating under Jood Ltd. Clinical, consultation and prescribing services are provided by UK-registered prescribers. All medicines are dispensed and delivered in accordance with GPhC and MHRA guidance.";

export const DEFAULT_FOOTER_TEXT = {
  /** Headings above each link column, and above the social icons. */
  joodTitle: "Jood",
  treatmentsTitle: "Treatments",
  policyTitle: "Policy",
  followTitle: "Follow",
  contactHeading: "Have a question?",
  phone: "07756 099075",
  email: "support@joodlife.com",
  newsletterHeading: "Sign Up For Our Newsletter",
  newsletterSubtext: "Stay up to date on our news, education and offers",
  /** {year} is replaced with the current year when the footer renders. */
  copyrightLine: "© {year} Jood. All rights reserved.",
  legalText: DEFAULT_LEGAL_TEXT,
  logo: "/assets/figma/footer-logo-2.png",
  contactIcon: "/assets/figma/icon-chat.svg",
};

/** Header logos — the images that shipped in HeaderClient. */
export const DEFAULT_HEADER_LOGOS = {
  logoDesktop: "/assets/icons/logo-wesmount.svg",
  logoMobile: "/assets/icons/logo-wesmount-mobile.svg",
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
  /** Background / text colour for the header bar. */
  style: SectionStyle;
  /** Layout preset and sticky behaviour. */
  settings: HeaderSettings;
  /** Per-text size and weight, keyed by the field name. */
  textStyles: Record<HeaderTextKey, TextStyle>;
  navLinks: SiteLink[];
  megaTreatments: MegaTreatment[];
  megaPromoBullets: string[];
} & typeof DEFAULT_MEGA &
  typeof DEFAULT_HEADER_LOGOS;

export type FooterContent = {
  /** Background / text colour for the footer. */
  style: SectionStyle;
  /** Per-text size and weight, keyed by the field name. */
  textStyles: Record<FooterTextKey, TextStyle>;
  joodLinks: SiteLink[];
  treatmentLinks: SiteLink[];
  policyLinks: SiteLink[];
  socials: SocialLink[];
} & typeof DEFAULT_FOOTER_TEXT;

/** Accept only rows naming a platform we can draw; anything else falls back. */
export function toSocials(value: unknown, fallback: SocialLink[]): SocialLink[] {
  if (!Array.isArray(value)) return fallback;
  const known = new Set(SOCIAL_PLATFORMS.map((p) => p.value));
  const cleaned = value
    .filter(
      (v): v is SocialLink =>
        Boolean(v) &&
        typeof v === "object" &&
        known.has((v as SocialLink).platform) &&
        typeof (v as SocialLink).href === "string" &&
        (v as SocialLink).href.trim() !== "",
    )
    .map((v) => ({ platform: v.platform, href: v.href.trim() }));
  // An empty list is a deliberate "show no icons", not a reason to fall back.
  return Array.isArray(value) ? cleaned : fallback;
}

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
    style: EMPTY_STYLE,
    settings: DEFAULT_HEADER_SETTINGS,
    textStyles: mergeTextStyles(null, HEADER_TEXT_KEYS),
    navLinks: DEFAULT_NAV_LINKS,
    megaTreatments: DEFAULT_MEGA_TREATMENTS,
    megaPromoBullets: DEFAULT_MEGA_BULLETS,
    ...DEFAULT_MEGA,
    ...DEFAULT_HEADER_LOGOS,
  };
}

export function footerFallback(): FooterContent {
  return {
    style: EMPTY_STYLE,
    textStyles: mergeTextStyles(null, FOOTER_TEXT_KEYS),
    joodLinks: DEFAULT_JOOD_LINKS,
    treatmentLinks: DEFAULT_TREATMENT_LINKS,
    policyLinks: DEFAULT_POLICY_LINKS,
    socials: DEFAULT_SOCIALS,
    ...DEFAULT_FOOTER_TEXT,
  };
}
