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

type PayloadLike = {
  db?: { drizzle?: { execute?: (q: unknown) => Promise<unknown> } };
};

/**
 * Self-heal at auth time: if an authenticated user's email is allowlisted but
 * their stored role isn't `admin`, fix the row right now and report true.
 *
 * Backstop for the onInit promotion — if a boot-time promotion is ever missed
 * (cold-start error, restored DB, etc.), the account still becomes admin the
 * moment it authenticates, instead of being locked out of the dashboard.
 */
export async function promoteIfAllowlisted(
  payload: unknown,
  user: { id: string | number; email?: string | null; role?: string | null },
): Promise<boolean> {
  if (user.role === "admin" || !isAllowlistedAdmin(user.email)) return false;
  const id = Number(user.id);
  if (!Number.isFinite(id)) return false;
  try {
    const drizzle = (payload as PayloadLike).db?.drizzle;
    if (!drizzle?.execute) return false;
    const { sql } = await import("drizzle-orm");
    await drizzle.execute(sql.raw(`UPDATE "users" SET role = 'admin' WHERE id = ${id}`));
    return true;
  } catch {
    return false; // never let the backstop break auth
  }
}
