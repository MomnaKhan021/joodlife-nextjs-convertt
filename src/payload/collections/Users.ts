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
    forgotPassword: {
      // Point the reset link at the STOREFRONT reset page rather than
      // Payload's default `/admin/reset/:token` route, so customers (who
      // never see the admin panel) land on a branded page.
      generateEmailSubject: () => "Reset your JoodLife password",
      generateEmailHTML: async (args) => {
        const token = args?.token ?? "";
        const siteUrl =
          args?.req?.payload?.config?.serverURL ||
          process.env.NEXT_PUBLIC_SERVER_URL ||
          "https://joodlife.com";
        const resetUrl = `${siteUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(
          token
        )}`;
        // Never throw: a failure building the HTML would otherwise propagate up
        // through Payload's forgot-password operation and fail the request.
        try {
          const name =
            (args?.user as { name?: string | null } | undefined)?.name ?? null;
          const { resetPasswordEmailHTML } = await import(
            "@/lib/account-email"
          );
          return resetPasswordEmailHTML({ siteUrl, token, name });
        } catch {
          return `<p>Reset your JoodLife password using the link below (expires in 1 hour):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`;
        }
      },
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
  hooks: {
    afterChange: [
      // Mirror to HubSpot on signup + admin edits. Fire-and-forget so
      // user-facing flows aren't blocked by HubSpot latency.
      async ({ doc, operation }) => {
        if (operation !== "create" && operation !== "update") return doc;
        if (!doc?.email) return doc;
        try {
          const { fireHubSpot, upsertContact } = await import("@/lib/hubspot");
          const [first, ...rest] = String(doc.name ?? "").split(" ");
          void fireHubSpot("users:contact", () =>
            upsertContact({
              email: String(doc.email),
              firstName: first || null,
              lastName: rest.join(" ") || null,
              phone: doc.phone ?? null,
              extra: {
                jood_user_id: doc.id,
                jood_role: doc.role ?? "customer",
              },
            })
          );
        } catch {
          // Never let HubSpot failures break user create/update
        }
        return doc;
      },
      // Send the account-creation ("welcome") email exactly once, on create.
      //
      // IMPORTANT: this must be AWAITED, not fire-and-forget. On Vercel
      // serverless the function freezes the moment the response is sent, so a
      // voided/background send is killed before it reaches Brevo (which is why
      // welcome emails never arrived in production while reset emails — which
      // Payload awaits inline — did). The send is bounded (the email adapter
      // wrapper times out in ~7s) and never throws, so awaiting it can't slow
      // signup meaningfully or break account creation.
      async ({ doc, operation, req }) => {
        if (operation !== "create" || !doc?.email) return doc;
        try {
          const { sendWelcomeEmail } = await import("@/lib/account-email");
          await sendWelcomeEmail(req.payload, {
            email: String(doc.email),
            name: doc.name ?? null,
          });
        } catch (err) {
          req.payload.logger.error({
            msg: "Welcome email failed to send",
            err,
          });
        }
        return doc;
      },
    ],
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
        { label: "Staff (limited access)", value: "staff" },
        { label: "Customer", value: "customer" },
      ],
      admin: {
        position: "sidebar",
        description:
          "Admins manage everything. Staff see only the dashboard sections granted in Permissions below.",
      },
      access: {
        // Only admins can change a user's role — customers see it read-only.
        create: isAdminField,
        update: isAdminField,
      },
    },
    {
      name: "permissions",
      type: "json",
      admin: {
        position: "sidebar",
        description:
          "For staff only: the dashboard sections this user may access (array of section keys, e.g. [\"analytics\",\"orders\"]). Admins have full access regardless.",
      },
      access: {
        // Only admins can grant/revoke section permissions.
        create: isAdminField,
        update: isAdminField,
      },
    },
  ],
};

export default Users;
