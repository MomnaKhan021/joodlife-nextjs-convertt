import type { GlobalConfig } from "payload";

import { isAdmin } from "../access/isAdmin";
import { isPublic } from "../access/isLoggedIn";

/**
 * The erectile dysfunction page at /erectile-dysfunction.
 *
 * One json field per bespoke section, in page order. The FAQ near the foot
 * of the page comes from the shared category-pages global instead.
 *
 * Anything missing falls back to lib/edContentTypes.ts, so an empty global
 * renders the page exactly as it ships.
 */
export const EdPage: GlobalConfig = {
  slug: "ed-page",
  admin: {
    group: "Content",
    description: "The erectile dysfunction page — edit in /cms/ed.",
  },
  access: { read: isPublic, update: isAdmin },
  fields: [
    { name: "hero", type: "json", admin: { description: "Photo hero banner." } },
    { name: "reviews", type: "json", admin: { description: "Patient review wall." } },
    { name: "journey", type: "json", admin: { description: "Teal timeline block." } },
    { name: "plan", type: "json", admin: { description: "Treatment-plan benefits." } },
    { name: "steps", type: "json", admin: { description: "The three steps." } },
    { name: "confidence", type: "json", admin: { description: "Confidence split." } },
    { name: "know", type: "json", admin: { description: "Let's get to know you." } },
    { name: "banner", type: "json", admin: { description: "Closing banner." } },
  ],
};

export default EdPage;
