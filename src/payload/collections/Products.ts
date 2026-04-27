import type { CollectionConfig } from "payload";

import { isAdmin } from "../access/isAdmin";
import { isPublic } from "../access/isLoggedIn";

/**
 * Storefront product. Drives both the /shop collection page and
 * each /shop/[slug] PDP. Two parallel ways to attach images/variants:
 *
 * 1. Native Payload arrays (preferred):
 *    - `images`  — array of upload-to-media rows (uploads via /admin)
 *    - `variants` — array of structured rows (size, colour, price,
 *      comparePrice, sku, stock)
 *
 * 2. URL-based fallbacks (used by the joodlife.com seed):
 *    - `heroImageUrl` (text), `galleryImageUrls` (json)
 *    - `variantsJson` (json)
 *
 * lib/products.ts prefers (1) when present, falls back to (2) so
 * existing seeded rows keep rendering while admins migrate them.
 */
export const Products: CollectionConfig = {
  slug: "products",
  admin: {
    useAsTitle: "title",
    defaultColumns: [
      "title",
      "displayOrder",
      "fromPrice",
      "category",
      "isActive",
    ],
    group: "Commerce",
  },
  access: {
    read: isPublic,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
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
      name: "tagline",
      type: "text",
      admin: {
        description:
          "Active ingredient or one-word eyebrow shown in the card pill (e.g. \"Tirzepatide\").",
      },
    },
    {
      name: "cardCopy",
      type: "textarea",
      admin: {
        description:
          "Short copy shown on the shop card (1–2 sentences). Falls back to description if empty.",
      },
    },
    {
      name: "description",
      type: "textarea",
      required: true,
      admin: {
        description: "Long description shown on the product detail page.",
      },
    },
    {
      name: "category",
      type: "select",
      required: true,
      defaultValue: "medication",
      options: [
        { label: "Medication", value: "medication" },
        { label: "Supplement", value: "supplement" },
        { label: "Accessory", value: "accessory" },
        { label: "Other", value: "other" },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "fromPrice",
          type: "number",
          min: 0,
          admin: {
            width: "33%",
            description: "Starting price (£) shown on the card.",
          },
        },
        {
          name: "comparePrice",
          type: "number",
          min: 0,
          admin: {
            width: "33%",
            description:
              "Optional MSRP / strike-through price shown next to the active price.",
          },
        },
        {
          name: "subscriptionPrice",
          type: "number",
          min: 0,
          admin: {
            width: "33%",
            description: "Optional ongoing subscription price (£).",
          },
        },
      ],
    },
    {
      name: "displayOrder",
      type: "number",
      defaultValue: 100,
      admin: {
        description: "Lower numbers appear first on /shop.",
      },
    },
    /* ---------------------------------------------------------------- */
    /* Product images — uploaded via the Media collection                */
    /* ---------------------------------------------------------------- */
    {
      name: "images",
      type: "array",
      label: "Product images",
      labels: { singular: "Image", plural: "Images" },
      admin: {
        description:
          "Upload product photos. The first image is the hero shot used on /shop and the PDP gallery.",
      },
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          required: true,
        },
        {
          name: "alt",
          type: "text",
          admin: {
            description:
              "Optional override for the image's alt text (defaults to the Media row's alt).",
          },
        },
      ],
    },
    /* ---------------------------------------------------------------- */
    /* Variants — size / colour / dosage rows with their own pricing     */
    /* ---------------------------------------------------------------- */
    {
      name: "variants",
      type: "array",
      label: "Variants",
      labels: { singular: "Variant", plural: "Variants" },
      admin: {
        description:
          "Each row is a buyable option (e.g. 5 mg / Black / Large). Leave empty for a single-price product.",
      },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "label",
              type: "text",
              required: true,
              admin: {
                width: "33%",
                description: 'e.g. "5 mg" or "Large"',
              },
            },
            {
              name: "size",
              type: "text",
              admin: { width: "33%" },
            },
            {
              name: "color",
              type: "text",
              admin: { width: "33%", description: "Optional colour name." },
            },
          ],
        },
        {
          type: "row",
          fields: [
            {
              name: "price",
              type: "number",
              required: true,
              min: 0,
              admin: { width: "50%" },
            },
            {
              name: "comparePrice",
              type: "number",
              min: 0,
              admin: {
                width: "50%",
                description: "Strike-through price for this variant.",
              },
            },
          ],
        },
        {
          type: "row",
          fields: [
            {
              name: "sku",
              type: "text",
              admin: { width: "50%" },
            },
            {
              name: "stock",
              type: "number",
              defaultValue: 0,
              min: 0,
              admin: { width: "50%" },
            },
          ],
        },
      ],
    },
    /* ---------------------------------------------------------------- */
    /* Card styling                                                      */
    /* ---------------------------------------------------------------- */
    {
      type: "row",
      fields: [
        {
          name: "badge",
          type: "text",
          admin: {
            width: "50%",
            description: 'Optional pill badge, e.g. "Best seller".',
          },
        },
        {
          name: "footerColor",
          type: "text",
          defaultValue: "#142e2a",
          admin: {
            width: "50%",
            description:
              "Hex code for the price/CTA strip on the card (matches the image's dominant colour).",
          },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "ratingValue",
          type: "number",
          min: 0,
          max: 5,
          admin: { width: "50%" },
        },
        {
          name: "ratingCount",
          type: "number",
          min: 0,
          admin: { width: "50%" },
        },
      ],
    },
    /* ---------------------------------------------------------------- */
    /* URL-based fallbacks (collapsible advanced section)                */
    /* ---------------------------------------------------------------- */
    {
      type: "collapsible",
      label: "URL-based image fallback (advanced)",
      admin: { initCollapsed: true },
      fields: [
        {
          name: "heroImageUrl",
          type: "text",
          admin: {
            description:
              "Used only when no Product images are uploaded above. Useful for importing existing CDN URLs.",
          },
        },
        {
          name: "galleryImageUrls",
          type: "json",
          admin: {
            description:
              'JSON array of image URLs, e.g. ["https://…/1.png", "https://…/2.png"]',
          },
        },
        {
          name: "variantsJson",
          type: "json",
          label: "Variants (legacy JSON)",
          admin: {
            description:
              "Legacy variants list. Used only when the Variants array above is empty.",
          },
        },
      ],
    },
    {
      name: "isActive",
      type: "checkbox",
      defaultValue: true,
      admin: {
        position: "sidebar",
        description: "Inactive products are hidden from the storefront.",
      },
    },
  ],
};

export default Products;
