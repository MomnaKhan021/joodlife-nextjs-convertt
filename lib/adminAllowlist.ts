/**
 * Admin allowlist — emails that should always have the `admin` role.
 *
 * Used in two places:
 *   - payload.config onInit: promotes any EXISTING account with one of these
 *     emails to admin on every boot (so grants survive redeploys/restores).
 *   - Users beforeChange hook: forces role = admin whenever one of these
 *     accounts is created or updated (so a fresh signup is admin immediately).
 *
 * It never creates accounts or sets passwords — the person must have (or
 * create, via normal signup) their own account; this only assigns the role.
 */
export const ADMIN_ALLOWLIST: ReadonlySet<string> = new Set(
  [
    "syed@convertt.co",
    "support@convertt.co",
    "momnafatima021@gmail.com",
    "jav@ihsanpharma.com",
    "zahhaadk@hotmail.co.uk",
  ].map((e) => e.toLowerCase()),
);

export function isAllowlistedAdmin(email: string | null | undefined): boolean {
  return !!email && ADMIN_ALLOWLIST.has(email.trim().toLowerCase());
}
