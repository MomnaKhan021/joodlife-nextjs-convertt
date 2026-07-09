"use client";

import { useCallback, useEffect, useState } from "react";

type Check = { name: string; ok: boolean; detail: string; configured: boolean };
type Pending =
  | {
      ok: true;
      total: number;
      byCategory: { booked: number; notbooked: number; reorder: number };
      byAge: { last7Days: number; last30Days: number; olderThan30Days: number };
    }
  | { ok: false; error: string };
type HealthData = { ok: boolean; checks: Check[]; pending: Pending; error?: string };

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white ${
        ok ? "bg-[#0c8f4e]" : "bg-[#dc2626]"
      }`}
    >
      {ok ? "✓" : "✕"}
    </span>
  );
}

export default function HealthClient() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-tools/health", { credentials: "include", cache: "no-store" });
      const json = (await res.json()) as HealthData;
      if (!res.ok || !json.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const n = (v: number) => v.toLocaleString("en-GB");

  return (
    <main className="min-h-screen bg-[#f1f1f1] px-4 py-6 font-ui text-[#303030] md:px-8">
      <div className="mx-auto max-w-[900px]">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold text-[#6d7175]">Admin · Diagnostics</p>
            <h1 className="text-[22px] font-bold tracking-tight text-[#1a1a1a]">System health</h1>
            <p className="mt-1 text-[14px] text-[#616161]">
              Live status of the dashboard integrations, plus the pending-review backlog.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="h-9 shrink-0 rounded-[8px] border border-[#d0d3d6] bg-white px-3 text-[13px] font-medium hover:bg-[#f7f7f7] disabled:opacity-50"
          >
            {loading ? "Checking…" : "Re-check"}
          </button>
        </div>

        {error ? (
          <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {error}
          </div>
        ) : null}

        {loading && !data ? (
          <p className="text-[14px] text-[#616161]">Running checks…</p>
        ) : data ? (
          <>
            {/* Integration checks */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {data.checks.map((c) => (
                <div
                  key={c.name}
                  className="flex items-start gap-3 rounded-[12px] border border-[#e1e3e5] bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.05)]"
                >
                  <StatusDot ok={c.ok} />
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-[#1a1a1a]">{c.name}</p>
                    <p className={`mt-0.5 text-[13px] ${c.ok ? "text-[#4a5c46]" : "text-[#b42318]"}`}>{c.detail}</p>
                    {!c.configured ? (
                      <p className="mt-0.5 text-[12px] text-[#8a8a8a]">Not configured — set the env var on Vercel.</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            {/* Pending backlog breakdown */}
            <div className="mt-4 rounded-[12px] border border-[#e1e3e5] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
              <h2 className="text-[14px] font-semibold text-[#1a1a1a]">Pending clinical review</h2>
              {data.pending.ok ? (
                <>
                  <p className="mt-1 text-[13px] text-[#616161]">
                    <span className="text-[22px] font-bold text-[#1a1a1a]">{n(data.pending.total)}</span> awaiting a
                    decision.
                  </p>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-[#6d7175]">By type</p>
                      <ul className="flex flex-col gap-1 text-[13px]">
                        <li className="flex justify-between"><span>Video consultation booked</span><b>{n(data.pending.byCategory.booked)}</b></li>
                        <li className="flex justify-between"><span>Consultation not booked</span><b>{n(data.pending.byCategory.notbooked)}</b></li>
                        <li className="flex justify-between"><span>Reorder</span><b>{n(data.pending.byCategory.reorder)}</b></li>
                      </ul>
                    </div>
                    <div>
                      <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-[#6d7175]">By age (likely real vs. backlog)</p>
                      <ul className="flex flex-col gap-1 text-[13px]">
                        <li className="flex justify-between"><span>Last 7 days</span><b>{n(data.pending.byAge.last7Days)}</b></li>
                        <li className="flex justify-between"><span>Last 30 days</span><b>{n(data.pending.byAge.last30Days)}</b></li>
                        <li className="flex justify-between text-[#b42318]"><span>Older than 30 days</span><b>{n(data.pending.byAge.olderThan30Days)}</b></li>
                      </ul>
                    </div>
                  </div>
                  <p className="mt-4 text-[12px] text-[#8a8a8a]">
                    A large &ldquo;older than 30 days&rdquo; number is usually the HubSpot/import backlog rather than live
                    patients — those are the candidates to archive out of pending.
                  </p>
                </>
              ) : (
                <p className="mt-1 text-[13px] text-[#b42318]">Couldn&apos;t read the backlog: {data.pending.error}</p>
              )}
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
