"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Abandoned Checkout — true cart abandonment. Lists shoppers who left items in
 * their basket without completing checkout (captured by /api/cart/track). Each
 * row can be nudged with a reminder email (also sent automatically each day by
 * /api/cron/abandoned-reminders) or dismissed once it's no longer worth chasing.
 */

type Item = { title?: string | null; dose?: string | null; quantity?: number };
type Cart = {
  id: number;
  email: string;
  customer_name: string | null;
  phone: string | null;
  items_json: Item[] | null;
  total_amount: number | null;
  reminder_count: number | null;
  last_reminded_at: string | null;
  created_at: string | null;
};

const money = (n: number | null) =>
  typeof n === "number" ? `£${n.toFixed(2)}` : "—";

function ago(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return "";
  const mins = Math.max(0, Math.round((Date.now() - d) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function itemsSummary(items: Item[] | null): string {
  if (!items || items.length === 0) return "—";
  return items
    .filter((i) => (i.title ?? "").trim())
    .map(
      (i) =>
        `${i.title}${i.dose ? ` · ${i.dose}` : ""}${i.quantity && i.quantity > 1 ? ` × ${i.quantity}` : ""}`,
    )
    .join(", ");
}

export default function AbandonedCheckoutView() {
  const [carts, setCarts] = useState<Cart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-tools/abandoned-carts", {
        credentials: "include",
        cache: "no-store",
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j?.error ?? "Failed to load");
      setCarts(j.items as Cart[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const act = async (id: number, action: "remind" | "dismiss") => {
    setBusy(id);
    try {
      const res = await fetch("/api/admin-tools/abandoned-carts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, action }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j?.error ?? "Failed");
      if (action === "dismiss") {
        setCarts((prev) => prev.filter((c) => c.id !== id));
      } else {
        setCarts((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  reminder_count: (c.reminder_count ?? 0) + 1,
                  last_reminded_at: new Date().toISOString(),
                }
              : c,
          ),
        );
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-6 md:px-6">
      <div className="mb-5">
        <h1 className="text-[20px] font-semibold text-[#1a1a1a]">Abandoned Checkout</h1>
        <p className="mt-0.5 text-[13px] text-[#6b7280]">
          Shoppers who added items to their basket but didn&rsquo;t complete
          checkout. A reminder email goes out automatically each day; you can
          also nudge or dismiss them here. They drop off automatically once they
          place an order.
        </p>
      </div>

      {loading ? (
        <p className="text-[13px] text-[#6b7280]">Loading…</p>
      ) : error ? (
        <p className="text-[13px] text-[#dc2626]">{error}</p>
      ) : carts.length === 0 ? (
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-8 text-center">
          <p className="text-[14px] font-semibold text-[#1a1a1a]">No abandoned checkouts.</p>
          <p className="mt-1 text-[13px] text-[#6b7280]">
            Carts left unfinished will appear here for follow-up.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {carts.map((c) => (
            <div
              key={c.id}
              className="flex flex-col gap-3 rounded-xl border border-[#e5e7eb] bg-white p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold text-[#1a1a1a]">
                  {c.customer_name?.trim() || c.email}
                </p>
                <p className="truncate text-[12.5px] text-[#6b7280]">
                  {c.email}
                  {c.phone ? ` · ${c.phone}` : ""}
                </p>
                <p className="mt-1 truncate text-[12.5px] text-[#374151]">{itemsSummary(c.items_json)}</p>
                <p className="mt-1 text-[11.5px] text-[#9ca3af]">
                  {money(c.total_amount)} · abandoned {ago(c.created_at)}
                  {c.reminder_count && c.reminder_count > 0
                    ? ` · ${c.reminder_count} reminder${c.reminder_count === 1 ? "" : "s"} sent${
                        c.last_reminded_at ? ` (last ${ago(c.last_reminded_at)})` : ""
                      }`
                    : " · no reminders yet"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  disabled={busy === c.id}
                  onClick={() => act(c.id, "remind")}
                  className="rounded-lg bg-[#142e2a] px-4 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#0c2421] disabled:opacity-60"
                >
                  {busy === c.id ? "Sending…" : "Send reminder"}
                </button>
                <button
                  type="button"
                  disabled={busy === c.id}
                  onClick={() => act(c.id, "dismiss")}
                  className="rounded-lg border border-[#142e2a]/30 bg-white px-4 py-1.5 text-[13px] font-semibold text-[#142e2a] transition-colors hover:bg-[#f7f9f2] disabled:opacity-60"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
