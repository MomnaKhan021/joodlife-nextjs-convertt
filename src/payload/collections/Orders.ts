import type { CollectionConfig } from "payload";

import { isAdmin } from "../access/isAdmin";
import { isAdminOrSelf } from "../access/isAdminOrSelf";
import { isLoggedIn } from "../access/isLoggedIn";
import { reduceStockAfterOrder } from "../hooks/reduceStock";

export const Orders: CollectionConfig = {
  slug: "orders",
  admin: {
    useAsTitle: "orderNumber",
    defaultColumns: ["orderNumber", "user", "totalAmount", "status", "createdAt"],
    group: "Commerce",
  },
  access: {
    // Authenticated users can create their own orders; reads are scoped
    // per-user (admins see everything).
    create: isLoggedIn,
    read: isAdminOrSelf,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [
      ({ data, operation, req }) => {
        if (operation === "create") {
          // Attach the current user if the client didn't send one
          if (!data.user && req.user) data.user = req.user.id;
          // Short, human-friendly order number
          if (!data.orderNumber) {
            data.orderNumber = `JL-${Date.now().toString(36).toUpperCase()}`;
          }
        }
        return data;
      },
    ],
    afterChange: [reduceStockAfterOrder],
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
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
      admin: { position: "sidebar" },
    },
    {
      name: "products",
      type: "array",
      minRows: 1,
      required: true,
      fields: [
        {
          name: "product",
          type: "relationship",
          relationTo: "products",
          required: true,
        },
        {
          name: "quantity",
          type: "number",
          required: true,
          min: 1,
          defaultValue: 1,
        },
        {
          name: "priceAtPurchase",
          type: "number",
          required: true,
          min: 0,
          admin: {
            description: "Unit price captured at checkout.",
          },
        },
      ],
    },
    {
      name: "discount",
      type: "relationship",
      relationTo: "discounts",
      admin: { position: "sidebar" },
    },
    {
      name: "discountAmount",
      type: "number",
      defaultValue: 0,
      min: 0,
    },
    {
      name: "totalAmount",
      type: "number",
      required: true,
      min: 0,
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
      name: "paymentMethod",
      type: "select",
      required: true,
      defaultValue: "card",
      options: [
        { label: "Card", value: "card" },
        { label: "PayPal", value: "paypal" },
        { label: "Apple Pay", value: "apple_pay" },
        { label: "Google Pay", value: "google_pay" },
        { label: "Bank transfer", value: "bank_transfer" },
      ],
    },
    {
      name: "notes",
      type: "textarea",
    },
  ],
};

export default Orders;
