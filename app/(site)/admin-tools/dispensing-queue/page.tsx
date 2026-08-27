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
import { refreshAdminBadges } from "../AdminShell";
import Pagination from "../Pagination";
import { orderNumberDisplay, supplyTypeOf, isRedFlagOrder } from "@/lib/orderTag";

type DispatchItem = { title: string | null; dose: string | null; quantity: number };
type InventoryBatch = {
  medicineName: string | null;
  batchNumber: string;
  expiryDate?: string | null;
};
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
  canDispatch: boolean; // order has a usable delivery address for DPD
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

/** Items to show for a card. Uses the order's line items when present; else
 *  derives the medicine + dose from the consultation so the pack is still
 *  visible for approved patients who have no linked order yet. */
function itemsForCard(o: DispatchOrder): DispatchItem[] {
  if (o.items.length) return o.items;
  const a = o.consultation?.answers ?? {};
  const med =
    (typeof a.intended_medicine_v2 === "string" && a.intended_medicine_v2) ||
    (typeof a.most_recent_injection_used_v2 === "string" && a.most_recent_injection_used_v2) ||
    (o.consultation?.productSlug && o.consultation.productSlug !== "reorder"
      ? o.consultation.productSlug
      : "") ||
    "";
  const dose =
    (typeof a.requested_dose === "string" && a.requested_dose) ||
    (typeof a.reorder_dose_choice === "string" && a.reorder_dose_choice) ||
    "";
  if (!med && !dose) return [];
  return [{ title: med || "Medication", dose: dose || null, quantity: 1 }];
}

/** Compute BMI from the consultation answers, rounded to 1 dp. */
function bmiFromAnswers(a: Record<string, unknown>): number | null {
  const w = Number(a.current_weight_kg);
  const h = Number(a.height_cm);
  if (!w || !h) return null;
  return Math.round((w / Math.pow(h / 100, 2)) * 10) / 10;
}

const isUrl = (v: unknown): v is string =>
  typeof v === "string" && /^https?:\/\//i.test(v.trim());

