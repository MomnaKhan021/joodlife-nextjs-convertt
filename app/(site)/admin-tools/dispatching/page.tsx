"use client";

/**
 * Dispatched — orders that have been dispatched and have a DPD tracking
 * number allotted. Clicking a row opens DPD's live tracking page for that
 * parcel in a new tab.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

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

export default function DispatchedPage() {
  const [orders, setOrders] = useState<DispatchOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-tools/dispatch", { credentials: "include" });
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
    void load();
  }, [load]);

  const dispatched = useMemo(() => {
    const list = orders.filter((o) => o.dispatched && o.trackingNumber);
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
          onChange={(e) => setQ(e.target.value)}
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
        <div className="overflow-hidden rounded-[12px] border border-[#e5e7eb] bg-white">
          {dispatched.map((o, i) => (
            <a
              key={o.id}
              href={trackingUrl(o.trackingNumber!)}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-[#f7f9f2] ${
                i > 0 ? "border-t border-[#e5e7eb]" : ""
              }`}
            >
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-[#111827]">
                  {o.customerName || `Order ${o.orderNumber ?? `#${o.id}`}`}
                </p>
                <p className="text-[12px] text-[#6b7280]">
                  {o.orderNumber ? `${o.orderNumber} · ` : ""}{fmtDate(o.createdAt)} · {gbp(o.total)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-md bg-[#eef3e6] px-2.5 py-1 font-mono text-[12px] font-semibold text-[#142e2a]">
                  {o.trackingNumber}
                </span>
                <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#1450b0]">
                  Track
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M7 17L17 7M17 7H8M17 7v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
