import { getHomeContent } from "@/lib/pageContent";
import type { Review } from "@/lib/reviews";
import { FOUNDAYO } from "@/lib/foundayoContent";
import ReviewsSlider from "./ReviewsSlider";

/**
 * "Loved for the support" — Figma 2003:1465. Real, verified Trustpilot
 * reviews from the CMS (the design's sample cards have no real review behind
 * them, per its notes) in a slider styled to the Figma: four 315px cards on
 * #fff8f6 with a 1px #d0cfcd border.
 */
export default async function Reviews() {
  const { reviews, trustpilotScore, trustpilotUrl } = await getHomeContent();
  const items: Review[] = reviews.map((r) => ({ ...r, rating: 5 }));
  return (
    <ReviewsSlider
      heading={FOUNDAYO.reviews.heading}
      headingAccent={FOUNDAYO.reviews.headingAccent}
      intro={FOUNDAYO.reviews.intro}
      reviews={items}
      trustpilotScore={trustpilotScore}
      trustpilotUrl={trustpilotUrl}
    />
  );
}