/** A nice label for an uploaded-file link, from the answer key. */
function fileLinkLabel(key: string): string {
  return /evidence|prescription|upload|image|photo|file|document/i.test(key)
    ? "View file"
    : "Open link";
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
            <dd className="min-w-0 break-words text-[#4b5563]">
              {isUrl(v) ? (
                <a
                  href={String(v).trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-[#142e2a] underline hover:no-underline"
                >
                  {fileLinkLabel(k)}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M7 17L17 7M17 7H8M17 7v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              ) : (
                answerText(k, v)
              )}
            </dd>
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
  batches,
}: {
  o: DispatchOrder;
  onDispatched: (id: number, tracking: string) => void;
  batches: InventoryBatch[];
}) {
  const [busy, setBusy] = useState(false);
  const [batch, setBatch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  // Inline delivery-address capture for orders whose saved address is
  // incomplete (so DPD can't create a label). Lets staff fix it here.
  const [addrOpen, setAddrOpen] = useState(false);
  const [addrInput, setAddrInput] = useState(o.shippingAddress ?? "");
  const [savingAddr, setSavingAddr] = useState(false);
  const [localAddr, setLocalAddr] = useState<string | null>(o.shippingAddress);
  const [localCanDispatch, setLocalCanDispatch] = useState(o.canDispatch);
  // When the dispensing (medicine) label was last printed — persisted on the
  // consultation, so the "printed" state survives a reload.
  const [dispensedAt, setDispensedAt] = useState<string | null>(
    typeof o.consultation?.answers?._dispensing_printed_at === "string"
      ? (o.consultation.answers._dispensing_printed_at as string)
      : null,
  );

  async function saveAddress() {
    const addr = addrInput.trim();
    if (!addr || savingAddr || !o.orderId) return;
    setSavingAddr(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin-tools/record?type=orders&id=${o.orderId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ fields: { shipping_address: addr } }),
        },
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.ok) throw new Error(j?.error ?? "Could not save address");
      setLocalAddr(addr);
      setLocalCanDispatch(true); // DPD re-validates the saved address on dispatch
      setAddrOpen(false);
      setNote("Delivery address saved — you can dispatch now.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingAddr(false);
    }
  }

  const printDispensing = useCallback(async () => {
    if (busy) return;
    // Print first — synchronous, inside the click gesture.
    const patient = o.customerName?.trim() || "—";
    const date = dispensingDate();
    const labels: LabelData[] = (o.items.length ? o.items : [{ title: null, dose: null, quantity: 1 }]).map(
      (it): LabelData => {
        const { brand, productLine } = composeMedicine(it.title, it.dose);
        return { brand, productName: productLine, patientName: patient, date, batchNumber: batch || null };
      },
    );
    printLabels(labels);
    // Record the print only — this does NOT dispatch. The patient stays here
    // until the DPD dispatch label is created (tracking is compulsory).
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin-tools/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ consultationId: o.id, stage: "dispensing" }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? `Failed to record the print (HTTP ${res.status})`);
      }
      setDispensedAt(new Date().toISOString());
      setNote("Dispensing label printed — now print the dispatch label to send it.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  }, [busy, batch, o.id, o.customerName, o.items]);

  const dispatch = useCallback(async () => {
    if (busy) return;
    if (!o.orderId) {
      setError("No order/address on file — can't create a DPD label for this patient yet.");
      return;
    }
    if (!localCanDispatch) {
      setError("Delivery address is incomplete (missing street/town) — add it below, then dispatch.");
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
        body: JSON.stringify({ consultationId: o.id, orderId: o.orderId, trackingNumber: j.trackingNumber }),
      }).catch(() => {});
      setNote(`Dispatched · Tracking ${j.trackingNumber}`);
      onDispatched(o.id, j.trackingNumber);
      // Dispatch queue −1, Dispatched +1 in the sidebar, instantly.
      refreshAdminBadges();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  }, [busy, o.id, o.orderId, localCanDispatch, o.orderNumber, onDispatched]);

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
            {/* Supply-type tag — Reorder vs New Supply, as a pill (not inline text). */}
            {supplyTypeOf(o.orderNumber) === "Reorder" ? (
              <span className="rounded-full bg-[#ffea8a] px-2.5 py-0.5 text-[12px] font-semibold text-[#5c4813]">
                Reorder
              </span>
            ) : (
              <span className="rounded-full bg-[#e3e3e3] px-2.5 py-0.5 text-[12px] font-semibold text-[#303030]">
                New Supply
              </span>
            )}
            {isRedFlagOrder(o.orderNumber) && (
              <span className="rounded-full bg-[#fcd7d5] px-2.5 py-0.5 text-[12px] font-semibold text-[#8e1f0b]">
                Red flag
              </span>
            )}
            {!o.hasOrder && (
              <span
                title="Approved, but no paid order yet — dispensing label only; DPD needs an order with a delivery address."
                className="inline-flex items-center gap-1 rounded-full bg-[#fef3c7] px-2.5 py-0.5 text-[12px] font-semibold text-[#8a6116]"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                </svg>
                No order — dispensing only
              </span>
            )}
          </div>
          {o.customerEmail && <p className="mt-0.5 text-[12px] text-[#6b7280]">{o.customerEmail}</p>}
          <p className="text-[11px] text-[#9ca3af]">
            Approved: {fmtDateTime(o.createdAt)}
            {o.hasOrder
              ? `${o.orderNumber ? ` · ${orderNumberDisplay(o.orderNumber)}` : ""} · ${gbp(o.total)}`
              : " · No order on file"}
          </p>
          {/* Medicine + price at a glance — what the patient bought. */}
          {(() => {
            const list = itemsForCard(o);
            const med = list.length
              ? list
                  .map(
                    (it) =>
                      `${it.title ?? "Medication"}${it.dose ? ` ${it.dose}` : ""}${it.quantity > 1 ? ` ×${it.quantity}` : ""}`,
                  )
                  .join(", ")
              : null;
            if (!med) return null;
            return (
              <p className="mt-1.5 text-[13px] font-semibold text-[#142e2a]">
                {med}
                {o.hasOrder ? <span className="ml-2 text-[#4a5c46]">{gbp(o.total)}</span> : null}
              </p>
            );
          })()}
        </div>

        {/* Top-right actions */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex flex-wrap items-center justify-end gap-2">
            {/* Which stock batch is being dispensed — prints on the label. */}
            <select
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              title="Select the stock batch being dispensed"
              className="rounded-lg border border-[#142e2a]/30 bg-white px-2.5 py-1.5 text-[13px] font-medium text-[#142e2a]"
            >
              <option value="">Batch…</option>
              {batches.map((b) => (
                <option key={b.batchNumber} value={b.batchNumber}>
                  {b.medicineName ? `${b.medicineName} · ` : ""}
                  {b.batchNumber}
                  {b.expiryDate ? ` (exp ${new Date(b.expiryDate).toLocaleDateString("en-GB")})` : ""}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={printDispensing}
              disabled={busy}
              className={`rounded-lg border px-4 py-1.5 text-[13px] font-semibold transition-colors disabled:opacity-60 ${
                dispensedAt
                  ? "border-[#cfe0b8] bg-[#eef3e6] text-[#2f5d2f] hover:border-[#b9d19a]"
                  : "border-[#142e2a]/30 bg-white text-[#142e2a] hover:border-[#142e2a] hover:bg-[#f7f9f2]"
              }`}
              title={
                dispensedAt
                  ? "Dispensing label already printed — click to reprint"
                  : "Print the medicine (dispensing) label"
              }
            >
              {dispensedAt ? "Dispensing label printed ✓" : "1. Print dispensing label"}
            </button>
            {o.hasOrder && !localCanDispatch ? (
              <button
                type="button"
                onClick={() => {
                  setAddrInput(localAddr ?? "");
                  setAddrOpen((v) => !v);
                }}
                className="rounded-lg border border-[#8a6116]/40 bg-[#fef3c7] px-4 py-1.5 text-[13px] font-semibold text-[#8a6116] transition-colors hover:bg-[#fde9a8]"
              >
                Add delivery address
              </button>
            ) : null}
            <button
              type="button"
              onClick={dispatch}
              disabled={busy || !localCanDispatch}
              title={
                localCanDispatch
                  ? undefined
                  : o.hasOrder
                    ? "Delivery address is incomplete — add it to enable DPD"
                    : "No order/address on file for this patient"
              }
              className="rounded-lg bg-[#142e2a] px-4 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#0c2421] disabled:opacity-40"
            >
              {busy ? "Dispatching…" : "2. Print dispatch label"}
            </button>
          </div>
          {addrOpen ? (
            <div className="mt-1 w-full max-w-[340px]">
              <textarea
                rows={4}
                value={addrInput}
                onChange={(e) => setAddrInput(e.target.value)}
                placeholder={"House/flat, street\nTown\nPostcode"}
                className="w-full rounded-[8px] border border-[#d3dabe] px-3 py-2 text-[13px] text-[#142e2a] outline-none focus:border-[#142e2a]"
              />
              <div className="mt-1 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddrOpen(false)}
                  className="rounded-lg border border-[#d0d3d6] bg-white px-3 py-1 text-[12px] font-medium text-[#616161]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveAddress}
                  disabled={savingAddr || addrInput.trim().length < 5}
                  className="rounded-lg bg-[#142e2a] px-3 py-1 text-[12px] font-semibold text-white disabled:opacity-50"
                >
                  {savingAddr ? "Saving…" : "Save address"}
                </button>
              </div>
            </div>
          ) : !localCanDispatch ? (
            <span className="max-w-[280px] text-right text-[11px] text-[#9ca3af]">
              {o.hasOrder
                ? "Incomplete delivery address — add it to enable DPD."
                : "No order/address on file — DPD label unavailable."}
            </span>
          ) : null}
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
                {(() => {
                  const list = itemsForCard(o);
                  return list.length ? (
                    <ul className="space-y-0.5">
                      {list.map((it, i) => (
                        <li key={i} className="text-[13px] text-[#303030]">
                          {it.title ?? "Item"}{it.dose ? ` · ${it.dose}` : ""} × {it.quantity}
                          {!o.items.length ? (
                            <span className="ml-1 text-[11px] text-[#9ca3af]">(from consultation)</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[13px] text-[#9ca3af]">No items on record.</p>
                  );
                })()}
              </div>
              <div className="rounded-lg border border-[#e5e7eb] px-3 py-2.5">
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[#6b7280]">Delivery address</p>
                {localAddr?.trim() ? (
                  <p className="whitespace-pre-line text-[13px] text-[#303030]">
                    {localAddr.trim()}
                  </p>
                ) : o.hasOrder ? (
                  <p className="text-[13px] text-[#9ca3af]">
                    No/incomplete delivery address — use “Add delivery address” above to enable DPD.
                  </p>
                ) : (
                  <p className="text-[13px] text-[#9ca3af]">
                    No delivery address — this patient has no linked order yet.
                  </p>
                )}
                {o.customerPhone && <p className="mt-1 text-[12px] text-[#6b7280]">{o.customerPhone}</p>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const PAGE_SIZE = 20;

export default function DispatchQueuePage() {
  const [orders, setOrders] = useState<DispatchOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [dateFilter, setDateFilter] = useState(""); // yyyy-mm-dd, "" = any date
  const [page, setPage] = useState(1);
  const [batches, setBatches] = useState<InventoryBatch[]>([]);

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

  // Load the pharmacy stock batches once, for the dispensing-label dropdown.
  useEffect(() => {
    let off = false;
    fetch("/api/admin-tools/inventory", { credentials: "include", cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (!off && j?.ok && Array.isArray(j.items)) {
          setBatches(
            (j.items as Array<Record<string, unknown>>)
              .filter((it) => typeof it.batchNumber === "string" && it.batchNumber)
              .map((it) => ({
                medicineName: (it.medicineName as string) ?? null,
                batchNumber: it.batchNumber as string,
                expiryDate: (it.expiryDate as string) ?? null,
              })),
          );
        }
      })
      .catch(() => {});
    return () => {
      off = true;
    };
  }, []);

  const awaiting = useMemo(() => {
    let list = orders.filter((o) => !o.dispatched);
    const term = q.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (o) =>
          (o.customerName ?? "").toLowerCase().includes(term) ||
          (o.orderNumber ?? "").toLowerCase().includes(term) ||
          (o.customerEmail ?? "").toLowerCase().includes(term),
      );
    }
    if (dateFilter) {
      // Match the approval/created calendar date (local time).
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
        <h1 className="text-[22px] font-bold tracking-tight text-[#1a1a1a]">To Dispatch</h1>
        <p className="mt-1 text-[14px] text-[#616161]">
          Patients approved for supply in the clinical queue. Two steps, both
          required: <strong>1. Print dispensing label</strong> for the pack, then{" "}
          <strong>2. Print dispatch label</strong> to create the DPD parcel label
          and tracking number. A patient only moves to Dispatched once the
          dispatch label exists — so every parcel is trackable. Patients without
          an order or a complete delivery address stay here until that&apos;s
          fixed.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder="Search by name, email or order number…"
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
      ) : awaiting.length === 0 ? (
        <p className="rounded-[10px] border border-dashed border-[#cdd1d5] bg-white/60 px-4 py-8 text-center text-[14px] text-[#8a8f94]">
          No orders awaiting dispatch.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {awaiting.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((o) => (
              <OrderCard
                key={o.id}
                o={o}
                batches={batches}
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
          <Pagination
            page={page}
            totalPages={Math.max(1, Math.ceil(awaiting.length / PAGE_SIZE))}
            onPage={setPage}
          />
        </>
      )}
    </div>
  );
}
