"use client";

import { useCallback, useState, useTransition } from "react";

import { pushOrdersAction, type PushOrdersActionResult } from "./actions";

/**
 * One-time "Push existing orders to HubSpot" button. Runs as a server action
 * so it carries the admin session server-side (no client-fetch cookie issue).
 * Idempotent — already-pushed orders are skipped, so it's safe to re-run.
 */
export default function PushOrdersButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<PushOrdersActionResult | null>(null);

  const run = useCallback(() => {
    setResult(null);
    startTransition(async () => {
      try {
        setResult(await pushOrdersAction());
      } catch (e) {
        setResult({ ok: false, error: e instanceof Error ? e.message : String(e) });
      }
    });
  }, []);

  return (
    <section className="mt-5 rounded-2xl border border-[#142e2a]/15 bg-white p-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display text-[20px] font-semibold text-[#142e2a]">
            Push existing orders to HubSpot
          </h2>
          <p className="mt-1 max-w-[640px] font-ui text-[13px] text-[#142e2a]/70">
            Sends every order already in your dashboard up to HubSpot (contact +
            deal + order note). Safe to run more than once — orders already sent
            are skipped.
          </p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={pending}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#142e2a] px-6 py-3 font-ui text-[14px] font-semibold text-white transition hover:bg-[#0c2421] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Pushing…" : "Push orders now"}
        </button>
      </div>

      {result && !result.ok ? (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 font-ui text-[13px] text-red-700">
          {result.error}
        </p>
      ) : null}

      {result && result.ok ? (
        <div className="mt-4 rounded-xl bg-[#f7f9f2] px-4 py-3 font-ui text-[13px] text-[#142e2a]">
          <p>
            <strong>{result.pushed}</strong> pushed ·{" "}
            <strong>{result.skipped}</strong> skipped · {result.total} processed
          </p>
          {result.errors.length ? (
            <details className="mt-2">
              <summary className="cursor-pointer text-[#142e2a]/70">
                {result.errors.length} error{result.errors.length === 1 ? "" : "s"}
              </summary>
              <ul className="mt-2 space-y-1 font-mono text-[11px] text-[#142e2a]/80">
                {result.errors.slice(0, 25).map((e, i) => (
                  <li key={i} className="break-all">• {e}</li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
