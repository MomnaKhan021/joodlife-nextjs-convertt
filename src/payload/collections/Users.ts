import type { CollectionConfig } from "payload";

import { isAdmin, isAdminField } from "../access/isAdmin";
import { isAdminOrSelf } from "../access/isAdminOrSelf";

/**
 * Users — Payload's auth collection.
 *
 * Built-in fields exposed by Payload's `auth: {}` block (no need to
 * declare them in `fields`):
 *   - email             (the credential)
 *   - password          (write-only; hashed automatically)
 *   - the password reset / change-password flow at the top of the
 *     edit screen, plus an "Update my password" form on the user's
 *     own account page.
 *
 * Custom fields below: name, role (admin-only), phone, avatar.
 *
 * Access:
 *   - create  — public (storefront signup); tighten with email
 *               verification or a captcha in production
 *   - read    — admin or self
 *   - update  — admin or self
 *   - delete  — admin only
 *   - admin   — admin role required to even render /admin
 *
 * Field-level access on `role` ensures only an existing admin can
 * promote / demote anyone — a customer editing themselves sees the
 * field as read-only.
 */
export const Users: CollectionConfig = {
  slug: "users",
  auth: {
    tokenExpiration: 60 * 60 * 24 * 7, // 1 week
    cookies: {
      sameSite: "Lax",
      secure: process.env.NODE_ENV === "production",
    },
  },
  admin: {
    useAsTitle: "email",
    defaultColumns: ["name", "email", "phone", "role"],
    group: "Customers",
  },
  access: {
    create: () => true,
    read: isAdminOrSelf,
    update: isAdminOrSelf,
    delete: isAdmin,
    admin: ({ req: { user } }) => user?.role === "admin",
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
          admin: { width: "50%" },
        },
        {
          name: "phone",
          type: "text",
          admin: {
            width: "50%",
            description: "Mobile / contact number (optional).",
          },
        },
      ],
    },
    {
      name: "avatar",
      type: "upload",
      relationTo: "media",
      admin: {
        description:
          "Profile image. Shown in the admin nav bar and on the storefront account page.",
      },
    },
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "customer",
      options: [
        { label: "Admin", value: "admin" },
        { label: "Customer", value: "customer" },
      ],
      admin: {
        position: "sidebar",
        description:
          "Admins can manage products, orders, and other users.",
      },
      access: {
        // Only admins can change a user's role — customers see it read-only.
        create: isAdminField,
        update: isAdminField,
      },
    },
  ],
};

export default Users;
