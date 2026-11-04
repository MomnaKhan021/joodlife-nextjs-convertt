"use client";

/**
 * Create DPD label — a DPD label for a parcel that isn't tied to an order
 * (a replacement, a resend, samples). Type the recipient and address, the
 * label prints straight away, and nothing about any order changes. Labels
 * made here are listed underneath to track or reprint. Admin-only, like
 * the order DPD label.
 */

import { useCallback, useEffect, useState } from "react";

import { printHtmlDocument } from "../orders/[id]/dispensingLabel";
import Pagination from "../Pagination";

type ManualLabel = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string;
  reference: string | null;
  weightKg: number | null;
  trackingNumber: string;
  shipmentId: number;
  createdBy: string | null;
  createdAt: string;
};

const EMPTY = {
  name: "",
  phone: "",
  email: "",
  addressLine1: "",
  addressLine2: "",
  town: "",
  county: "",
  postcode: "",
  reference: "",
  deliveryInstructions: "",
  weightKg: "",
};
type Form = typeof EMPTY;

const PAGE_SIZE = 20;

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(+d)) return "—";
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

const inputCls =
  "h-10 w-full rounded-[8px] border border-[#d0d3d6] bg-white px-3 text-[14px] outline-none focus:border-[#142e2a]";

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-[#303030]">
        {label}
        {required ? <span className="text-[#b91c1c]"> *</span> : null}
      </span>
      {children}
      {hint ? <span className="text-[12px] text-[#8a8f94]">{hint}</span> : null}
    </label>
  );
}

