import "server-only";

import { getPayloadInstance } from "@/lib/payload";
import { str } from "@/lib/siteContentTypes";
import {
  DEFAULT_ANNOUNCEMENT,
  DEFAULT_CTA,
  DEFAULT_FAQS,
  DEFAULT_FAQ_HEADING,
  DEFAULT_BLOG_HEADING,
  DEFAULT_HERO,
  DEFAULT_HERO_FEATURES,
  DEFAULT_HIW_HEADING,
  DEFAULT_HIW_STEPS,
  DEFAULT_REVIEWS_HEADING,
  homeFallback,
  toFaqs,
  toHeroFeatures,
  toHiwSteps,
  toReviews,
  type HomeContent,
} from "@/lib/pageContentTypes";

/**
 * Server-side reader for the Home page global.
 *
 * Types and defaults live in `pageContentTypes.ts` (no `server-only`) so the
 * /cms editors can import them — importing this file from a client component
 * fails the production build, even for a type-only import.
 */

export * from "@/lib/pageContentTypes";

export async function getHomeContent(): Promise<HomeContent> {
  try {
    const payload = await getPayloadInstance();
    const doc = (await payload.findGlobal({
      slug: "home-page",
      depth: 0,
      overrideAccess: true,
    })) as Record<string, unknown>;
    return {
      faqs: toFaqs(doc?.faqs, DEFAULT_FAQS),
      announcementBadge: str(
        doc?.announcementBadge,
        DEFAULT_ANNOUNCEMENT.announcementBadge,
      ),
      announcementText: str(
        doc?.announcementText,
        DEFAULT_ANNOUNCEMENT.announcementText,
      ),
      announcementHref: str(
        doc?.announcementHref,
        DEFAULT_ANNOUNCEMENT.announcementHref,
      ),
      // A checkbox is a real boolean, so no string fallback here.
      announcementHidden: Boolean(doc?.announcementHidden),
      faqHeading: str(doc?.faqHeading, DEFAULT_FAQ_HEADING.faqHeading),
      faqHeadingEmphasis: str(
        doc?.faqHeadingEmphasis,
        DEFAULT_FAQ_HEADING.faqHeadingEmphasis,
      ),
      heroFeatures: toHeroFeatures(doc?.heroFeatures, DEFAULT_HERO_FEATURES),
      heroBadge: str(doc?.heroBadge, DEFAULT_HERO.heroBadge),
      heroTitle: str(doc?.heroTitle, DEFAULT_HERO.heroTitle),
      heroTitleEmphasis: str(
        doc?.heroTitleEmphasis,
        DEFAULT_HERO.heroTitleEmphasis,
      ),
      heroBody: str(doc?.heroBody, DEFAULT_HERO.heroBody),
      heroCtaLabel: str(doc?.heroCtaLabel, DEFAULT_HERO.heroCtaLabel),
      heroCtaHref: str(doc?.heroCtaHref, DEFAULT_HERO.heroCtaHref),
      heroImage: str(doc?.heroImage, DEFAULT_HERO.heroImage),
      reviews: toReviews(doc?.reviews),
      reviewsHeading: str(
        doc?.reviewsHeading,
        DEFAULT_REVIEWS_HEADING.reviewsHeading,
      ),
      reviewsHeadingEmphasis: str(
        doc?.reviewsHeadingEmphasis,
        DEFAULT_REVIEWS_HEADING.reviewsHeadingEmphasis,
      ),
      reviewsIntro: str(doc?.reviewsIntro, DEFAULT_REVIEWS_HEADING.reviewsIntro),
      trustpilotScore: str(
        doc?.trustpilotScore,
        DEFAULT_REVIEWS_HEADING.trustpilotScore,
      ),
      trustpilotUrl: str(doc?.trustpilotUrl, DEFAULT_REVIEWS_HEADING.trustpilotUrl),
      blogHeading: str(doc?.blogHeading, DEFAULT_BLOG_HEADING.blogHeading),
      blogHeadingEmphasis: str(
        doc?.blogHeadingEmphasis,
        DEFAULT_BLOG_HEADING.blogHeadingEmphasis,
      ),
      hiwSteps: toHiwSteps(doc?.hiwSteps, DEFAULT_HIW_STEPS),
      hiwHeading: str(doc?.hiwHeading, DEFAULT_HIW_HEADING.hiwHeading),
      hiwHeadingEmphasis: str(
        doc?.hiwHeadingEmphasis,
        DEFAULT_HIW_HEADING.hiwHeadingEmphasis,
      ),
      ctaTitle: str(doc?.ctaTitle, DEFAULT_CTA.ctaTitle),
      ctaTitleEmphasis: str(doc?.ctaTitleEmphasis, DEFAULT_CTA.ctaTitleEmphasis),
      ctaSubtitle: str(doc?.ctaSubtitle, DEFAULT_CTA.ctaSubtitle),
      ctaImage: str(doc?.ctaImage, DEFAULT_CTA.ctaImage),
    };
  } catch {
    return homeFallback();
  }
}
