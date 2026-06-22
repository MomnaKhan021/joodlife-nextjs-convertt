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
    label: "Orders",
    href: "/admin-tools/data-browser?type=orders",
    match: (_p, t) => t === "orders",
    badgeType: "orders",
    icon: I("M6 7h12l1 13H5L6 7zM9 9V6a3 3 0 0 1 6 0v3"),
  },
  {
    label: "Products",
    href: "/admin-tools/data-browser?type=products",
    match: (p, t) => t === "products" || p.startsWith("/admin-tools/products"),
    icon: I("M20.6 13.4L13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2A2 2 0 0 1 3 12V4h8a2 2 0 0 1 1.4.6l8.2 8.2a2 2 0 0 1 0 2.6zM7.5 7.5h.01"),
  },
  {
    label: "Customers",
    href: "/admin-tools/data-browser?type=users",
    match: (_p, t) => t === "users",
    icon: I("M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"),
  },
  {
    label: "Consultations",
    href: "/admin-tools/data-browser?type=consultations",
    match: (_p, t) => t === "consultations",
    icon: I("M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z"),
  },
  {
    label: "Discounts",
    href: "/admin-tools/data-browser?type=discounts",
    match: (_p, t) => t === "discounts",
    icon: I("M9 9h.01M15 15h.01M16 8l-8 8M7 4h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z"),
  },
  {
    label: "Content",
    href: "/admin-tools/data-browser?type=posts",
    match: (_p, t) => t === "posts" || t === "media",
    icon: I("M6 3h9l5 5v13a0 0 0 0 1 0 0H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM14 3v6h6M8 13h8M8 17h5"),
  },
];

function NavBadge({ type }: { type: string }) {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    let off = false;
    fetch(`/api/admin-tools/list?type=${type}&page=1&pageSize=1`, { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (!off && j?.ok && typeof j.total === "number") setCount(j.total);
      })
      .catch(() => {});
    return () => {
      off = true;
    };
  }, [type]);
  if (count === null) return null;
  return (
    <span className="ml-auto rounded-md bg-[#e3e3e3] px-1.5 py-0.5 text-[11px] font-semibold text-[#616161]">
      {count}
    </span>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const type = params.get("type");
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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
      {NAV.map((item) => {
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
            Admin
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
