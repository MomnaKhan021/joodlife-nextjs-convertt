import type { CollectionConfig } from "payload";

import { isAdmin } from "../access/isAdmin";

/**
 * Inventory — pharmacy stock batches.
 *
 * Each row is one batch of a medicine held in stock, recorded by the
 * team managing dispensing. Powers the /admin-tools/inventory screen and
 * (later) the dispensing/dispatch label flow. Admin-only across the board.
 *
 * Fields:
 *   - medicineName  : the product/medicine this batch is for
 *   - batchNumber   : the supplier batch reference (entered manually)
 *   - batchQuantity : units in the batch (chosen from a fixed dropdown)
 *   - expiryDate    : batch expiry (calendar picker; can be a future date)
 */
export const Inventory: CollectionConfig = {
  slug: "inventory",
  admin: {
    useAsTitle: "medicineName",
    defaultColumns: ["medicineName", "batchNumber", "batchQuantity", "expiryDate"],
    group: "Pharmacy",
  },
  access: {
    create: isAdmin,
    read: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "medicineName",
          type: "text",
          required: true,
          index: true,
          admin: { width: "40%", description: "Medicine / product name." },
        },
        {
          name: "batchNumber",
          type: "text",
          required: true,
          index: true,
          admin: { width: "30%", description: "Supplier batch reference." },
        },
        {
          name: "batchQuantity",
          type: "number",
          required: true,
          min: 0,
          admin: { width: "15%", description: "Units in this batch." },
        },
        {
          name: "expiryDate",
          type: "date",
          required: true,
          admin: {
            width: "15%",
            date: { pickerAppearance: "dayOnly", displayFormat: "dd/MM/yyyy" },
            description: "Batch expiry date.",
          },
        },
      ],
    },
  ],
};

export default Inventory;
