import type { CollectionConfig } from "payload";

import { isAdmin } from "../access/isAdmin";
import { isPublic } from "../access/isLoggedIn";

export const Products: CollectionConfig = {
  slug: "products",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "price", "stock", "category", "isActive"],
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
      admin: {
        description: "URL-friendly identifier. Auto-generated from title if empty.",
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
      name: "description",
      type: "textarea",
      required: true,
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
            description: "Original/MSRP price for strike-through display.",
          },
        },
      ],
    },
    {
      name: "images",
      type: "array",
      minRows: 1,
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          required: true,
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "sku",
          type: "text",
          unique: true,
          index: true,
          admin: {
            width: "50%",
            description:
              "Main SKU. Optional if the product only sells through variants.",
          },
        },
        {
          name: "stock",
          type: "number",
          defaultValue: 0,
          min: 0,
          admin: {
            width: "50%",
            description:
              "Default stock. Ignored when variants are configured — use per-variant stock instead.",
          },
        },
      ],
    },
    {
      name: "variants",
      type: "array",
      label: "Variants (dose / size)",
      admin: {
        description:
          "Add one row per option (e.g. 2.5 mg, 5 mg). Leave empty for a single-price product.",
      },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "label",
              type: "text",
              required: true,
              admin: { width: "40%" },
            },
            {
              name: "price",
              type: "number",
              required: true,
              min: 0,
              admin: { width: "30%" },
            },
            {
              name: "comparePrice",
              type: "number",
              min: 0,
              admin: { width: "30%" },
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
    {
      name: "category",
      type: "select",
      required: true,
      options: [
        { label: "Medication", value: "medication" },
        { label: "Supplement", value: "supplement" },
        { label: "Accessory", value: "accessory" },
        { label: "Other", value: "other" },
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
