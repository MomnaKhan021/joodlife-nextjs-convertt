import { getHomeContent } from "@/lib/pageContent";
import FoundayoHeroView from "./FoundayoHeroView";

/**
 * Server wrapper: reads the hero from the Home global.
 *
 * The two secondary cards on the right come from lib/categories.ts and are
 * rendered inside the view — they're category routing, not hero copy.
 */
export default async function FoundayoHero() {
  const {
    heroBadge,
    heroTitle,
    heroTitleEmphasis,
    heroBody,
    heroFeatures,
    heroCtaLabel,
    heroCtaHref,
    heroImage,
  } = await getHomeContent();

  return (
    <FoundayoHeroView
      badge={heroBadge}
      title={heroTitle}
      titleEmphasis={heroTitleEmphasis}
      body={heroBody}
      features={heroFeatures}
      ctaLabel={heroCtaLabel}
      ctaHref={heroCtaHref}
      image={heroImage}
    />
  );
}
