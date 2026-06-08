"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { AuthedUser } from "@/lib/auth";

export default function ProfileClient({ user }: { user: AuthedUser }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await fetch("/api/users/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* ignore — refresh either way */
    } finally {
      router.replace("/login");
      router.refresh();
    }
  };

  const initial = (user.name ?? user.email)[0]?.toUpperCase() ?? "?";

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
      <aside className="flex flex-col gap-4 rounded-2xl border border-[#142e2a]/10 bg-[#f7f9f2] p-6">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-[#142e2a] font-display text-[20px] font-semibold text-white">
          {initial}
        </div>
        <div>
          <p className="font-ui text-[12px] font-semibold uppercase tracking-[0.06em] text-[#142e2a]/60">
            Signed in as
          </p>
          <p className="font-ui text-[15px] font-semibold text-[#142e2a]">
            {user.name ?? "—"}
          </p>
          <p className="font-ui text-[13px] text-[#142e2a]/75">{user.email}</p>
        </div>
        <dl className="flex flex-col gap-2 border-t border-[#142e2a]/10 pt-4 font-ui text-[13px]">
          <div className="flex justify-between">
            <dt className="text-[#142e2a]/60">Role</dt>
            <dd className="font-medium capitalize text-[#142e2a]">
              {user.role}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#142e2a]/60">User ID</dt>
            <dd className="font-mono text-[11px] text-[#142e2a]/75">
              {user.id.slice(0, 12)}…
            </dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={handleLogout}
          disabled={signingOut}
          className="mt-auto inline-flex h-11 cursor-pointer items-center justify-center rounded-lg border border-[#142e2a]/20 bg-white font-ui text-[13px] font-semibold text-[#142e2a] transition-colors hover:bg-[#142e2a] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </aside>

      <section className="flex flex-col gap-6 rounded-2xl border border-[#142e2a]/10 bg-white p-6 md:p-8">
        <div>
          <h2 className="font-display text-[22px] font-semibold text-[#142e2a] md:text-[26px]">
            Your orders
          </h2>
          <p className="mt-1 font-ui text-[14px] text-[#142e2a]/70">
            Orders you place will appear here.
          </p>
        </div>
        <div className="rounded-xl border border-dashed border-[#142e2a]/20 bg-[#f7f9f2] p-8 text-center">
          <p className="font-ui text-[14px] text-[#142e2a]/70">No orders yet.</p>
          <a
            href="/shop"
            className="mt-3 inline-flex h-10 items-center justify-center rounded-lg bg-[#142e2a] px-5 font-ui text-[12px] font-semibold uppercase tracking-[0.04em] text-white transition-colors hover:bg-[#0c2421]"
          >
            Browse shop
          </a>
        </div>

        {/* Weight logs entry point */}
        <a
          href="/profile/weight-logs"
          className="group flex items-center justify-between gap-4 rounded-xl border border-[#142e2a]/15 bg-[#142e2a] p-5 text-white transition-colors hover:bg-[#0c2421]"
        >
          <span className="flex items-center gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M4 15l4-4 3 3 5-6 4 4" stroke="#b4ff9f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 20h16" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
            <span className="flex flex-col">
              <span className="font-ui text-[15px] font-semibold">Check your weight logs</span>
              <span className="font-ui text-[13px] text-white/70">
                Track your recorded weights and progress over time
              </span>
            </span>
          </span>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
            className="shrink-0 transition-transform duration-200 group-hover:translate-x-1"
          >
            <path d="M5 12h14m0 0l-6-6m6 6l-6 6" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>

        {user.role === "admin" ? (
          <div className="rounded-xl bg-[#f7f9f2] p-5">
            <p className="font-ui text-[13px] font-semibold text-[#142e2a]">
              You are an admin.
            </p>
            <a
              href="/admin"
              className="mt-2 inline-flex items-center gap-1 font-ui text-[13px] font-semibold text-[#142e2a] underline underline-offset-2"
            >
              Open the CMS admin →
            </a>
          </div>
        ) : null}
      </section>
    </div>
  );
}
