import type { GlobalConfig } from "payload";

import { isAdmin } from "../access/isAdmin";
import { isPublic } from "../access/isLoggedIn";

/**
 * Treatment category copy, editable from /cms/treatments.
 *
 * These three categories drive a lot of surface area: the two cards beside
 * the home hero, the three home page preview sections, and the treatment
 * landing pages. Editing here changes all of them at once.
 *
 * Stored as a single `json` array keyed by category, merged over the
 * defaults in lib/categories.ts. Anything left blank falls back, so an
 * empty global renders the site exactly as it does today.
 *
 * Deliberately NOT editable here: the `theme` colour tokens. They're
 * pixel-matched to the Figma design and a wrong value makes body text
 * unreadable against the section background — that's a design-system
 * change, not a content edit.
 */
export const Treatments: GlobalConfig = {
  slug: "treatments",
  admin: {
    group: "Content",
    description:
      "Copy and imagery for the three treatment categories. Blank fields use the built-in text.",
  },
  access: { read: isPublic, update: isAdmin },
  fields: [
    {
      name: "categories",
      type: "json",
      admin: {
        description:
          'Per-category overrides, keyed by "weight-loss" | "erectile-dysfunction" | "period-delay". Edit these in /cms/treatments rather than by hand.',
      },
    },
  ],
};

export default Treatments;
