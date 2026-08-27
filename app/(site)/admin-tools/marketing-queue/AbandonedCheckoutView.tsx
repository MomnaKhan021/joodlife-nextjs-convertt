"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { refreshAdminBadges } from "../AdminShell";

/**
 * Abandoned Checkout — true cart abandonment. Lists shoppers who left items in
 * their basket without completing checkout (captured by /api/cart/track). Each
 * row can be nudged with a reminder email (also sent automatically each day by
 * /api/cron/abandoned-reminders) or dismissed once it's no longer worth chasing.
 */

type Item = { title?: string | null; dose?: string | null; quantity?: number };
type Cart = {
  id: number;
  kind: "cart" | "consultation";
  email: string;
  customer_name: string | null;
  phone: string | null;
  items_json: Item[] | null;
  product_slug: string | null;
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
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const keyOf = (c: Cart) => `${c.kind}-${c.id}`;

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

  const act = async (item: Cart, action: "remind" | "dismiss") => {
    const key = keyOf(item);
    setBusy(key);
    try {
      const res = await fetch("/api/admin-tools/abandoned-carts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: item.id, kind: item.kind, action }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j?.error ?? "Failed");
      if (action === "dismiss") {
        setCarts((prev) => prev.filter((c) => keyOf(c) !== key));
        // The lead has left this queue — move the sidebar count at the same
        // moment rather than waiting for a reload.
        refreshAdminBadges();
      } else {
        setCarts((prev) =>
          prev.map((c) =>
            keyOf(c) === key
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

  // Search by name, email or phone (digits-only match too, so "07700900000"
  // finds "07700 900 000").
  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return carts;
    const digits = term.replace(/\D/g, "");
    return carts.filter((c) => {
      const name = (c.customer_name ?? "").toLowerCase();
      const email = (c.email ?? "").toLowerCase();
      const phone = (c.phone ?? "").toLowerCase();
      const phoneDigits = phone.replace(/\D/g, "");
      return (
        name.includes(term) ||
        email.includes(term) ||
        phone.includes(term) ||
        (digits.length >= 4 && phoneDigits.includes(digits))
      );
    });
  }, [carts, q]);

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-6 md:px-6">
      <div className="mb-5">
        <h1 className="text-[20px] font-semibold text-[#1a1a1a]">Abandoned Checkout</h1>
        <p className="mt-0.5 text-[13px] text-[#6b7280]">
          Shoppers who didn&rsquo;t complete a purchase — an unfinished basket,
          or a consultation with no order yet. A reminder email goes out
          automatically each day; you can also nudge or dismiss them here. They
          drop off automatically once they place an order.
        </p>
      </div>

      {!loading && !error && carts.length > 0 ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email or phone…"
            className="h-9 w-full max-w-[360px] rounded-[8px] border border-[#d0d3d6] bg-white px-3 text-[13px] outline-none focus:border-[#142e2a]"
          />
          {q.trim() ? (
            <button
              type="button"
              onClick={() => setQ("")}
              className="h-9 rounded-[8px] border border-[#d0d3d6] bg-white px-3 text-[13px] font-medium hover:bg-[#f7f7f7]"
            >
              Clear
            </button>
          ) : null}
          <span className="text-[13px] text-[#6b7280]">
            {q.trim()
              ? `${visible.length} of ${carts.length}`
              : `${carts.length} abandoned checkout${carts.length === 1 ? "" : "s"}`}
          </span>
        </div>
      ) : null}

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
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-8 text-center">
          <p className="text-[14px] font-semibold text-[#1a1a1a]">
            No matches for &ldquo;{q.trim()}&rdquo;.
          </p>
          <p className="mt-1 text-[13px] text-[#6b7280]">
            Try a different name, email or phone number.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((c) => {
            const k = keyOf(c);
            const isConsult = c.kind === "consultation";
            const desc = isConsult
              ? `Consultation${c.product_slug ? ` — ${c.product_slug}` : ""} · no order yet`
              : itemsSummary(c.items_json);
            return (
              <div
                key={k}
                className="flex flex-col gap-3 rounded-xl border border-[#e5e7eb] bg-white p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[14px] font-semibold text-[#1a1a1a]">
                      {c.customer_name?.trim() || c.email}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        isConsult ? "bg-[#e6f2f8] text-[#1a6f96]" : "bg-[#eef3e6] text-[#3c6b2f]"
                      }`}
                    >
                      {isConsult ? "Consultation" : "Cart"}
                    </span>
                  </div>
                  <p className="truncate text-[12.5px] text-[#6b7280]">
                    {c.email}
                    {c.phone ? ` · ${c.phone}` : ""}
                  </p>
                  <p className="mt-1 truncate text-[12.5px] text-[#374151]">{desc}</p>
                  <p className="mt-1 text-[11.5px] text-[#9ca3af]">
                    {isConsult ? "" : `${money(c.total_amount)} · `}abandoned {ago(c.created_at)}
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
                    disabled={busy === k}
                    onClick={() => act(c, "remind")}
                    className="rounded-lg bg-[#142e2a] px-4 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#0c2421] disabled:opacity-60"
                  >
                    {busy === k ? "Sending…" : "Send reminder"}
                  </button>
                  <button
                    type="button"
                    disabled={busy === k}
                    onClick={() => act(c, "dismiss")}
                    className="rounded-lg border border-[#142e2a]/30 bg-white px-4 py-1.5 text-[13px] font-semibold text-[#142e2a] transition-colors hover:bg-[#f7f9f2] disabled:opacity-60"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
