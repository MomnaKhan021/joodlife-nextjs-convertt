"use client";

/**
 * Dispatch queue — paid orders awaiting dispatch, one card per order
 * (mirrors the clinical queue layout). Each card carries the two label
 * actions at the top:
 *   - Print dispensing label  (medicine pack, real patient/medicine data)
 *   - Dispatch                (creates the DPD label + allots a tracking
 *                              number, then prints the parcel label)
 * Once dispatched, the order leaves this queue and appears under Dispatched.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  composeMedicine,
  dispensingDate,
  printHtmlDocument,
  printLabels,
  type LabelData,
} from "../orders/[id]/dispensingLabel";

type DispatchItem = { title: string | null; dose: string | null; quantity: number };
type DispatchOrder = {
  id: number;
  orderNumber: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  shippingAddress: string | null;
  status: string;
  total: number;
  createdAt: string | null;
  trackingNumber: string | null;
  dispatched: boolean;
  items: DispatchItem[];
};

const gbp = (n: number) =>
  n.toLocaleString("en-GB", { style: "currency", currency: "GBP" });

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function OrderCard({
  o,
  onDispatched,
}: {
  o: DispatchOrder;
  onDispatched: (id: number, tracking: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  function printDispensing() {
    const patient = o.customerName?.trim() || "—";
    const date = dispensingDate();
    const labels: LabelData[] = (o.items.length ? o.items : [{ title: null, dose: null, quantity: 1 }]).map(
      (it): LabelData => {
        const { brand, productLine } = composeMedicine(it.title, it.dose);
        return { brand, productName: productLine, patientName: patient, date };
      },
    );
    printLabels(labels);
  }

  const dispatch = useCallback(async () => {
    if (busy) return;
    if (!window.confirm(`Dispatch order ${o.orderNumber ?? `#${o.id}`} and print the DPD label?`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-tools/dpd-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderId: o.id }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j?.error ?? "Failed to generate DPD label");
      // Print via a hidden iframe (popup-blocker safe).
      if (j.labelHtml) printHtmlDocument(String(j.labelHtml));
      setNote(`Dispatched · Tracking ${j.trackingNumber}`);
      onDispatched(o.id, j.trackingNumber);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  }, [busy, o.id, o.orderNumber, onDispatched]);

  return (
    <div className="rounded-[12px] border border-[#e5e7eb] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[16px] font-bold text-[#111827]">
              {o.customerName || `Order ${o.orderNumber ?? `#${o.id}`}`}
            </span>
            <span className="rounded-full bg-[#ffea8a] px-2.5 py-0.5 text-[11px] font-semibold text-[#5c4813]">
              Awaiting dispatch
            </span>
          </div>
          {o.customerEmail && <p className="mt-0.5 text-[12px] text-[#6b7280]">{o.customerEmail}</p>}
          <p className="text-[11px] text-[#9ca3af]">
            {o.orderNumber ? `${o.orderNumber} · ` : ""}Placed {fmtDate(o.createdAt)} · {gbp(o.total)}
          </p>
        </div>

        {/* Top-right actions */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={printDispensing}
              className="rounded-lg border border-[#142e2a]/30 bg-white px-4 py-1.5 text-[13px] font-semibold text-[#142e2a] transition-colors hover:border-[#142e2a] hover:bg-[#f7f9f2]"
            >
              Print dispensing label
            </button>
            <button
              type="button"
              onClick={dispatch}
              disabled={busy}
              className="rounded-lg bg-[#142e2a] px-4 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#0c2421] disabled:opacity-60"
            >
              {busy ? "Dispatching…" : "Dispatch"}
            </button>
          </div>
          {note && <span className="text-[12px] text-[#2f5d2a]">{note}</span>}
          {error && <span className="max-w-[280px] text-right text-[12px] text-[#dc2626]">{error}</span>}
          <span className="text-[12px] font-mono text-[#9ca3af]">#{o.id}</span>
        </div>
      </div>

      {/* Items + address */}
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-[#e5e7eb] px-3 py-2.5">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[#6b7280]">Items</p>
          {o.items.length ? (
            <ul className="space-y-0.5">
              {o.items.map((it, i) => (
                <li key={i} className="text-[13px] text-[#303030]">
                  {it.title ?? "Item"}{it.dose ? ` · ${it.dose}` : ""} × {it.quantity}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-[#9ca3af]">—</p>
          )}
        </div>
        <div className="rounded-lg border border-[#e5e7eb] px-3 py-2.5">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[#6b7280]">Delivery address</p>
          <p className="whitespace-pre-line text-[13px] text-[#303030]">
            {o.shippingAddress?.trim() || "—"}
          </p>
          {o.customerPhone && <p className="mt-1 text-[12px] text-[#6b7280]">{o.customerPhone}</p>}
        </div>
      </div>
    </div>
  );
}

export default function DispatchQueuePage() {
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

  const awaiting = useMemo(() => {
    const list = orders.filter((o) => !o.dispatched);
    const term = q.trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      (o) =>
        (o.customerName ?? "").toLowerCase().includes(term) ||
        (o.orderNumber ?? "").toLowerCase().includes(term) ||
        (o.customerEmail ?? "").toLowerCase().includes(term),
    );
  }, [orders, q]);

  return (
    <div className="mx-auto w-full max-w-[1000px] px-5 py-6 md:px-8 md:py-8">
      <header className="mb-5">
        <h1 className="text-[22px] font-bold tracking-tight text-[#1a1a1a]">Dispatch queue</h1>
        <p className="mt-1 text-[14px] text-[#616161]">
          Paid orders awaiting dispatch. Print the dispensing label for the pack, then
          Dispatch to create the DPD parcel label and tracking number.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, email or order number…"
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
      ) : awaiting.length === 0 ? (
        <p className="rounded-[10px] border border-dashed border-[#cdd1d5] bg-white/60 px-4 py-8 text-center text-[14px] text-[#8a8f94]">
          No orders awaiting dispatch.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {awaiting.map((o) => (
            <OrderCard
              key={o.id}
              o={o}
              onDispatched={(id, tracking) =>
                setOrders((prev) =>
                  prev.map((x) =>
                    x.id === id ? { ...x, dispatched: true, trackingNumber: tracking, status: "shipped" } : x,
                  ),
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
