import type { GlobalConfig } from "payload";

import { isAdmin } from "../access/isAdmin";
import { isPublic } from "../access/isLoggedIn";

/**
 * Home page section content, editable from /cms/sections.
 *
 * Same shape and rules as SiteChrome: repeating lists are `json` columns
 * (this project hand-maintains DDL, so every array field would mean another
 * child table), and every field is optional. `lib/pageContent.ts` falls back
 * to the copy that shipped in the components, so an empty global renders the
 * site exactly as it does today.
 *
 * Sections are added here incrementally — announcement bar, FAQ and the
 * closing CTA first, since those are the ones that actually change.
 */
export const HomePage: GlobalConfig = {
  slug: "home-page",
  admin: {
    group: "Content",
    description: "Home page sections. Empty fields use the built-in copy.",
  },
  access: { read: isPublic, update: isAdmin },
  fields: [
    // ---- Announcement bar (sitewide, above the header) ----
    {
      name: "announcementBadge",
      type: "text",
      admin: { description: 'Small pill on the left, e.g. "New". Blank hides it.' },
    },
    {
      name: "announcementText",
      type: "textarea",
      admin: { rows: 2, description: "The announcement message." },
    },
    {
      name: "announcementHref",
      type: "text",
      admin: { description: "Where the announcement links to." },
    },
    {
      name: "announcementHidden",
      type: "checkbox",
      defaultValue: false,
      admin: { description: "Hide the announcement bar entirely." },
    },

    // ---- FAQ ----
    {
      name: "faqHeading",
      type: "text",
      admin: { description: "First part of the heading, in the normal weight." },
    },
    {
      name: "faqHeadingEmphasis",
      type: "text",
      admin: { description: "Second part, shown in italics." },
    },
    {
      name: "faqs",
      type: "json",
      admin: {
        description: 'Questions and answers: [{ "q": "…", "a": "…" }]',
      },
    },

    // ---- Reviews ----
    { name: "reviewsHeading", type: "text" },
    {
      name: "reviewsHeadingEmphasis",
      type: "text",
      admin: { description: "Second part of the heading, shown in italics." },
    },
    { name: "reviewsIntro", type: "textarea", admin: { rows: 3 } },
    {
      name: "reviews",
      type: "json",
      admin: {
        description:
          'Reviews: [{ "name": "…", "text": "…", "initials": "AB", "avatar": "/…" }]. These are real Trustpilot reviews — do not invent testimonials.',
      },
    },
    {
      name: "trustpilotScore",
      type: "text",
      admin: { description: 'Score shown beside the Trustpilot logo, e.g. "4.4".' },
    },
    { name: "trustpilotUrl", type: "text" },

    // ---- Blog strip ----
    { name: "blogHeading", type: "text" },
    {
      name: "blogHeadingEmphasis",
      type: "text",
      admin: { description: "Second part of the heading, shown in italics." },
    },

    // ---- How it works ----
    { name: "hiwHeading", type: "text" },
    {
      name: "hiwHeadingEmphasis",
      type: "text",
      admin: { description: "Second part of the heading, shown in italics." },
    },
    {
      name: "hiwSteps",
      type: "json",
      admin: {
        description:
          'Steps: [{ "step": "Step 1", "title": "…", "copy": "…", "img": "/assets/…" }]',
      },
    },

    // ---- Closing CTA banner ----
    { name: "ctaTitle", type: "text" },
    {
      name: "ctaTitleEmphasis",
      type: "text",
      admin: { description: "Second part of the CTA heading, shown in italics." },
    },
    { name: "ctaSubtitle", type: "textarea", admin: { rows: 2 } },
    {
      name: "ctaImage",
      type: "text",
      admin: { description: "Background portrait image URL." },
    },
  ],
};

export default HomePage;
