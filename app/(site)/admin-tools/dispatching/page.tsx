"use client";

/**
 * Dispatched — orders that have been dispatched and have a DPD tracking
 * number allotted. Clicking a row opens DPD's live tracking page for that
 * parcel in a new tab.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import Pagination from "./../Pagination";

type DispatchOrder = {
  id: number;
  orderId: number | null;
  orderNumber: string | null;
  customerName: string | null;
  customerEmail: string | null;
  shippingAddress: string | null;
  status: string;
  total: number;
  createdAt: string | null;
  trackingNumber: string | null;
  dispatched: boolean;
};

const gbp = (n: number) =>
  n.toLocaleString("en-GB", { style: "currency", currency: "GBP" });

/** Human-readable absolute timestamp, matching the Orders page: "Today at
 *  12:06 PM", "Yesterday at 9:30 AM", else "8 Jul at 12:06 PM" (year shown
 *  only when it differs). Uses the viewer's local timezone, so a UK-based
 *  admin sees UK time. */
function fmtSmartDateTime(iso: string | null) {
  if (typeof iso !== "string" || !iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const time = d.toLocaleString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const now = new Date();
  const dayDiff = Math.round((startOf(now) - startOf(d)) / 86400000);
  if (dayDiff === 0) return `Today at ${time}`;
  if (dayDiff === 1) return `Yesterday at ${time}`;
  const sameYear = d.getFullYear() === now.getFullYear();
  const date = d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
  return `${date} at ${time}`;
}

/** DPD's public parcel-tracking deep link. The stored value is the DPD parcel
 *  number, so it must go in the /parcels/ path — the old ?reference= form
 *  searched by shipping reference and never found the parcel. */
function trackingUrl(tracking: string) {
  return `https://track.dpd.co.uk/parcels/${encodeURIComponent(tracking)}`;
}

const PAGE_SIZE = 20;

export default function DispatchedPage() {
  const [orders, setOrders] = useState<DispatchOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [dateFilter, setDateFilter] = useState(""); // yyyy-mm-dd, "" = any date
  const [page, setPage] = useState(1);
  const router = useRouter();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-tools/dispatch", { credentials: "include", cache: "no-store" });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j?.error ?? "Failed to load");
      setOrders(j.orders as DispatchOrder[]);
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

  const dispatched = useMemo(() => {
    // Every dispatched patient — including those dispatched via the dispensing
    // label (which has no DPD tracking number).
    let list = orders.filter((o) => o.dispatched);
    const term = q.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (o) =>
          (o.customerName ?? "").toLowerCase().includes(term) ||
          (o.orderNumber ?? "").toLowerCase().includes(term) ||
          (o.trackingNumber ?? "").toLowerCase().includes(term),
      );
    }
    if (dateFilter) {
      list = list.filter((o) => {
        if (!o.createdAt) return false;
        const d = new Date(o.createdAt);
        if (Number.isNaN(+d)) return false;
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return iso === dateFilter;
      });
    }
    return list;
  }, [orders, q, dateFilter]);

  return (
    <div className="mx-auto w-full max-w-[1000px] px-5 py-6 md:px-8 md:py-8">
      <header className="mb-5">
        <h1 className="text-[22px] font-bold tracking-tight text-[#1a1a1a]">Dispatched</h1>
        <p className="mt-1 text-[14px] text-[#616161]">
          Dispatched orders. Click a row to open the full order page; click
          <span className="font-medium"> Track</span> to open live DPD tracking.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder="Search by name, order number or tracking…"
          className="h-9 w-full max-w-[360px] rounded-[8px] border border-[#d0d3d6] bg-white px-3 text-[13px] outline-none focus:border-[#142e2a]"
        />
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
          title="Filter by date"
          className="h-9 rounded-[8px] border border-[#d0d3d6] bg-white px-3 text-[13px] outline-none focus:border-[#142e2a]"
        />
        {dateFilter && (
          <button
            type="button"
            onClick={() => { setDateFilter(""); setPage(1); }}
            className="h-9 rounded-[8px] border border-[#d0d3d6] bg-white px-3 text-[13px] font-medium hover:bg-[#f7f7f7]"
          >
            Clear date
          </button>
        )}
        <button
          type="button"
          onClick={() => load()}
          disabled={loading}
          className="h-9 rounded-[8px] border border-[#d0d3d6] bg-white px-3 text-[13px] font-medium hover:bg-[#f7f7f7] disabled:opacity-50"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-[14px] text-[#616161]">Loading orders…</p>
      ) : dispatched.length === 0 ? (
        <p className="rounded-[10px] border border-dashed border-[#cdd1d5] bg-white/60 px-4 py-8 text-center text-[14px] text-[#8a8f94]">
          No dispatched orders yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-[12px] border border-[#e5e7eb] bg-white">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#e5e7eb] text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5">Order #</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5 text-right">Total</th>
                <th className="px-4 py-2.5">Tracking</th>
              </tr>
            </thead>
            <tbody>
              {dispatched.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((o) => {
                const openOrder = o.orderId
                  ? () => router.push(`/admin-tools/orders/${o.orderId}`)
                  : undefined;
                return (
                  <tr
                    key={o.id}
                    onClick={openOrder}
                    title={openOrder ? "Open full order page" : undefined}
                    className={`border-b border-[#f1f1f1] text-[13px] last:border-b-0 ${
                      openOrder ? "cursor-pointer transition-colors hover:bg-[#f7f9f2]" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-semibold text-[#111827]">
                      {o.customerName || `Order ${o.orderNumber ?? `#${o.id}`}`}
                      {o.customerEmail ? (
                        <span className="block text-[12px] font-normal text-[#8a8f94]">{o.customerEmail}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-[#374151]">
                      {o.orderId ? (
                        // Click the order number → full order detail / history.
                        // stopPropagation so it doesn't also trigger the row's
                        // DPD-tracking click.
                        <Link
                          href={`/admin-tools/orders/${o.orderId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-semibold text-[#142e2a] underline underline-offset-2 hover:text-[#0c2421]"
                        >
                          {o.orderNumber ?? `#${o.id}`}
                        </Link>
                      ) : (
                        o.orderNumber ?? `#${o.id}`
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#374151]">{fmtSmartDateTime(o.createdAt)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-[#111827]">
                      {o.total > 0 ? gbp(o.total) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {o.trackingNumber ? (
                        // Track opens DPD in a new tab. stopPropagation so it
                        // doesn't also trigger the row's "open order" click.
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(trackingUrl(o.trackingNumber as string), "_blank", "noopener,noreferrer");
                          }}
                          className="inline-flex items-center gap-2"
                          title="Track this parcel on DPD"
                        >
                          <span className="rounded-md bg-[#eef3e6] px-2.5 py-1 font-mono text-[12px] font-semibold text-[#142e2a]">
                            {o.trackingNumber}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#142e2a] hover:underline">
                            Track
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                              <path d="M7 17L17 7M17 7H8M17 7v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        </button>
                      ) : (
                        <span className="rounded-md bg-[#f1f1f1] px-2.5 py-1 text-[12px] font-medium text-[#6b7280]">
                          No tracking
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination
            page={page}
            totalPages={Math.max(1, Math.ceil(dispatched.length / PAGE_SIZE))}
            onPage={setPage}
          />
        </div>
      )}
    </div>
  );
}
