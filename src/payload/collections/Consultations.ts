import type { CollectionConfig } from "payload";

import { isAdmin } from "../access/isAdmin";

/**
 * Consultations — quiz/health-questionnaire responses captured before
 * a customer can buy a treatment. Mirrors joodlife.com's
 * /pages/consultation flow.
 *
 * Public POST creates a row (anonymous starts allowed). Admin-only
 * read/update so customer health data is never exposed publicly.
 *
 * answers is a free-form JSONB column so the question schema can
 * evolve without migrations — UI knows the keys.
 */
export const Consultations: CollectionConfig = {
  slug: "consultations",
  admin: {
    useAsTitle: "email",
    defaultColumns: [
      "email",
      "fullName",
      "productSlug",
      "status",
      "createdAt",
    ],
    group: "Commerce",
  },
  access: {
    create: () => true, // anonymous customers start a consultation
    read: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "fullName",
          type: "text",
          admin: { width: "50%" },
        },
        {
          name: "email",
          type: "email",
          admin: { width: "50%" },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "phone",
          type: "text",
          admin: { width: "50%" },
        },
        {
          name: "dateOfBirth",
          type: "text",
          admin: { width: "50%", description: "ISO date YYYY-MM-DD." },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "productSlug",
          type: "text",
          admin: {
            width: "50%",
            description:
              "The product the customer was viewing when they started the quiz.",
          },
        },
        {
          name: "dose",
          type: "text",
          admin: {
            width: "50%",
            description: "Selected dosage at the time the quiz was started.",
          },
        },
      ],
    },
    {
      name: "answers",
      type: "json",
      admin: {
        description:
          "Full quiz answers as JSON. The shape is controlled by the consultation flow on the storefront.",
      },
    },
    {
      name: "status",
      type: "select",
      defaultValue: "submitted",
      required: true,
      options: [
        { label: "Draft (in progress)", value: "draft" },
        { label: "Submitted", value: "submitted" },
        { label: "Reviewed", value: "reviewed" },
        { label: "Approved", value: "approved" },
        { label: "Rejected", value: "rejected" },
      ],
      admin: { position: "sidebar" },
    },
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      admin: {
        position: "sidebar",
        description:
          "Optional — only set if the user was logged in when they completed the quiz.",
      },
    },
  ],
};

export default Consultations;
