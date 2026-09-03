"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { visibleCmsNav } from "@/lib/cmsSections";

/* CMS shell: fixed left sidebar + content area, matching the operations
   dashboard's Shopify-style chrome. Collapses to a slide-in drawer on
   mobile (hamburger toggle). */

const I = (d: string) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d={d}
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Icon per nav href — kept out of the registry so it stays server-safe. */
const ICONS: Record<string, React.ReactNode> = {
  "/cms/blogs": I("M4 5h16M4 12h16M4 19h10"),
  "/cms/blog-page": I("M4 4h16v5H4zM4 12h7v8H4zM13 12h7M13 16h7M13 20h4"),
  "/cms/media": I("M3 5h18v14H3zM3 15l5-5 4 4 3-3 6 6"),
  "/cms/pages": I("M7 3h7l5 5v13H7zM14 3v5h5"),
  "/cms/header": I("M3 5h18M3 12h18M3 19h18"),
  "/cms/footer": I("M3 19h18M3 12h18M7 5h10"),
  "/cms/home": I("M4 4h7v7H4zM13 4h7v4h-7zM13 11h7v9h-7zM4 14h7v6H4z"),
  "/cms/treatments": I("M10.5 3.5a5 5 0 0 1 7 7l-7 7a5 5 0 0 1-7-7zM7 7l7 7"),
  "/cms/announcement": I("M3 11l14-6v14L3 13zM7 12v5a2 2 0 0 0 4 0"),
  "/cms/support": I("M12 3a9 9 0 1 0 4.5 16.8L21 21l-1.2-4.5A9 9 0 0 0 12 3zM12 8v4M12 16h.01"),
  "/cms/policies/terms": I("M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6"),
  "/cms/policies/refund-complaints": I("M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h4"),
  "/cms/policies/privacy": I("M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z"),
};

export default function CmsShell({
  role,
  permissions,
  userEmail,
  children,
}: {
  role: string;
  permissions: string[];
  userEmail: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "/cms";
  const [open, setOpen] = useState(false);
  const nav = visibleCmsNav(role, permissions);

  const isActive = (match: string) => pathname.startsWith(match);

  const sidebar = (
    <nav className="flex h-full flex-col gap-1 p-3">
      <Link
        href="/cms"
        onClick={() => setOpen(false)}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] transition-colors ${
          pathname === "/cms"
            ? "bg-white font-medium text-[#1a1a1a] shadow-sm"
            : "text-[#4a4a4a] hover:bg-white/60"
        }`}
      >
        {I("M4 11l8-7 8 7M6 9.5V20h12V9.5")}
        Dashboard
      </Link>

      <p className="mt-4 px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
        Content
      </p>

      {nav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setOpen(false)}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] transition-colors ${
            isActive(item.match)
              ? "bg-white font-medium text-[#1a1a1a] shadow-sm"
              : "text-[#4a4a4a] hover:bg-white/60"
          }`}
        >
          {ICONS[item.href] ?? I("M4 6h16M4 12h16M4 18h16")}
          <span className="flex-1">{item.label}</span>
          {item.status === "planned" && (
            <span className="rounded-full bg-[#e8e8e8] px-2 py-[2px] text-[10px] font-medium text-[#6a6a6a]">
              Soon
            </span>
          )}
        </Link>
      ))}

      <div className="mt-auto border-t border-[#e4e7de] pt-3">
        <Link
          href="/admin-tools"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-[#4a4a4a] transition-colors hover:bg-white/60"
        >
          {I("M10 19l-7-7 7-7M3 12h18")}
          Operations dashboard
        </Link>
        <p className="truncate px-3 pt-2 text-[11px] text-[#8a8a8a]" title={userEmail}>
          {userEmail} · {role}
        </p>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-[#f7f9f2]">
      {/* Mobile header */}
      <header className="fixed inset-x-0 top-0 z-30 flex items-center gap-3 border-b border-[#e4e7de] bg-white px-4 py-3 md:hidden">
        <button
          type="button"
          aria-label="Toggle navigation"
          onClick={() => setOpen((v) => !v)}
          className="rounded-md p-1 text-[#1a1a1a]"
        >
          {I("M4 6h16M4 12h16M4 18h16")}
        </button>
        <span className="text-[15px] font-semibold text-[#1a1a1a]">JoodLife CMS</span>
      </header>

      {/* Sidebar — sticky on desktop so it stays put on these long forms,
          drawer on mobile. Its own scrollbar in case the nav outgrows the
          viewport. */}
      <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 self-start overflow-y-auto border-r border-[#e4e7de] bg-[#eef1e8] md:block">
        <div className="border-b border-[#e4e7de] px-5 py-4">
          <span className="text-[15px] font-semibold text-[#1a1a1a]">JoodLife CMS</span>
        </div>
        <div className="min-h-[calc(100vh-61px)]">{sidebar}</div>
      </aside>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 bg-black/30 md:hidden"
          />
          <aside className="fixed inset-y-0 left-0 z-40 w-[260px] bg-[#eef1e8] shadow-xl md:hidden">
            <div className="border-b border-[#e4e7de] px-5 py-4">
              <span className="text-[15px] font-semibold text-[#1a1a1a]">JoodLife CMS</span>
            </div>
            <div className="h-[calc(100vh-61px)]">{sidebar}</div>
          </aside>
        </>
      )}

      <main className="min-w-0 flex-1 px-4 pb-12 pt-[68px] md:px-8 md:pt-8">
        {children}
      </main>
    </div>
  );
}
