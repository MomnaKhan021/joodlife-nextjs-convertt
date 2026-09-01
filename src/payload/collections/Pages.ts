import type { CollectionConfig } from "payload";

import { isAdmin } from "../access/isAdmin";

/**
 * Editable site pages.
 *
 * Lets the content team create pages without a deploy: pick a slug,
 * write the body in the Lexical rich-text editor (or paste raw HTML for
 * migrated content), publish. The page renders at `/<slug>` via the
 * catch-all route in `app/(site)/[slug]/page.tsx`.
 *
 * Deliberately mirrors `Posts` — same slug hook, same draft/published
 * model, same SEO collapsible — so editors only learn one pattern.
 *
 * Fields:
 *   - title, slug (auto from title), excerpt
 *   - content (lexical rich text) OR bodyHtml (raw HTML, takes priority)
 *   - heroImage (upload to media)
 *   - status (draft/published), publishedAt (auto-set on first publish)
 *   - SEO collapsible: metaTitle, metaDescription
 *
 * Access:
 *   - read: published pages are public; drafts admin-only
 *   - create/update/delete: admin-only
 *
 * NOTE: hard-coded routes win over this collection. A page with slug
 * "shop" never renders, because `app/(site)/shop/page.tsx` matches first.
 * RESERVED_SLUGS rejects those at save time so the clash is visible in
 * the editor instead of silently doing nothing.
 */

/** Slugs owned by real routes — a Page with one of these would never render. */
const RESERVED_SLUGS = new Set([
  "admin",
  "admin-tools",
  "api",
  "blogs",
  "cart",
  "checkout",
  "cms",
  "consultation",
  "erectile-dysfunction",
  "final-product-page",
  "forgot",
  "login",
  "period-delay",
  "policies",
  "products",
  "profile",
  "reorder",
  "reset-password",
  "shop",
  "signup",
  "support",
  "wegovy-pills",
  "weight-loss",
]);

export const Pages: CollectionConfig = {
  slug: "pages",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "status", "publishedAt"],
    group: "Content",
    description:
      "Standalone pages rendered at /<slug>. Save as draft while writing; switch status to Published to make it live.",
  },
  access: {
    // Public read for published pages; admins see everything.
    read: ({ req: { user } }) => {
      if (user?.role === "admin") return true;
      return { status: { equals: "published" } };
    },
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [
      // Stamp publishedAt when a page first transitions to published.
      ({ data, originalDoc }) => {
        if (
          data?.status === "published" &&
          !data.publishedAt &&
          (!originalDoc || originalDoc.status !== "published")
        ) {
          data.publishedAt = new Date().toISOString();
        }
        return data;
      },
    ],
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      index: true,
      unique: true,
      required: true,
      admin: {
        description:
          "URL for the page — 'about-us' renders at /about-us. Auto-generated from the title if left empty.",
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (value) return String(value).toLowerCase().trim();
            if (data?.title) {
              return String(data.title)
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "");
            }
            return value;
          },
        ],
      },
      validate: (value: string | null | undefined) => {
        if (!value) return true; // `required` reports the empty case
        const slug = String(value).toLowerCase().trim();
        if (RESERVED_SLUGS.has(slug)) {
          return `"${slug}" is used by an existing page of the site, so this page would never appear. Pick a different slug.`;
        }
        if (!/^[a-z0-9-]+$/.test(slug)) {
          return "Use lowercase letters, numbers and hyphens only.";
        }
        return true;
      },
    },
    {
      name: "redirectUrl",
      type: "text",
      admin: {
        description:
          "Optional. If set, opening this page sends the visitor here instead of rendering it — e.g. /shop or https://example.com. Leave empty for a normal page.",
      },
    },
    {
      name: "redirectPermanent",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description:
          "Tick for a permanent (308) redirect. Browsers and search engines cache these hard, so only use it once the new URL is final.",
      },
    },
    {
      name: "excerpt",
      type: "textarea",
      admin: {
        description:
          "Short summary used in social previews and as the fallback meta description.",
      },
    },
    {
      name: "heroImage",
      type: "upload",
      relationTo: "media",
      admin: {
        description: "Optional image shown at the top of the page.",
      },
    },
    {
      name: "content",
      type: "richText",
      admin: {
        description:
          "The page body. Supports headings, lists, links and images. Leave empty if you're pasting raw HTML below.",
      },
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "draft",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
      admin: {
        position: "sidebar",
        description: "Only Published pages are visible to the public.",
      },
    },
    {
      name: "publishedAt",
      type: "date",
      admin: {
        position: "sidebar",
        description:
          "Set automatically when status flips to Published. You can override it here.",
        date: { pickerAppearance: "dayAndTime" },
      },
    },
    {
      type: "collapsible",
      label: "Raw HTML (advanced)",
      admin: { initCollapsed: true },
      fields: [
        {
          name: "bodyHtml",
          type: "textarea",
          admin: {
            rows: 12,
            description:
              "Raw HTML body. When present this is rendered INSTEAD of the rich text above — useful for migrated or hand-written markup. Clear it to go back to the editor.",
          },
        },
      ],
    },
    {
      type: "collapsible",
      label: "SEO",
      admin: { initCollapsed: true },
      fields: [
        {
          name: "metaTitle",
          type: "text",
          admin: {
            description:
              "Optional <title> override. Falls back to the page title.",
          },
        },
        {
          name: "metaDescription",
          type: "textarea",
          admin: {
            description:
              "Optional meta description. Falls back to the excerpt.",
          },
        },
      ],
    },
  ],
};

export default Pages;
