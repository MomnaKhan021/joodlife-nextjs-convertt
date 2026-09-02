import { getHomeContent } from "@/lib/pageContent";
import type { Review } from "@/lib/reviews";
import ReviewsClient from "./ReviewsClient";

/**
 * Server wrapper: reads the reviews section from the Home global.
 *
 * If nobody has entered reviews in the CMS, the curated Trustpilot list in
 * lib/reviews.ts is used — these are real, verified reviews, so the code
 * stays the source of truth until someone deliberately overrides it.
 */
export default async function Reviews() {
  const {
    reviews,
    reviewsHeading,
    reviewsHeadingEmphasis,
    reviewsIntro,
    trustpilotScore,
    trustpilotUrl,
  } = await getHomeContent();

  // The CMS shape omits `rating`; every displayed review is 5 stars.
  const items: Review[] = reviews.map((r) => ({ ...r, rating: 5 }));

  return (
    <ReviewsClient
      heading={reviewsHeading}
      headingEmphasis={reviewsHeadingEmphasis}
      intro={reviewsIntro}
      reviews={items.length ? items : undefined}
      trustpilotScore={trustpilotScore}
      trustpilotUrl={trustpilotUrl}
    />
  );
}
