import type { GlobalConfig } from "payload";

import { isAdmin } from "../access/isAdmin";
import { isPublic } from "../access/isLoggedIn";

/**
 * The Wegovy Pills landing page at /wegovy-pills.
 *
 * One json field per section, in page order. Anything missing falls back to
 * lib/wegovyContentTypes.ts, so an empty global renders the page exactly as
 * it ships.
 *
 * Several of these sections carry regulated copy — efficacy figures, MHRA
 * status, dosing and pricing, and the safety notice. The /cms editor says so.
 */
export const WegovyPage: GlobalConfig = {
  slug: "wegovy-page",
  admin: {
    group: "Content",
    description: "The Wegovy Pills landing page — edit in /cms/wegovy.",
  },
  access: { read: isPublic, update: isAdmin },
  fields: [
    { name: "announcement", type: "json", admin: { description: "Strip above the header." } },
    { name: "hero", type: "json", admin: { description: "Photo hero and its claims." } },
    { name: "uspBar", type: "json", admin: { description: "Scrolling trust strip." } },
    { name: "whatIsPill", type: "json", admin: { description: "Explainer carousel." } },
    { name: "comparison", type: "json", admin: { description: "Tablet vs injection." } },
    { name: "howItWorks", type: "json", admin: { description: "Callouts around the tablet." } },
    { name: "realResults", type: "json", admin: { description: "Efficacy figures." } },
    { name: "dosing", type: "json", admin: { description: "Dose schedule and pricing." } },
    { name: "whyChoose", type: "json", admin: { description: "Benefits and safety notice." } },
    { name: "faq", type: "json", admin: { description: "Accordion questions." } },
    { name: "finalCta", type: "json", admin: { description: "Closing card and disclaimer." } },
  ],
};

export default WegovyPage;
