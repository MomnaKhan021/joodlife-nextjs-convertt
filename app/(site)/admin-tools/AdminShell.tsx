"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/* Shopify-style admin shell: fixed left sidebar + content area.
   Collapses to a slide-in drawer on mobile (hamburger toggle). */

type NavItem = {
  label: string;
  href: string;
  match: (path: string, type: string | null) => boolean;
  icon: React.ReactNode;
  badgeType?: string;
  /** Section key for staff-permission filtering. Items without a key
   *  (e.g. Home) are admin-only. */
  section?: string;
};

const I = (d: string) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d={d} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const NAV: NavItem[] = [
  {
    label: "Home",
    href: "/admin-tools",
    match: (p) => p === "/admin-tools",
    icon: I("M4 11l8-7 8 7M6 9.5V20h12V9.5"),
  },
  {
    label: "Analytics",
    href: "/admin-tools/analytics",
    match: (p) => p.startsWith("/admin-tools/analytics"),
    section: "analytics",
    icon: I("M4 20V10M10 20V4M16 20v-7M21 20H3"),
  },
  {
    label: "Orders",
    href: "/admin-tools/data-browser?type=orders",
    match: (_p, t) => t === "orders",
    badgeType: "orders",
    section: "orders",
    icon: I("M6 7h12l1 13H5L6 7zM9 9V6a3 3 0 0 1 6 0v3"),
  },
  {
    label: "Clinical Check",
    href: "/admin-tools/clinical-queue",
    match: (p) => p.startsWith("/admin-tools/clinical-queue"),
    badgeType: "clinical",
    section: "clinical",
    icon: I("M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"),
  },
  {
    label: "To Dispatch",
    href: "/admin-tools/dispensing-queue",
    match: (p) => p.startsWith("/admin-tools/dispensing-queue"),
    section: "dispensing",
    badgeType: "dispensing",
    icon: I("M6 9V4h12v5M6 18H4a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2M8 14h8v6H8v-6z"),
  },
  {
    label: "Dispatched",
    href: "/admin-tools/dispatching",
    match: (p) => p.startsWith("/admin-tools/dispatching"),
    section: "dispatching",
    badgeType: "dispatching",
    icon: I("M16 3h5v5M21 3l-9 9M3 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"),
  },
  {
    label: "Rejected",
    href: "/admin-tools/rejected",
    match: (p) => p.startsWith("/admin-tools/rejected"),
    section: "clinical",
    badgeType: "rejected",
    icon: I("M10 11v6M14 11v6M4 7h16M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"),
  },
  {
    label: "Abandoned Checkout",
    href: "/admin-tools/marketing-queue",
    match: (p) => p.startsWith("/admin-tools/marketing-queue"),
    section: "clinical",
    badgeType: "marketing",
    icon: I("M3 11l18-8-8 18-2-8-8-2z"),
  },
  {
    label: "Products",
    href: "/admin-tools/data-browser?type=products",
    match: (p, t) => t === "products" || p.startsWith("/admin-tools/products"),
    section: "products",
    badgeType: "products",
    icon: I("M20.6 13.4L13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2A2 2 0 0 1 3 12V4h8a2 2 0 0 1 1.4.6l8.2 8.2a2 2 0 0 1 0 2.6zM7.5 7.5h.01"),
  },
  {
    label: "Inventory",
    href: "/admin-tools/inventory",
    match: (p) => p.startsWith("/admin-tools/inventory"),
    section: "inventory",
    icon: I("M4 7l8-4 8 4M4 7v10l8 4 8-4V7M4 7l8 4 8-4M12 11v10"),
  },
  {
    label: "Customers",
    href: "/admin-tools/data-browser?type=users",
    match: (_p, t) => t === "users",
    section: "customers",
    badgeType: "users",
    icon: I("M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"),
  },
  // Consultations tab intentionally hidden from the sidebar for now (data is
  // still accessible via /admin-tools/data-browser?type=consultations).
  {
    label: "Discounts",
    href: "/admin-tools/data-browser?type=discounts",
    match: (_p, t) => t === "discounts",
    section: "discounts",
    badgeType: "discounts",
    icon: I("M9 9h.01M15 15h.01M16 8l-8 8M7 4h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z"),
  },
  {
    label: "Content",
    href: "/admin-tools/data-browser?type=posts",
    match: (_p, t) => t === "posts" || t === "media",
    section: "content",
    badgeType: "posts",
    icon: I("M6 3h9l5 5v13a0 0 0 0 1 0 0H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM14 3v6h6M8 13h8M8 17h5"),
  },
  {
    // Admin-only (no section key) — live integration self-check.
    label: "System health",
    href: "/admin-tools/health",
    match: (p) => p.startsWith("/admin-tools/health"),
    icon: I("M22 12h-4l-3 9L9 3l-3 9H2"),
  },
  {
    // Admin-only (no section key) — account security / 2FA.
    label: "Security",
    href: "/admin-tools/security",
    match: (p) => p.startsWith("/admin-tools/security"),
    icon: I("M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-4zM9 12l2 2 4-4"),
  },
];

