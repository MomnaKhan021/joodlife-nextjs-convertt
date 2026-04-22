import type { CollectionConfig } from "payload";

import { isAdmin } from "../access/isAdmin";
import { isLoggedIn } from "../access/isLoggedIn";
import { normalizeDiscount } from "../hooks/validateDiscount";

export const Discounts: CollectionConfig = {
  slug: "discounts",
  admin: {
    useAsTitle: "code",
    defaultColumns: ["code", "type", "value", "expiryDate", "isActive"],
    group: "Commerce",
  },
  access: {
    // Logged-in users can read (to validate codes); only admins can manage.
    read: isLoggedIn,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeValidate: [normalizeDiscount],
  },
  fields: [
    {
      name: "code",
      type: "text",
      required: true,
      unique: true,
      index: true,
    },
    {
      type: "row",
      fields: [
        {
          name: "type",
          type: "select",
          required: true,
          defaultValue: "percentage",
          options: [
            { label: "Percentage (%)", value: "percentage" },
            { label: "Fixed amount", value: "fixed" },
          ],
          admin: { width: "50%" },
        },
        {
          name: "value",
          type: "number",
          required: true,
          min: 0,
          admin: { width: "50%" },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "expiryDate",
          type: "date",
          admin: {
            date: { pickerAppearance: "dayAndTime" },
            width: "50%",
          },
        },
        {
          name: "usageLimit",
          type: "number",
          min: 0,
          admin: {
            width: "50%",
            description: "Leave empty for unlimited uses.",
          },
        },
      ],
    },
    {
      name: "usageCount",
      type: "number",
      defaultValue: 0,
      min: 0,
      admin: {
        readOnly: true,
        description: "Incremented automatically when the code is redeemed.",
      },
    },
    {
      name: "isActive",
      type: "checkbox",
      defaultValue: true,
      admin: { position: "sidebar" },
    },
  ],
};

export default Discounts;
