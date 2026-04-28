import Link from "next/link";

/**
 * Renders in Payload's app-header where the breadcrumb begins.
 * Replaces the previous "J" badge with a plain "Dashboard" text link
 * that takes admins back to /admin in one click.
 */
export function Icon() {
  return (
    <Link href="/admin" className="jood-admin-home">
      Dashboard
    </Link>
  );
}

export default Icon;
