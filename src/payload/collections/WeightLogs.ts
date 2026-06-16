import type { CollectionConfig } from "payload";

import { isAdmin } from "../access/isAdmin";
import { isAdminOrSelf } from "../access/isAdminOrSelf";

/**
 * WeightLogs — customer-entered weight measurements over time.
 *
 * Each row is one weight reading a signed-in customer logged from the
 * account page (`/profile/weight-logs`). Together they form the history
 * that powers the trend chart, summary cards and gain/loss indicator.
 *
 * Created via `POST /api/weight-logs` (which sets `user` from the session
 * and uses the local API with overrideAccess), so:
 *   - create — any signed-in user (the route owns identity)
 *   - read   — admin or the owning customer
 *   - update/delete — admin only
 *
 * On create we sync the entry to HubSpot as a Note on the customer's
 * contact (fire-and-forget). Notes are append-only, so history is
 * preserved and re-runs never duplicate (we only sync on `create`).
 */
export const WeightLogs: CollectionConfig = {
  slug: "weight-logs",
  admin: {
    useAsTitle: "customerEmail",
    defaultColumns: ["customerEmail", "weightKg", "loggedAt"],
    group: "Customers",
  },
  access: {
    create: ({ req: { user } }) => Boolean(user),
    read: isAdminOrSelf,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
      admin: { description: "The customer this weight entry belongs to." },
    },
    {
      type: "row",
      fields: [
        {
          name: "customerEmail",
          type: "email",
          required: true,
          index: true,
          admin: { width: "50%" },
        },
        {
          name: "weightKg",
          type: "number",
          required: true,
          min: 20,
          max: 500,
          admin: { width: "25%", step: 0.1, description: "Weight in kg." },
        },
        {
          name: "loggedAt",
          type: "date",
          required: true,
          defaultValue: () => new Date().toISOString(),
          admin: {
            width: "25%",
            date: { pickerAppearance: "dayAndTime" },
          },
        },
      ],
    },
  ],
  hooks: {
    afterChange: [
      // Sync each NEW weight entry to HubSpot as a note on the contact.
      // Fire-and-forget so a HubSpot hiccup never blocks saving the weight;
      // only on `create` so re-saves can't create duplicate notes.
      async ({ doc, operation, req }) => {
        if (operation !== "create" || !doc?.customerEmail) return doc;
        try {
          const { fireHubSpot, syncWeightLogToContact } = await import(
            "@/lib/hubspot"
          );
          const customerId =
            typeof doc.user === "object" && doc.user
              ? (doc.user as { id?: unknown }).id
              : doc.user;
          // Store the weight on the customer's HubSpot contact as properties
          // (latest weight, date, appended history). Uses only the
          // contacts.write scope — no notes scope required.
          void fireHubSpot("weightlog:contact", () =>
            syncWeightLogToContact({
              email: String(doc.customerEmail),
              weightKg: Number(doc.weightKg),
              loggedAt:
                typeof doc.loggedAt === "string" ? doc.loggedAt : null,
              customerId: customerId as string | number | null,
            })
          );
        } catch (err) {
          req.payload.logger?.error?.({
            msg: "Weight-log HubSpot sync failed to dispatch",
            err,
          });
        }
        return doc;
      },
    ],
  },
};

export default WeightLogs;
