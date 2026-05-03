import type { CollectionConfig } from "payload";

import { isAdmin } from "../access/isAdmin";

/**
 * Blog posts.
 *
 * Authors write in the Lexical rich-text editor (same as Payload's
 * default content surface). Storefront `/blog` and `/blog/[slug]`
 * render published posts only — drafts are admin-only.
 *
 * Fields:
 *   - title, slug (auto from title), excerpt
 *   - content (lexical rich text)
 *   - heroImage (upload to media)
 *   - author (relation → users; defaults to the editing admin)
 *   - category (select), tags (text array)
 *   - status (draft/published), publishedAt (auto-set on first publish)
 *   - SEO collapsible: metaTitle, metaDescription
 *
 * Access:
 *   - read: published posts are public; drafts admin-only
 *   - create/update/delete: admin-only
 */
export const Posts: CollectionConfig = {
  slug: "posts",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "status", "category", "publishedAt"],
    group: "Content",
    description:
      "Articles shown on /blog. Save as draft while writing; switch status to Published when ready.",
  },
  access: {
    // Public read for published posts; admins see everything.
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
      // Stamp publishedAt when a post first transitions to published.
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
          "URL-friendly identifier. Auto-generated from title if empty.",
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
    },
    {
      name: "excerpt",
      type: "textarea",
      admin: {
        description:
          "Short summary shown on the blog list and in social previews. 1–3 sentences.",
      },
    },
    {
      name: "heroImage",
      type: "upload",
      relationTo: "media",
      admin: {
        description:
          "Featured image. Used as the card thumbnail on /blog and the hero on the article page.",
      },
    },
    {
      name: "content",
      type: "richText",
      admin: {
        description:
          "The article body. Supports headings, lists, links, images. Leave empty if you're using imported HTML below.",
      },
    },
    {
      name: "category",
      type: "select",
      defaultValue: "weight-loss",
      options: [
        { label: "Weight loss", value: "weight-loss" },
        { label: "Nutrition", value: "nutrition" },
        { label: "Lifestyle", value: "lifestyle" },
        { label: "Science", value: "science" },
        { label: "Company news", value: "company-news" },
        { label: "Other", value: "other" },
      ],
      admin: { position: "sidebar" },
    },
    {
      name: "tags",
      type: "array",
      labels: { singular: "Tag", plural: "Tags" },
      admin: {
        position: "sidebar",
        description: "Free-form tags shown under the article header.",
      },
      fields: [{ name: "tag", type: "text", required: true }],
    },
    {
      name: "author",
      type: "relationship",
      relationTo: "users",
      admin: {
        position: "sidebar",
        description:
          "Article author. Defaults to whichever admin created the post.",
      },
      hooks: {
        beforeChange: [
          ({ value, req, operation }) => {
            if (operation === "create" && !value && req.user?.id) {
              return req.user.id;
            }
            return value;
          },
        ],
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
        description: "Drafts are hidden from /blog.",
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
      label: "Imported / external content (advanced)",
      admin: { initCollapsed: true },
      fields: [
        {
          name: "bodyHtml",
          type: "textarea",
          admin: {
            rows: 12,
            description:
              "Raw HTML body, set by the Shopify importer. When present this is rendered on /blog/[slug] instead of the Lexical content above. To migrate to the Lexical editor, copy the relevant text into Content and clear this field.",
          },
        },
        {
          name: "heroImageUrl",
          type: "text",
          admin: {
            description:
              "External hero image URL — used when no Hero image is uploaded above. Set automatically by importers.",
          },
        },
        {
          name: "shopifyArticleId",
          type: "text",
          unique: true,
          index: true,
          admin: {
            readOnly: true,
            description:
              "Shopify article ID. Set by the importer to enable upserts on re-import. Don't edit by hand.",
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
              "Optional <title> override. Falls back to the article title.",
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

export default Posts;
