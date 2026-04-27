import type { CollectionConfig } from "payload";

import { isAdmin } from "../access/isAdmin";
import { isPublic } from "../access/isLoggedIn";

/**
 * Storefront product. Drives both the /shop collection page and
 * each /shop/[slug] PDP. Image-heavy fields are stored as plain
 * URLs (or JSON arrays of URLs) rather than upload-relations so
 * Payload's Drizzle adapter doesn't need separate join tables —
 * everything lives in one row of the `products` table.
 *
 * Column-name mapping (Payload snake_cases field names):
 *   tagline           -> tagline
 *   cardCopy          -> card_copy
 *   fromPrice         -> from_price
 *   subscriptionPrice -> subscription_price
 *   displayOrder      -> display_order
 *   heroImageUrl      -> hero_image_url
 *   galleryImageUrls  -> gallery_image_urls (jsonb)
 *   variantsJson      -> variants_json (jsonb)
 *   footerColor       -> footer_color
 *   ratingValue       -> rating_value
 *   ratingCount       -> rating_count
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
    read: isPublic, // storefront needs to read products
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
          name: "subscriptionPrice",
          type: "number",
          min: 0,
          admin: {
            width: "33%",
            description: "Optional ongoing subscription price (£).",
          },
        },
        {
          name: "displayOrder",
          type: "number",
          defaultValue: 100,
          admin: {
            width: "33%",
            description: "Lower numbers appear first on /shop.",
          },
        },
      ],
    },
    {
      name: "heroImageUrl",
      type: "text",
      admin: {
        description:
          "Full URL or /uploads path. The image's brand colour fills the card backdrop.",
      },
    },
    {
      name: "galleryImageUrls",
      type: "json",
      admin: {
        description:
          'PDP gallery images as a JSON array of URLs, e.g. ["https://…/1.png", "https://…/2.png"].',
      },
    },
    {
      name: "variantsJson",
      type: "json",
      label: "Variants",
      admin: {
        description:
          'Array of dose options, e.g. [{"label":"5 mg","price":153,"sku":"MNJ-5"}]',
      },
    },
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