/** Fired by action pages (approve / dispatch) so the sidebar counts refresh
 *  immediately, with no page reload. */
export const BADGE_REFRESH_EVENT = "jood:refresh-badges";

/**
 * The Clinical Check page publishes the exact total it is showing (the sum of
 * its three tab pills) so the sidebar badge always matches the tabs and moves
 * at the same moment. Without this the badge came from a separate SQL count
 * and could disagree with the meeting-aware tab numbers.
 */
export const CLINICAL_COUNT_EVENT = "jood:clinical-count";

/**
 * While the Clinical Check page is mounted this holds the total it is
 * rendering. The badge PREFERS this over its own SQL fetch, otherwise a
 * refresh (approve/reject) or a window-focus re-fetch would overwrite the
 * tab-matching number with the server figure and they'd disagree again.
 */
let clinicalTabTotal: number | null = null;

export function publishClinicalCount(total: number) {
  clinicalTabTotal = total;
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(CLINICAL_COUNT_EVENT, { detail: total }),
  );
}

/** Called when the Clinical Check page unmounts — the badge falls back to its
 *  own count once the page (the source of truth for the tabs) is gone. */
export function clearClinicalCount() {
  clinicalTabTotal = null;
}

export function getClinicalCountOverride(): number | null {
  return clinicalTabTotal;
}
export function refreshAdminBadges() {
  if (typeof window === "undefined") return;
  // Fire now, then two short follow-ups. The count read straight after an
  // action can hit a pooled DB connection that hasn't seen the just-committed
  // write yet (Neon), so a single refetch sometimes shows the OLD number until
  // you reload two or three times. The staggered retries pick up the committed
  // value on their own, so the sidebar count moves the moment you click.
  const fire = () => window.dispatchEvent(new Event(BADGE_REFRESH_EVENT));
  fire();
  window.setTimeout(fire, 500);
  window.setTimeout(fire, 1500);
}

function NavBadge({ type }: { type: string }) {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    const apply = (n: unknown) => {
      // Always apply the live number (including 0) so a badge clears when its
      // queue empties — e.g. dispatch the last patient → the count disappears.
      if (!cancelled && typeof n === "number") setCount(n);
    };
    const load = () => {
      if (type === "clinical") {
        // The Clinical Check page, when open, is the source of truth — use the
        // total it published so the badge always equals the sum of its tabs.
        const override = getClinicalCountOverride();
        if (override != null) {
          apply(override);
          return;
        }
        fetch(`/api/admin-tools/clinical-review?status=pending`, { credentials: "include", cache: "no-store" })
          .then((r) => r.json())
          // Re-check the override: the page may have published its total while
          // this request was in flight, and that must win.
          .then((j) => { if (j?.ok && getClinicalCountOverride() == null) apply(j.pending); })
          .catch(() => {});
      } else if (type === "rejected") {
        // Rejected-for-supply patients (reference count, not a work queue).
        fetch(`/api/admin-tools/clinical-review?status=rejected`, { credentials: "include", cache: "no-store" })
          .then((r) => r.json())
          .then((j) => { if (j?.ok) apply(j.total); })
          .catch(() => {});
      } else if (type === "marketing") {
        // Abandoned Checkout = shoppers with an unfinished cart.
        fetch(`/api/admin-tools/abandoned-carts?count=1`, { credentials: "include", cache: "no-store" })
          .then((r) => r.json())
          .then((j) => { if (j?.ok) apply(j.count); })
          .catch(() => {});
      } else if (type === "dispensing") {
        // Dispatch queue = patients approved & awaiting dispatch.
        fetch(`/api/admin-tools/dispatch?counts=1`, { credentials: "include", cache: "no-store" })
          .then((r) => r.json())
          .then((j) => { if (j?.ok) apply(j.awaiting); })
          .catch(() => {});
      } else if (type === "dispatching") {
        // Dispatched = the rows the Dispatched PAGE renders. It reads the same
        // /api/admin-tools/dispatch pipeline, so counting orders separately
        // (list?fulfillment=dispatched) could drift from what staff see — e.g.
        // an order marked shipped whose consultation has no _dispatched_at
        // stamp. Counting from the same source keeps badge == page.
        fetch(`/api/admin-tools/dispatch?counts=1`, { credentials: "include", cache: "no-store" })
          .then((r) => r.json())
          .then((j) => { if (j?.ok) apply(j.dispatched); })
          .catch(() => {});
      } else if (type === "orders") {
        // Orders badge = ACTIVE orders only (not yet dispatched, not cancelled)
        // — the "job queue" awaiting action. Dispatched orders move to the
        // Dispatched tab, so this count drops to zero once everything's out.
        fetch(`/api/admin-tools/list?type=orders&fulfillment=unfulfilled&page=1&pageSize=1`, { credentials: "include", cache: "no-store" })
          .then((r) => r.json())
          .then((j) => { if (j?.ok) apply(j.total); })
          .catch(() => {});
      } else {
        fetch(`/api/admin-tools/list?type=${type}&page=1&pageSize=1`, { credentials: "include", cache: "no-store" })
          .then((r) => r.json())
          .then((j) => { if (j?.ok) apply(j.total); })
          .catch(() => {});
      }
    };
    load();
    // Re-fetch the moment an action changes the data, and when the window
    // regains focus — so numbers move without a manual refresh.
    window.addEventListener(BADGE_REFRESH_EVENT, load);
    window.addEventListener("focus", load);
    // While the Clinical Check page is open it publishes the exact total it
    // renders (sum of its tab pills), so the badge mirrors the tabs.
    const onClinicalCount = (e: Event) => {
      const n = (e as CustomEvent<number>).detail;
      if (typeof n === "number") apply(n);
    };
    if (type === "clinical") {
      window.addEventListener(CLINICAL_COUNT_EVENT, onClinicalCount);
    }
    return () => {
      cancelled = true;
      window.removeEventListener(BADGE_REFRESH_EVENT, load);
      window.removeEventListener("focus", load);
      if (type === "clinical") {
        window.removeEventListener(CLINICAL_COUNT_EVENT, onClinicalCount);
      }
    };
  }, [type]);
  if (count === null || count === 0) return null;
  // Work queues (needs action) → red; reference counts → neutral grey.
  const attention = type === "clinical" || type === "dispensing";
  return (
    <span className={`ml-auto rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
      attention ? "bg-[#dc2626] text-white" : "bg-[#e3e3e3] text-[#616161]"
    }`}>
      {count}
    </span>
  );
}

