import type { CollectionConfig } from "payload";

import { isAdmin } from "../access/isAdmin";
import { isAdminOrSelf } from "../access/isAdminOrSelf";

/**
 * Orders. Created by /api/checkout — guest checkout is allowed (no
 * payment integration yet, this is the testing-phase flow), so the
 * `user` relation is optional. When a logged-in customer places the
 * order their id is attached automatically.
 *
 * Cart line items live in the `itemsJson` column (jsonb). We don't
 * use Payload's products array-of-relations because that requires
 * a join table that's tedious to keep in sync with our hand-written
 * schema.
 */
export const Orders: CollectionConfig = {
  slug: "orders",
  admin: {
    useAsTitle: "orderNumber",
    defaultColumns: [
      "orderNumber",
      "customerName",
      "customerEmail",
      "totalAmount",
      "status",
      "createdAt",
    ],
    group: "Commerce",
  },
  access: {
    create: () => true, // guest checkout allowed during testing phase
    read: isAdminOrSelf,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [
      ({ data, operation, req }) => {
        if (operation === "create") {
          if (!data.user && req.user) data.user = req.user.id;
          if (!data.orderNumber) {
            data.orderNumber = `JL-${Date.now().toString(36).toUpperCase()}`;
          }
        }
        return data;
      },
    ],
  },
  fields: [
    {
      name: "orderNumber",
      type: "text",
      unique: true,
      index: true,
      admin: { readOnly: true },
    },
    {
      type: "row",
      fields: [
        {
          name: "customerName",
          type: "text",
          admin: { width: "50%" },
        },
        {
          name: "customerEmail",
          type: "email",
          admin: { width: "50%" },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "customerPhone",
          type: "text",
          admin: { width: "50%" },
        },
        {
          name: "user",
          type: "relationship",
          relationTo: "users",
          admin: {
            width: "50%",
            description:
              "Optional — auto-set when a logged-in customer checks out.",
          },
        },
      ],
    },
    {
      name: "shippingAddress",
      type: "textarea",
      admin: { description: "Full delivery address." },
    },
    {
      name: "itemsJson",
      type: "json",
      label: "Items",
      admin: {
        description:
          'Cart contents at checkout. Array of { productId, slug, title, dose, price, quantity }.',
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "totalAmount",
          type: "number",
          required: true,
          min: 0,
          admin: { width: "33%", description: "£ total." },
        },
        {
          name: "discountAmount",
          type: "number",
          defaultValue: 0,
          min: 0,
          admin: { width: "33%" },
        },
        {
          name: "paymentMethod",
          type: "select",
          required: true,
          defaultValue: "test",
          options: [
            { label: "Test (no payment)", value: "test" },
            { label: "Card", value: "card" },
            { label: "PayPal", value: "paypal" },
            { label: "Apple Pay", value: "apple_pay" },
            { label: "Google Pay", value: "google_pay" },
            { label: "Bank transfer", value: "bank_transfer" },
          ],
          admin: { width: "33%" },
        },
      ],
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "pending",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Paid", value: "paid" },
        { label: "Shipped", value: "shipped" },
        { label: "Delivered", value: "delivered" },
        { label: "Cancelled", value: "cancelled" },
      ],
      admin: { position: "sidebar" },
    },
    {
      name: "notes",
      type: "textarea",
      admin: { description: "Customer notes added at checkout." },
    },
  ],
};

export default Orders;
