import type { GlobalConfig } from "payload";

import { isAdmin } from "../access/isAdmin";
import { isPublic } from "../access/isLoggedIn";

/**
 * The Support page at /support.
 *
 * One json field per section of the page, in page order: the hero and its
 * quick-help card, the FAQ accordions, then the success-story strip.
 * Anything missing falls back to lib/supportContentTypes.ts, so an empty
 * global renders the page exactly as it ships.
 */
export const Support: GlobalConfig = {
  slug: "support",
  admin: {
    group: "Content",
    description: "The Support page — hero, FAQs and success stories.",
  },
  access: { read: isPublic, update: isAdmin },
  fields: [
    {
      name: "hero",
      type: "json",
      admin: { description: "Hero copy, button, photo and the quick-help card." },
    },
    {
      name: "faq",
      type: "json",
      admin: { description: "Filter pills and the FAQ sections." },
    },
    {
      name: "stories",
      type: "json",
      admin: { description: "The success-story strip at the foot of the page." },
    },
  ],
};

export default Support;
