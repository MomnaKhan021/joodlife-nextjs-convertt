import type { Access, FieldAccess } from "payload";

/** Collection-level access: allow only authenticated admins. */
export const isAdmin: Access = ({ req: { user } }) => {
  return Boolean(user && user.role === "admin");
};

/** Field-level access variant with the same rule. */
export const isAdminField: FieldAccess = ({ req: { user } }) => {
  return Boolean(user && user.role === "admin");
};
