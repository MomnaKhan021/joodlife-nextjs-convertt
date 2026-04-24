"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type AccountUser = {
  id: string;
  email: string;
  name?: string;
  role: string;
};

export default function AccountDashboard({ user }: { user: AccountUser }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/users/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore — we'll refresh either way
    } finally {
      router.refresh();
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
      {/* Sidebar — profile card */}
      <aside className="flex flex-col gap-4 rounded-2xl border border-[#142e2a]/10 bg-[#f7f9f2] p-6">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-[#142e2a] font-display text-[20px] font-semibold text-white">
          {(user.name ?? user.email)[0]?.toUpperCase() ?? "?"}
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
            <dd className="font-medium text-[#142e2a] capitalize">
              {user.role}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#142e2a]/60">User ID</dt>
            <dd className="font-mono text-[11px] text-[#142e2a]/75">
              {user.id.slice(0, 10)}…
            </dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loading}
          className="mt-auto inline-flex h-11 cursor-pointer items-center justify-center rounded-lg border border-[#142e2a]/20 bg-white font-ui text-[13px] font-semibold text-[#142e2a] transition-colors hover:bg-[#142e2a] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Signing out…" : "Sign out"}
        </button>
      </aside>

      {/* Main — placeholder for future orders/history */}
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
          <p className="font-ui text-[14px] text-[#142e2a]/70">
            No orders yet.
          </p>
          <a
            href="/shop"
            className="mt-3 inline-flex h-10 items-center justify-center rounded-lg bg-[#142e2a] px-5 font-ui text-[12px] font-semibold uppercase tracking-[0.04em] text-white transition-colors hover:bg-[#0c2421]"
          >
            Browse shop
          </a>
        </div>

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
