import type { Access } from "payload";

/**
 * Admins can read/update all rows. A customer can only access rows that
 * belong to them (via a `user` relationship field OR their own user row).
 *
 * Use this on the Users collection to let people see their own profile
 * and on Orders to let customers see their own orders.
 */
export const isAdminOrSelf: Access = ({ req: { user }, id }) => {
  if (!user) return false;
  if (user.role === "admin") return true;

  // Querying their own user row
  if (id && String(id) === String(user.id)) return true;

  // Constrain list queries to rows the user owns
  return {
    user: {
      equals: user.id,
    },
  };
};
