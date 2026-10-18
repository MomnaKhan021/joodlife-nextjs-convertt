import { createHash } from "node:crypto";

/**
 * People who asked not to receive the abandoned-basket reminder ("You left
 * items in your basket — complete your order"). Only that email is blocked;
 * order, account and clinical emails still go out as normal.
 *
 * Stored as SHA-256 hashes of the lower-cased address, so the repository
 * never holds the address itself. To add someone:
 *   printf '%s' 'person@example.com' | tr 'A-Z' 'a-z' | shasum -a 256
 * and append the hash with the date and reason.
 */
const BASKET_REMINDER_OPT_OUTS = new Set<string>([
  // 2026-10-17: replied "Please stop sending these emails".
  "e4fab9d4f9d06794d0e617e2ce49a965898e5c5f54d1f34152c458302c3cad23",
]);

function hashEmail(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

/** True if this address asked not to receive abandoned-basket reminders. */
export function isOptedOutOfBasketReminders(email: string | null | undefined): boolean {
  if (!email) return false;
  return BASKET_REMINDER_OPT_OUTS.has(hashEmail(email));
}
