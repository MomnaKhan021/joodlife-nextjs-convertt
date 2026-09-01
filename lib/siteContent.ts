import "server-only";

import { getPayloadInstance } from "@/lib/payload";
import {
  DEFAULT_FOOTER_TEXT,
  DEFAULT_HEADER_LOGOS,
  DEFAULT_JOOD_LINKS,
  DEFAULT_MEGA,
  DEFAULT_MEGA_BULLETS,
  DEFAULT_MEGA_TREATMENTS,
  DEFAULT_NAV_LINKS,
  DEFAULT_POLICY_LINKS,
  DEFAULT_TREATMENT_LINKS,
  footerFallback,
  headerFallback,
  str,
  toLinks,
  toStrings,
  toTreatments,
  type FooterContent,
  type HeaderContent,
} from "@/lib/siteContentTypes";

/**
 * Server-side reader for the Header and Footer globals.
 *
 * Types, defaults and the coercion helpers live in `siteContentTypes.ts`
 * — that module has no `server-only` marker, so the /cms client editors can
 * import them. Keeping the split matters: importing this file from a client
 * component fails the production build, even for a type-only import.
 *
 * Everything falls back to the shipped defaults, so an empty global, a
 * missing table or an unreachable database all render the site unchanged.
 */

export * from "@/lib/siteContentTypes";

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
      logoDesktop: str(doc?.logoDesktop, DEFAULT_HEADER_LOGOS.logoDesktop),
      logoMobile: str(doc?.logoMobile, DEFAULT_HEADER_LOGOS.logoMobile),
    };
  } catch {
    return headerFallback();
  }
}

export async function getFooterContent(): Promise<FooterContent> {
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
      logo: str(doc?.logo, DEFAULT_FOOTER_TEXT.logo),
      contactIcon: str(doc?.contactIcon, DEFAULT_FOOTER_TEXT.contactIcon),
    };
  } catch {
    return footerFallback();
  }
}