export default function DpdLabelsPage() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [labels, setLabels] = useState<ManualLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [reprinting, setReprinting] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // State is only set once the request settles (the first load runs from an
  // effect); the Refresh button shows its own loading state first.
  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/admin-tools/dpd-label/manual", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setLabels(j.labels ?? []);
      setListError(null);
    } catch (e) {
      setListError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (creating) return;
    setError(null);
    setDone(null);
    setCreating(true);
    try {
      const r = await fetch("/api/admin-tools/dpd-label/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          ...form,
          weightKg: form.weightKg.trim() ? Number(form.weightKg) : undefined,
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || `HTTP ${r.status}`);
      if (j.labelHtml) printHtmlDocument(String(j.labelHtml), { keepScripts: true });
      setDone(`DPD label created for ${form.name} · Tracking ${j.trackingNumber}`);
      setForm(EMPTY);
      setPage(1);
      void load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  }

  async function reprint(l: ManualLabel) {
    if (reprinting) return;
    setReprinting(l.id);
    setListError(null);
    try {
      const r = await fetch("/api/admin-tools/dpd-label/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reprint", id: l.id }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || `HTTP ${r.status}`);
      if (j.labelHtml) printHtmlDocument(String(j.labelHtml), { keepScripts: true });
    } catch (e) {
      setListError(e instanceof Error ? e.message : String(e));
    } finally {
      setReprinting(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1000px] px-5 py-6 md:px-8 md:py-8">
      <header className="mb-5">
        <h1 className="text-[22px] font-bold tracking-tight text-[#1a1a1a]">Create DPD label</h1>
        <p className="mt-1 text-[14px] text-[#616161]">
          Make a DPD label without an order, e.g. for a replacement, a resend or samples. The label
          prints straight away. No order is created or changed, and the customer gets no email.
        </p>
      </header>

      <form onSubmit={create} className="mb-8 rounded-[12px] border border-[#e5e7eb] bg-white p-5 md:p-6">
        <h2 className="mb-4 text-[15px] font-semibold text-[#1a1a1a]">Recipient</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Full name" required>
            <input className={inputCls} value={form.name} onChange={set("name")} maxLength={35} autoComplete="off" required />
          </Field>
          <Field label="Phone" hint="Given to DPD as the recipient's contact number">
            <input className={inputCls} value={form.phone} onChange={set("phone")} inputMode="tel" maxLength={30} autoComplete="off" />
          </Field>
          <Field label="Email" hint="Kept with the label for your records">
            <input className={inputCls} value={form.email} onChange={set("email")} type="email" maxLength={200} autoComplete="off" />
          </Field>
          <Field label="Your reference" hint="Printed on the label, e.g. REPLACEMENT-1042 (25 characters max)">
            <input className={inputCls} value={form.reference} onChange={set("reference")} maxLength={25} autoComplete="off" />
          </Field>
        </div>

        <h2 className="mb-4 mt-6 text-[15px] font-semibold text-[#1a1a1a]">Delivery address (UK)</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Address line 1" required>
            <input className={inputCls} value={form.addressLine1} onChange={set("addressLine1")} maxLength={35} autoComplete="off" required />
          </Field>
          <Field label="Address line 2">
            <input className={inputCls} value={form.addressLine2} onChange={set("addressLine2")} maxLength={35} autoComplete="off" />
          </Field>
          <Field label="Town / city" required>
            <input className={inputCls} value={form.town} onChange={set("town")} maxLength={35} autoComplete="off" required />
          </Field>
          <Field label="County">
            <input className={inputCls} value={form.county} onChange={set("county")} maxLength={35} autoComplete="off" />
          </Field>
          <Field label="Postcode" required>
            <input
              className={`${inputCls} uppercase`}
              value={form.postcode}
              onChange={set("postcode")}
              maxLength={8}
              autoComplete="off"
              required
            />
          </Field>
        </div>

        <h2 className="mb-4 mt-6 text-[15px] font-semibold text-[#1a1a1a]">Parcel</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Weight (kg)" hint="Leave empty for the usual parcel weight">
            <input
              className={inputCls}
              value={form.weightKg}
              onChange={set("weightKg")}
              type="number"
              min={0.1}
              max={30}
              step={0.1}
              placeholder="0.5"
            />
          </Field>
          <Field label="Delivery instructions" hint="For the driver, 50 characters max">
            <input className={inputCls} value={form.deliveryInstructions} onChange={set("deliveryInstructions")} maxLength={50} autoComplete="off" />
          </Field>
        </div>

        {error && (
          <div className="mt-5 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</div>
        )}
        {done && (
          <div className="mt-5 rounded-[10px] border border-green-200 bg-green-50 px-4 py-3 text-[13px] text-green-800">{done}</div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={creating}
            className="h-10 rounded-[8px] bg-[#142e2a] px-5 text-[14px] font-semibold text-white hover:bg-[#0c2421] disabled:opacity-60"
          >
            {creating ? "Creating label…" : "Create & print DPD label"}
          </button>
          <button
            type="button"
            onClick={() => { setForm(EMPTY); setError(null); setDone(null); }}
            disabled={creating}
            className="h-10 rounded-[8px] border border-[#d0d3d6] bg-white px-4 text-[14px] font-medium hover:bg-[#f7f7f7] disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      </form>

      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[16px] font-semibold text-[#1a1a1a]">Labels made here</h2>
        <button
          type="button"
          onClick={() => { setLoading(true); setListError(null); void load(); }}
          disabled={loading}
          className="h-9 rounded-[8px] border border-[#d0d3d6] bg-white px-3 text-[13px] font-medium hover:bg-[#f7f7f7] disabled:opacity-50"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {listError && (
        <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{listError}</div>
      )}

      {loading ? (
        <p className="text-[14px] text-[#616161]">Loading labels…</p>
      ) : labels.length === 0 ? (
        <p className="rounded-[10px] border border-dashed border-[#cdd1d5] bg-white/60 px-4 py-8 text-center text-[14px] text-[#8a8f94]">
          No labels made here yet.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-[12px] border border-[#e5e7eb] bg-white">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#e5e7eb] text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
                  <th className="px-4 py-2.5">Recipient</th>
                  <th className="px-4 py-2.5">Address</th>
                  <th className="px-4 py-2.5">Reference</th>
                  <th className="px-4 py-2.5">Created</th>
                  <th className="px-4 py-2.5">Tracking</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {labels.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((l) => (
                  <tr key={l.id} className="border-b border-[#f1f2f4] text-[13px] last:border-0">
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium text-[#1a1a1a]">{l.name}</div>
                      {l.email || l.phone ? <div className="text-[12px] text-[#8a8f94]">{l.email || l.phone}</div> : null}
                    </td>
                    <td className="max-w-[260px] px-4 py-3 align-top text-[#303030]">{l.address}</td>
                    <td className="px-4 py-3 align-top text-[#303030]">{l.reference || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 align-top text-[#303030]">
                      {fmtDateTime(l.createdAt)}
                      {l.createdBy ? <div className="text-[12px] text-[#8a8f94]">{l.createdBy}</div> : null}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <a
                        href={`https://track.dpd.co.uk/parcels/${encodeURIComponent(l.trackingNumber)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-[12px] text-[#142e2a] underline underline-offset-2"
                      >
                        {l.trackingNumber}
                      </a>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right align-top">
                      <button
                        type="button"
                        onClick={() => reprint(l)}
                        disabled={reprinting !== null}
                        className="h-8 rounded-[8px] border border-[#d0d3d6] bg-white px-3 text-[12px] font-medium hover:bg-[#f7f7f7] disabled:opacity-50"
                      >
                        {reprinting === l.id ? "Printing…" : "Reprint"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={Math.ceil(labels.length / PAGE_SIZE)} onPage={setPage} />
        </>
      )}
    </div>
  );
}
