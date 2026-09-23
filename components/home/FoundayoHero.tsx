import { getHomeContent } from "@/lib/pageContent";
import { getCategories } from "@/lib/treatmentContent";
import FoundayoHeroView from "./FoundayoHeroView";

/**
 * Server wrapper: reads the hero from the Home global.
 *
 * The two secondary cards on the right come from lib/categories.ts and are
 * rendered inside the view — they're category routing, not hero copy.
 */
export default async function FoundayoHero({
  isReturningPatient,
}: {
  isReturningPatient?: boolean;
} = {}) {
  const {
    heroBadge,
    heroTitle,
    heroTitleEmphasis,
    heroBody,
    heroFeatures,
    heroCtaLabel,
    heroCtaLabelReturning,
    heroCtaHref,
    heroImage,
    styles,
    textStyles,
  } = await getHomeContent();
  const categories = await getCategories();

  return (
    <FoundayoHeroView
      categories={categories}
      style={styles.hero}
      text={textStyles}
      badge={heroBadge}
      title={heroTitle}
      titleEmphasis={heroTitleEmphasis}
      body={heroBody}
      features={heroFeatures}
      ctaLabel={heroCtaLabel}
      ctaLabelReturning={heroCtaLabelReturning}
      ctaHref={heroCtaHref}
      image={heroImage}
      isReturningPatient={isReturningPatient}
    />
  );
}
