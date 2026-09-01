import type { GlobalConfig } from "payload";

import { isAdmin } from "../access/isAdmin";
import { isPublic } from "../access/isLoggedIn";

/**
 * Header and Footer content, editable from /cms/navigation.
 *
 * Link lists are stored as `json` rather than Payload `array` fields on
 * purpose. This project has no migrations and `ensureSchema.ts` is a
 * hand-maintained DDL list, so every array field would mean another
 * hand-written child table (_order/_parent_id/id) that has to stay in
 * sync. One jsonb column per list keeps the schema trivial and the
 * repeater UI lives in /cms where the editing actually happens.
 *
 * Every field is optional. `lib/siteContent.ts` falls back to the
 * hard-coded defaults that shipped with the components, so an empty or
 * missing global renders the site exactly as it does today — the
 * important property when this first reaches production.
 */

const linkListDescription =
  'List of links, e.g. [{ "label": "Home", "href": "/" }]. Edit these in /cms/navigation.';

export const Header: GlobalConfig = {
  slug: "header",
  admin: {
    group: "Content",
    description: "Top navigation. Leave empty to use the built-in defaults.",
  },
  access: { read: isPublic, update: isAdmin },
  fields: [
    {
      name: "navLinks",
      type: "json",
      admin: {
        description: `${linkListDescription} "mega": true opens the Treatments mega menu.`,
      },
    },
  ],
};

export const Footer: GlobalConfig = {
  slug: "footer",
  admin: {
    group: "Content",
    description: "Footer links and contact details.",
  },
  access: { read: isPublic, update: isAdmin },
  fields: [
    {
      name: "joodLinks",
      type: "json",
      admin: { description: `"Jood" column. ${linkListDescription}` },
    },
    {
      name: "treatmentLinks",
      type: "json",
      admin: { description: `"Treatments" column. ${linkListDescription}` },
    },
    {
      name: "policyLinks",
      type: "json",
      admin: { description: `"Policy" column. ${linkListDescription}` },
    },
    {
      name: "contactHeading",
      type: "text",
      admin: { description: 'Heading on the contact card, e.g. "Have a question?"' },
    },
    {
      name: "phone",
      type: "text",
      admin: { description: "WhatsApp / phone number shown on the contact card." },
    },
    {
      name: "email",
      type: "text",
      admin: { description: "Support email address." },
    },
    {
      name: "newsletterHeading",
      type: "text",
    },
    {
      name: "newsletterSubtext",
      type: "text",
    },
    {
      name: "legalText",
      type: "textarea",
      admin: {
        rows: 4,
        description:
          "Small print under the footer — pharmacy registration, superintendent pharmacist, etc. The © year is added automatically.",
      },
    },
  ],
};
