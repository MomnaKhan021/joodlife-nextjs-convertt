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
  ageFromDob,
  fmtDate,
  fmtNum,
  isDateKey,
  labelFor,
} from "@/lib/consultationDisplay";
import {
  composeMedicine,
  dispensingDate,
  printHtmlDocument,
  printLabels,
  type LabelData,
} from "../orders/[id]/dispensingLabel";

type DispatchItem = { title: string | null; dose: string | null; quantity: number };
type Consultation = {
  fullName: string | null;
  dateOfBirth: string | null;
  productSlug: string | null;
  answers: Record<string, unknown>;
};
type DispatchOrder = {
  id: number; // consultation id — dispatch state keys off this
  orderId: number | null; // matched paid order — needed for the DPD label
  hasOrder: boolean;
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
  consultation: Consultation | null;
};

/** Compute BMI from the consultation answers, rounded to 1 dp. */
function bmiFromAnswers(a: Record<string, unknown>): number | null {
  const w = Number(a.current_weight_kg);
  const h = Number(a.height_cm);
  if (!w || !h) return null;
  return Math.round((w / Math.pow(h / 100, 2)) * 10) / 10;
}

/** Render one answer value readably (dates formatted, arrays joined). */
function answerText(key: string, v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (isDateKey(key)) return fmtDate(v);
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  const s = String(v);
  return s === "true" ? "Yes" : s === "false" ? "No" : s;
}

