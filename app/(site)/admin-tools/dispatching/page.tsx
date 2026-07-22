"use client";

/**
 * Dispatched — orders that have been dispatched and have a DPD tracking
 * number allotted. Clicking a row opens DPD's live tracking page for that
 * parcel in a new tab.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import Pagination from "./../Pagination";

type DispatchOrder = {
  id: number;
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

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

/** DPD Local public tracking page for a parcel/consignment number. */
function trackingUrl(tracking: string) {
  return `https://www.dpdlocal.co.uk/apps/tracking/?reference=${encodeURIComponent(tracking)}`;
}

const PAGE_SIZE = 20;

export default function DispatchedPage() {
  const [orders, setOrders] = useState<DispatchOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

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
    const list = orders.filter((o) => o.dispatched);
    const term = q.trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      (o) =>
        (o.customerName ?? "").toLowerCase().includes(term) ||
        (o.orderNumber ?? "").toLowerCase().includes(term) ||
        (o.trackingNumber ?? "").toLowerCase().includes(term),
    );
  }, [orders, q]);

  return (
    <div className="mx-auto w-full max-w-[1000px] px-5 py-6 md:px-8 md:py-8">
      <header className="mb-5">
        <h1 className="text-[22px] font-bold tracking-tight text-[#1a1a1a]">Dispatched</h1>
        <p className="mt-1 text-[14px] text-[#616161]">
          Orders with a tracking number allotted. Click a customer to open live
          DPD tracking for their parcel.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder="Search by name, order number or tracking…"
          className="h-9 w-full max-w-[360px] rounded-[8px] border border-[#d0d3d6] bg-white px-3 text-[13px] outline-none focus:border-[#142e2a]"
        />
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
                const clickable = Boolean(o.trackingNumber);
                return (
                  <tr
                    key={o.id}
                    onClick={
                      clickable
                        ? () => window.open(trackingUrl(o.trackingNumber as string), "_blank", "noopener,noreferrer")
                        : undefined
                    }
                    className={`border-b border-[#f1f1f1] text-[13px] last:border-b-0 ${
                      clickable ? "cursor-pointer transition-colors hover:bg-[#f7f9f2]" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-semibold text-[#111827]">
                      {o.customerName || `Order ${o.orderNumber ?? `#${o.id}`}`}
                      {o.customerEmail ? (
                        <span className="block text-[12px] font-normal text-[#8a8f94]">{o.customerEmail}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-[#374151]">{o.orderNumber ?? `#${o.id}`}</td>
                    <td className="px-4 py-3 text-[#374151]">{fmtDate(o.createdAt)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-[#111827]">
                      {o.total > 0 ? gbp(o.total) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {o.trackingNumber ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="rounded-md bg-[#eef3e6] px-2.5 py-1 font-mono text-[12px] font-semibold text-[#142e2a]">
                            {o.trackingNumber}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#142e2a]">
                            Track
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                              <path d="M7 17L17 7M17 7H8M17 7v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        </span>
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