export default function AdminShell({
  children,
  role = "admin",
  permissions = [],
}: {
  children: React.ReactNode;
  role?: string;
  permissions?: string[];
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const type = params.get("type");
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Admins see every nav item. Staff see only the sections granted to them
  // (Home has no `section` key → admin-only).
  const items =
    role === "admin"
      ? NAV
      : NAV.filter((n) => n.section && permissions.includes(n.section));

  // Close the mobile drawer on navigation.
  useEffect(() => {
    setOpen(false);
  }, [pathname, type]);

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/users/logout", { method: "POST", credentials: "include" });
    } catch {
      /* ignore — cookie is cleared either way below */
    }
    router.push("/login");
    router.refresh();
  }

  const footer = (
    <div className="mt-auto border-t border-[#e1e3e5] p-3">
      <button
        type="button"
        onClick={logout}
        disabled={loggingOut}
        className="flex w-full items-center gap-3 rounded-[8px] px-3 py-2 text-[14px] font-medium text-[#303030] transition-colors hover:bg-[#f1f1f1] disabled:opacity-50"
      >
        <span className="text-[#616161]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M15 4h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2M10 17l-5-5 5-5M5 12h11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        {loggingOut ? "Logging out…" : "Log out"}
      </button>
    </div>
  );

  const nav = (
    <nav className="flex flex-col gap-0.5 p-3">
      {items.map((item) => {
        const active = item.match(pathname, type);
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 rounded-[8px] px-3 py-2 text-[14px] font-medium transition-colors ${
              active
                ? "bg-[#ebebeb] text-[#1a1a1a]"
                : "text-[#303030] hover:bg-[#f1f1f1]"
            }`}
          >
            <span className="text-[#616161]">{item.icon}</span>
            {item.label}
            {item.badgeType ? <NavBadge type={item.badgeType} /> : null}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-[#f1f1f1] font-ui text-[#303030]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col border-r border-[#e1e3e5] bg-[#fbfbfb] md:flex">
        <div className="flex h-14 items-center gap-2 px-5">
          <span className="text-[16px] font-bold tracking-tight text-[#142e2a]">JoodLife</span>
          <span className="rounded bg-[#e3e3e3] px-1.5 py-0.5 text-[10px] font-semibold text-[#616161]">
            {role === "staff" ? "Staff" : "Admin"}
          </span>
        </div>
        {nav}
        {footer}
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-12 items-center gap-3 border-b border-[#e1e3e5] bg-[#fbfbfb] px-4 md:hidden">
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
          className="grid h-8 w-8 place-items-center rounded-[8px] border border-[#d0d3d6] bg-white"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 6h16M4 12h16M4 18h16" stroke="#303030" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        <span className="text-[15px] font-bold text-[#1a1a1a]">JoodLife Admin</span>
      </div>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-[260px] flex-col overflow-y-auto bg-[#fbfbfb] shadow-xl">
            <div className="flex h-12 items-center justify-between px-4">
              <span className="text-[15px] font-bold text-[#142e2a]">JoodLife Admin</span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center text-[#616161]"
              >
                ✕
              </button>
            </div>
            {nav}
            {footer}
          </aside>
        </div>
      ) : null}

      {/* Content */}
      <div className="min-w-0 flex-1 pt-12 md:pt-0">{children}</div>
    </div>
  );
}
