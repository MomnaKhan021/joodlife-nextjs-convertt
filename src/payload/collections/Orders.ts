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
      async ({ data, operation, req }) => {
        if (operation === "create") {
          if (!data.user && req.user) data.user = req.user.id;
          if (!data.orderNumber) {
            try {
              const drizzle = (
                req.payload.db as unknown as {
                  drizzle?: { execute?: (q: unknown) => Promise<unknown> };
                }
              ).drizzle;
              if (drizzle?.execute) {
                const { sql } = await import("drizzle-orm");
                const { nextOrderNumber } = await import("@/lib/orderNumber");
                data.orderNumber = await nextOrderNumber(
                  drizzle as { execute: (q: unknown) => Promise<unknown> },
                  sql as { raw: (s: string) => unknown },
                );
              }
            } catch {
              /* fall through */
            }
            if (!data.orderNumber) data.orderNumber = `JL${Date.now()}`;
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
    {
      name: "hubspotDealId",
      type: "text",
      index: true,
      admin: {
        position: "sidebar",
        readOnly: true,
        description:
          "HubSpot deal id, populated by the /admin-tools/hubspot-sync/orders pull. Used to upsert on re-sync.",
      },
    },
    /* ──────────────  Stripe linkage  ────────────── */
    {
      name: "stripePaymentIntentId",
      type: "text",
      index: true,
      admin: {
        position: "sidebar",
        readOnly: true,
        description:
          "Stripe PaymentIntent (pi_…) — set after a Stripe Checkout completes successfully.",
      },
    },
    {
      name: "stripeSessionId",
      type: "text",
      index: true,
      admin: {
        position: "sidebar",
        readOnly: true,
        description:
          "Stripe Checkout Session (cs_…) — set when an order is sent to Stripe.",
      },
    },
    {
      name: "stripeCustomerId",
      type: "text",
      index: true,
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "Stripe customer (cus_…), if one was created.",
      },
    },
    {
      name: "paymentStatus",
      type: "select",
      defaultValue: "unpaid",
      options: [
        { label: "Unpaid", value: "unpaid" },
        { label: "Awaiting payment", value: "awaiting" },
        { label: "Paid", value: "paid" },
        { label: "Refunded", value: "refunded" },
        { label: "Failed", value: "failed" },
      ],
      admin: {
        position: "sidebar",
        description:
          "Live payment state independent of fulfilment status. Webhook-driven.",
      },
    },
    /* ──────────────  Audit (read-only) ────────────── */
    {
      name: "ipAddress",
      type: "text",
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "Client IP at checkout — audit only.",
      },
    },
    {
      name: "userAgent",
      type: "text",
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "Client User-Agent at checkout — audit only.",
      },
    },
  ],
};

export default Orders;
