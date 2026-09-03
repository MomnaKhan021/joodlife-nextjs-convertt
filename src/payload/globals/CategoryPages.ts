import type { GlobalConfig } from "payload";

import { isAdmin } from "../access/isAdmin";
import { isPublic } from "../access/isLoggedIn";

/**
 * Shared furniture on the treatment sub-pages — /period-delay,
 * /erectile-dysfunction and /weight-loss.
 *
 * The themed hero at the top of each page comes from the Treatments global;
 * this holds what those pages carried as literals. Anything missing falls
 * back to lib/categoryPageContentTypes.ts, so an empty global renders them
 * exactly as they ship.
 */
export const CategoryPages: GlobalConfig = {
  slug: "category-pages",
  admin: {
    group: "Content",
    description: "Treatment sub-pages — trust strip, features and FAQs.",
  },
  access: { read: isPublic, update: isAdmin },
  fields: [
    {
      name: "uspStrip",
      type: "json",
      admin: { description: "The scrolling trust strip." },
    },
    {
      name: "featureGrid",
      type: "json",
      admin: { description: "The dark 'more than treatment' panel." },
    },
    {
      name: "faqs",
      type: "json",
      admin: { description: "One question list per treatment." },
    },
  ],
};

export default CategoryPages;
