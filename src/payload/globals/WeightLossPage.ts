import type { GlobalConfig } from "payload";

import { isAdmin } from "../access/isAdmin";
import { isPublic } from "../access/isLoggedIn";

/**
 * The weight loss page at /weight-loss.
 *
 * One json field per bespoke section, in page order. The reviews, "How it
 * works", FAQs, blog carousel and closing banner on that page are the Home
 * page's own sections and are stored on the home-page global.
 *
 * Anything missing falls back to lib/weightLossContentTypes.ts, so an empty
 * global renders the page exactly as it ships.
 */
export const WeightLossPage: GlobalConfig = {
  slug: "weight-loss-page",
  admin: {
    group: "Content",
    description: "The weight loss page — edit in /cms/weight-loss.",
  },
  access: { read: isPublic, update: isAdmin },
  fields: [
    { name: "hero", type: "json", admin: { description: "Hero card." } },
    { name: "usp", type: "json", admin: { description: "Scrolling trust strip." } },
    { name: "bmi", type: "json", admin: { description: "BMI calculator." } },
    { name: "journey", type: "json", admin: { description: "Timeline and the two cards below it." } },
    { name: "features", type: "json", admin: { description: "Dark feature panel." } },
    { name: "quiz", type: "json", admin: { description: "Let's get to know you." } },
  ],
};

export default WeightLossPage;
