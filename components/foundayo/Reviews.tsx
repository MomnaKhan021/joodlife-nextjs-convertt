import { getHomeContent } from "@/lib/pageContent";
import type { Review } from "@/lib/reviews";
import ReviewsClient from "@/sections/home/ReviewsClient";
import { FOUNDAYO } from "@/lib/foundayoContent";

/**
 * "3000+ happy customers" — the shared Trustpilot slider (real, verified
 * reviews) under the Foundayo heading and intro from the Figma.
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
      // The Figma sets the intro in regular weight (the home page uses semibold).
      text={{ reviewsIntro: { weight: "regular" } }}
    />
  );
}
