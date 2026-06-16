"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * "Log current weight" form. Posts to /api/weight-logs, then refreshes the
 * server component so the summary cards, trend chart and history table all
 * re-render with the new entry — no client-side chart state to keep in sync.
 */
export default function WeightLogForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState<number | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const weight = Number(value);
    if (!Number.isFinite(weight) || weight < 20 || weight > 500) {
      setError("Enter a valid weight in kg (between 20 and 500).");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/weight-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ weightKg: weight }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error ?? `Could not save (HTTP ${res.status}).`);
      }
      setJustSaved(weight);
      setValue("");
      // Re-run the server component → chart/summary/history update.
      router.refresh();
      // Clear the "saved" flash after a moment.
      setTimeout(() => setJustSaved(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-[#142e2a]/10 bg-white p-5 md:p-6"
    >
      <h3 className="font-ui text-[14px] font-semibold text-[#142e2a]">
        Log your current weight
      </h3>
      <p className="mt-1 font-ui text-[13px] text-[#142e2a]/65">
        Enter today&apos;s weight in kilograms. It&apos;s saved to your history
        and your trend chart updates instantly.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1">
          <label htmlFor="weightKg" className="sr-only">
            Current weight (kg)
          </label>
          <div className="relative">
            <input
              id="weightKg"
              name="weightKg"
              type="number"
              inputMode="decimal"
              step="0.1"
              min={20}
              max={500}
              placeholder="e.g. 82.5"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              aria-invalid={Boolean(error) || undefined}
              className={`h-12 w-full rounded-lg bg-white px-4 pr-12 font-ui text-[15px] text-[#142e2a] outline-none ring-1 transition-shadow focus:ring-2 ${
                error
                  ? "ring-red-500/60 focus:ring-red-500/70"
                  : "ring-[#142e2a]/15 focus:ring-[#142e2a]/40"
              }`}
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-ui text-[13px] font-medium text-[#142e2a]/45">
              kg
            </span>
          </div>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#142e2a] px-6 font-ui text-[14px] font-semibold text-white transition-all hover:bg-[#0c2421] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {busy ? (
            <>
              <span
                aria-hidden
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
              />
              Saving…
            </>
          ) : (
            "Save weight"
          )}
        </button>
      </div>

      {error ? (
        <p role="alert" className="mt-3 font-ui text-[13px] text-red-700">
          {error}
        </p>
      ) : null}
      {justSaved !== null ? (
        <p
          role="status"
          className="mt-3 font-ui text-[13px] font-medium text-[#1a8c5a]"
        >
          Saved {justSaved} kg ✓
        </p>
      ) : null}
    </form>
  );
}
