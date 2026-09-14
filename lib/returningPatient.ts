import "server-only";

import { cache } from "react";

import { getCurrentUser } from "@/lib/auth";
import { getOrdersForEmail } from "@/lib/accountData";

/**
 * True when the signed-in user has at least one real order — the same rule
 * the home page uses to switch CTAs from "Check Your Eligibility" to
 * "Reorder" (anything not cancelled / refunded / failed counts, covering
 * awaiting / unpaid / pending / paid / shipped / delivered).
 *
 * Wrapped in React `cache()` so it runs at most once per request even when
 * several components ask.
 */
export const getIsReturningPatient = cache(async (): Promise<boolean> => {
  const user = await getCurrentUser();
  if (!user?.email) return false;
  const orders = await getOrdersForEmail(user.email);
  return orders.some(
    (o) =>
      o.status !== "cancelled" &&
      o.paymentStatus !== "refunded" &&
      o.paymentStatus !== "failed",
  );
});
