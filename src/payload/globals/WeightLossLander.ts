import type { GlobalConfig } from "payload";

import { canWriteCms } from "../access/canWriteCms";
import { isPublic } from "../access/isLoggedIn";

/**
 * The weight-loss ads landing page at /weight-loss-lander.
 *
 * One json field per section, in page order. Anything missing falls back to
 * lib/landerContentTypes.ts, so an empty global renders the page exactly as
 * it ships.
 */
export const WeightLossLander: GlobalConfig = {
  slug: "weight-loss-lander",
  admin: {
    group: "Content",
    description: "The weight-loss ads landing page — edit in /cms/weight-loss-lander.",
  },
  access: { read: isPublic, update: canWriteCms("cms-sections") },
  fields: [
    { name: "hero", type: "json", admin: { description: "Top bar and green hero." } },
    { name: "trust", type: "json", admin: { description: "Trust strip under the hero." } },
    { name: "stories", type: "json", admin: { description: "Video stories and the four feature cards." } },
    { name: "results", type: "json", admin: { description: "Before/after slider." } },
    { name: "expertise", type: "json", admin: { description: "Backed by medical expertise." } },
    { name: "steps", type: "json", admin: { description: "How the programme works." } },
    { name: "journey", type: "json", admin: { description: "Your journey video cards." } },
    { name: "reviews", type: "json", admin: { description: "Verified patient reviews." } },
    { name: "faq", type: "json", admin: { description: "Frequently asked questions." } },
    { name: "final", type: "json", admin: { description: "Closing call to action." } },
    {
      name: "styles",
      type: "json",
      admin: { description: "Per-section background / text colour. Empty means the design as shipped." },
    },
  ],
};

export default WeightLossLander;