/** Expandable clinical summary — mirrors the clinical-queue detail. */
function ClinicalSummary({ c }: { c: Consultation }) {
  const a = c.answers ?? {};
  const bmi = bmiFromAnswers(a);
  const age = ageFromDob(c.dateOfBirth ?? a.date_of_birth_consultation);
  const skip = new Set(["fullName", "firstName", "lastName", "email"]);
  const rows = Object.entries(a).filter(
    ([k]) => !k.startsWith("_") && !skip.has(k),
  );
  return (
    <div className="mt-3 rounded-lg border border-[#e5e7eb] bg-[#fbfcfa] p-4">
      <div className="mb-3 flex flex-wrap gap-x-6 gap-y-2 border-b border-[#e5e7eb] pb-3">
        {[
          { label: "BMI", value: bmi != null ? String(bmi) : "—" },
          { label: "Age", value: age != null ? String(age) : "—" },
          { label: "Weight", value: a.current_weight_kg ? `${fmtNum(a.current_weight_kg)} kg` : "—" },
          { label: "Height", value: a.height_cm ? `${fmtNum(a.height_cm)} cm` : "—" },
          { label: "Date of birth", value: fmtDate(c.dateOfBirth ?? a.date_of_birth_consultation) },
        ].map((s) => (
          <div key={s.label} className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wide text-[#6b7280]">{s.label}</span>
            <span className="text-[13px] font-semibold text-[#142e2a]">{s.value}</span>
          </div>
        ))}
      </div>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex gap-2 text-[13px]">
            <dt className="shrink-0 font-semibold text-[#374151]">{labelFor(k)}:</dt>
            <dd className="min-w-0 text-[#4b5563]">{answerText(k, v)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

const gbp = (n: number) =>
  n.toLocaleString("en-GB", { style: "currency", currency: "GBP" });

function fmtDateTime(iso: string | null) {
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
  const [open, setOpen] = useState(false);

  const printDispensing = useCallback(async () => {
    if (busy) return;
    if (!window.confirm(`Print the dispensing label and mark order ${o.orderNumber ?? `#${o.id}`} dispatched?`)) return;
    // Print first — synchronous, inside the click gesture.
    const patient = o.customerName?.trim() || "—";
    const date = dispensingDate();
    const labels: LabelData[] = (o.items.length ? o.items : [{ title: null, dose: null, quantity: 1 }]).map(
      (it): LabelData => {
        const { brand, productLine } = composeMedicine(it.title, it.dose);
        return { brand, productName: productLine, patientName: patient, date };
      },
    );
    printLabels(labels);
    // Then mark this patient (consultation) dispatched — no DPD tracking is
    // created this way. This moves them out of the queue into Dispatched.
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin-tools/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ consultationId: o.id }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? `Failed to mark dispatched (HTTP ${res.status})`);
      }
      setNote("Dispensing label printed · marked dispatched");
      onDispatched(o.id, o.trackingNumber ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  }, [busy, o.id, o.orderNumber, o.customerName, o.items, o.trackingNumber, onDispatched]);

  const dispatch = useCallback(async () => {
    if (busy) return;
    if (!o.orderId) {
      setError("No order/address on file — can't create a DPD label for this patient yet.");
      return;
    }
    if (!window.confirm(`Dispatch order ${o.orderNumber ?? `#${o.id}`} and print the DPD label?`)) return;
    // Open the label window NOW, inside the click gesture, so the browser
    // doesn't block it as a popup (creating the DPD shipment is slow, and
    // opening after the await would be treated as non-user-initiated).
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(
        `<!doctype html><title>Dispatch label</title><body style="font-family:-apple-system,Segoe UI,Arial,sans-serif;padding:32px;color:#142e2a">Generating dispatch label…</body>`,
      );
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-tools/dpd-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderId: o.orderId }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) {
        if (win) win.close();
        throw new Error(j?.error ?? "Failed to generate DPD label");
      }
      // Write the FULL DPD label (keeping its barcode-rendering script) into
      // the visible window. If the popup was blocked, fall back to an iframe.
      if (j.labelHtml) {
        if (win) {
          win.document.open();
          win.document.write(String(j.labelHtml));
          win.document.close();
          win.focus();
        } else {
          printHtmlDocument(String(j.labelHtml));
        }
      }
      // Record dispatch (with the DPD tracking number) against the patient's
      // consultation so they move into Dispatched with a trackable parcel.
      await fetch(`/api/admin-tools/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ consultationId: o.id, trackingNumber: j.trackingNumber }),
      }).catch(() => {});
      setNote(`Dispatched · Tracking ${j.trackingNumber}`);
      onDispatched(o.id, j.trackingNumber);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  }, [busy, o.id, o.orderId, o.orderNumber, onDispatched]);

  return (
    <div className="rounded-[12px] border border-[#e5e7eb] bg-white p-5">
      {/* Header row — matches the clinical queue layout */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[16px] font-bold text-[#111827]">
              {o.customerName || `Patient #${o.id}`}
            </span>
            <span className="rounded-full bg-[#eef3e6] px-2.5 py-0.5 text-[12px] font-semibold text-[#4a5c46]">
              Awaiting dispatch
            </span>
          </div>
          {o.customerEmail && <p className="mt-0.5 text-[12px] text-[#6b7280]">{o.customerEmail}</p>}
          <p className="text-[11px] text-[#9ca3af]">
            Approved: {fmtDateTime(o.createdAt)}
            {o.hasOrder
              ? `${o.orderNumber ? ` · ${o.orderNumber}` : ""} · ${gbp(o.total)}`
              : " · No order on file"}
          </p>
        </div>

        {/* Top-right actions */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={printDispensing}
              disabled={busy}
              className="rounded-lg border border-[#142e2a]/30 bg-white px-4 py-1.5 text-[13px] font-semibold text-[#142e2a] transition-colors hover:border-[#142e2a] hover:bg-[#f7f9f2] disabled:opacity-60"
            >
              Print dispensing label
            </button>
            <button
              type="button"
              onClick={dispatch}
              disabled={busy || !o.hasOrder}
              title={o.hasOrder ? undefined : "No order/address on file for this patient"}
              className="rounded-lg bg-[#142e2a] px-4 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#0c2421] disabled:opacity-40"
            >
              {busy ? "Dispatching…" : "Dispatch"}
            </button>
          </div>
          {!o.hasOrder && (
            <span className="max-w-[280px] text-right text-[11px] text-[#9ca3af]">
              No order/address on file — DPD label unavailable.
            </span>
          )}
          {note && <span className="text-[12px] text-[#2f5d2a]">{note}</span>}
          {error && <span className="max-w-[280px] text-right text-[12px] text-[#dc2626]">{error}</span>}
          <span className="text-[12px] font-mono text-[#9ca3af]">#{o.id}</span>
        </div>
      </div>

      {/* Expandable clinical summary + order detail (collapsed by default,
          same as the clinical queue) */}
      <div className="mt-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-[12px] font-semibold text-[#1450b0] hover:underline"
        >
          {open ? "Hide clinical summary ▲" : "View clinical summary ▼"}
        </button>
        {open && (
          <>
            {o.consultation && <ClinicalSummary c={o.consultation} />}
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
          </>
        )}
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
          Patients approved for supply in the clinical queue. Print the dispensing
          label for the pack, then Dispatch to create the DPD parcel label and
          tracking number. Approved patients without an order can&apos;t print a
          DPD label until one exists.
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
