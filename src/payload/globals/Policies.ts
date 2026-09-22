import type { GlobalConfig } from "payload";

import { isAdmin } from "../access/isAdmin";
import { isPublic } from "../access/isLoggedIn";

/**
 * The three policy pages: terms, refund & complaints, privacy & cookies.
 *
 * One json field per page, each holding { title, titleAccent, intro, updated,
 * sections[] }. Anything missing falls back to lib/policyDefaults.ts, so an
 * empty global renders the pages exactly as they ship.
 *
 * These are the terms a GPhC-registered pharmacy operates under — editing
 * them is a legal act, not a copy tweak. The editors say so.
 */
export const Policies: GlobalConfig = {
  slug: "policies",
  admin: {
    group: "Content",
    description: "Terms, refund & complaints, and privacy pages.",
  },
  access: { read: isPublic, update: isAdmin },
  fields: [
    {
      name: "terms",
      type: "json",
      admin: { description: "Terms & conditions — edit in /cms/policies/terms." },
    },
    {
      name: "refundComplaints",
      type: "json",
      admin: {
        description:
          "Refund & complaints — edit in /cms/policies/refund-complaints.",
      },
    },
    {
      name: "privacy",
      type: "json",
      admin: {
        description: "Privacy & cookies — edit in /cms/policies/privacy.",
      },
    },
  ],
};

export default Policies;
