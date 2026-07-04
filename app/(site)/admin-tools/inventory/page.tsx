"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Inventory management — pharmacy stock batches.
 *
 * Add a batch (medicine name, batch quantity from a fixed dropdown, batch
 * number typed manually, expiry date from a calendar) and see the current
 * stock list. Backed by /api/admin-tools/inventory (Payload "inventory"
 * collection), so entries persist and are shared across all admins.
 */

type InventoryItem = {
  id: number;
  medicineName: string;
  batchNumber: string;
  batchQuantity: number;
  expiryDate: string;
  createdAt: string;
};

// Fixed dropdown steps for batch quantity (per client spec).
const QUANTITY_OPTIONS = [10, 20, 30, 40, 50, 100, 200];

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function isExpired(iso: string) {
  const d = new Date(iso).getTime();
  return Number.isFinite(d) && d < Date.now();
}

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [medicineName, setMedicineName] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [batchQuantity, setBatchQuantity] = useState<string>(String(QUANTITY_OPTIONS[0]));
  const [expiryDate, setExpiryDate] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-tools/inventory", { credentials: "include" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
      setItems(json.items as InventoryItem[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-tools/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          medicineName,
          batchNumber,
          batchQuantity: Number(batchQuantity),
          expiryDate,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
      setMedicineName("");
      setBatchNumber("");
      setBatchQuantity(String(QUANTITY_OPTIONS[0]));
      setExpiryDate("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(id: number) {
    if (!confirm("Remove this batch from inventory?")) return;
    try {
      const res = await fetch(`/api/admin-tools/inventory?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  const label = "mb-1 block text-[13px] font-medium text-[#303030]";
  const input =
    "h-10 w-full rounded-[8px] border border-[#d0d3d6] bg-white px-3 text-[14px] text-[#1a1a1a] outline-none focus:border-[#142e2a] focus:ring-2 focus:ring-[#142e2a]/15";

  return (
    <div className="mx-auto w-full max-w-[1000px] px-5 py-6 md:px-8 md:py-8">
      <header className="mb-6">
        <h1 className="text-[22px] font-bold tracking-tight text-[#1a1a1a]">Inventory</h1>
        <p className="mt-1 text-[14px] text-[#616161]">
          Manage medicine stock batches — name, quantity, batch number and expiry.
        </p>
      </header>

      {/* Add batch */}
      <form
        onSubmit={addItem}
        className="mb-8 rounded-[12px] border border-[#e1e3e5] bg-white p-5"
      >
        <h2 className="mb-4 text-[15px] font-semibold text-[#1a1a1a]">Add a batch</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={label} htmlFor="medicineName">Medicine name</label>
            <input
              id="medicineName"
              className={input}
              value={medicineName}
              onChange={(e) => setMedicineName(e.target.value)}
              placeholder="e.g. Mounjaro 7.5 mg"
              required
            />
          </div>
          <div>
            <label className={label} htmlFor="batchQuantity">Batch quantity</label>
            <select
              id="batchQuantity"
              className={input}
              value={batchQuantity}
              onChange={(e) => setBatchQuantity(e.target.value)}
            >
              {QUANTITY_OPTIONS.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="batchNumber">Batch number</label>
            <input
              id="batchNumber"
              className={input}
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              placeholder="e.g. LOT-2481A"
              required
            />
          </div>
          <div>
            <label className={label} htmlFor="expiryDate">Expiry date</label>
            <input
              id="expiryDate"
              type="date"
              className={input}
              value={expiryDate}
              min={todayISO()}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center justify-center rounded-[8px] bg-[#142e2a] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#0c2421] disabled:opacity-50"
          >
            {saving ? "Adding…" : "Add to inventory"}
          </button>
          {error ? <span className="text-[13px] text-red-600">{error}</span> : null}
        </div>
      </form>

      {/* Stock list */}
      <div className="rounded-[12px] border border-[#e1e3e5] bg-white">
        <div className="flex items-center justify-between border-b border-[#e1e3e5] px-5 py-3">
          <h2 className="text-[15px] font-semibold text-[#1a1a1a]">Current stock</h2>
          <span className="text-[13px] text-[#616161]">{items.length} batches</span>
        </div>
        {loading ? (
          <p className="px-5 py-6 text-[14px] text-[#616161]">Loading…</p>
        ) : items.length === 0 ? (
          <p className="px-5 py-6 text-[14px] text-[#616161]">No batches yet. Add one above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead>
                <tr className="border-b border-[#e1e3e5] text-[12px] uppercase tracking-wide text-[#616161]">
                  <th className="px-5 py-2.5 font-semibold">Medicine</th>
                  <th className="px-5 py-2.5 font-semibold">Batch number</th>
                  <th className="px-5 py-2.5 font-semibold">Quantity</th>
                  <th className="px-5 py-2.5 font-semibold">Expiry</th>
                  <th className="px-5 py-2.5 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-b border-[#f1f1f1] last:border-0">
                    <td className="px-5 py-3 font-medium text-[#1a1a1a]">{it.medicineName}</td>
                    <td className="px-5 py-3 text-[#303030]">{it.batchNumber}</td>
                    <td className="px-5 py-3 text-[#303030]">{it.batchQuantity}</td>
                    <td className="px-5 py-3">
                      <span
                        className={
                          isExpired(it.expiryDate)
                            ? "rounded-md bg-red-50 px-2 py-0.5 text-[13px] font-medium text-red-700"
                            : "text-[#303030]"
                        }
                      >
                        {fmtDate(it.expiryDate)}
                        {isExpired(it.expiryDate) ? " · expired" : ""}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeItem(it.id)}
                        className="text-[13px] font-medium text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
