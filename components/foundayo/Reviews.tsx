import { getHomeContent } from "@/lib/pageContent";
import type { Review } from "@/lib/reviews";
import ReviewsClient from "@/sections/home/ReviewsClient";
import { FOUNDAYO } from "@/lib/foundayoContent";

/**
 * "Loved for the support" — Figma 2003:1465. Uses the shared Trustpilot
 * slider with the site's real, verified reviews rather than the design's
 * sample cards: the design notes flag several of those cards as having no
 * real review behind them, and only genuine reviews may be shown.
 */
export default async function Reviews() {
  const { reviews, trustpilotScore, trustpilotUrl } = await getHomeContent();
  const items: Review[] = reviews.map((r) => ({ ...r, rating: 5 }));
  return (
    <ReviewsClient
      heading={FOUNDAYO.reviews.heading}
      headingEmphasis={FOUNDAYO.reviews.headingAccent}
      intro={FOUNDAYO.reviews.intro}
      reviews={items.length ? items : undefined}
      trustpilotScore={trustpilotScore}
      trustpilotUrl={trustpilotUrl}
      // Figma sets the intro in medium (the home page uses semibold).
      text={{ reviewsIntro: { weight: "medium" } }}
    />
  );
}
