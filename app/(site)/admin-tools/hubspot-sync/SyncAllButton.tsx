"use client";

import { useCallback, useState } from "react";

/**
 * Single-click "Sync everything from HubSpot" button. Hits
 * /api/hubspot/sync-all, which runs all three pulls (contacts ->
 * users, deals -> orders, consultation custom-objects ->
 * consultations) end-to-end on the server.
 */
type TypeStats = {
  pages: number;
  fetched: number;
  inserted: number;
  updated: number;
  errors: string[];
  fatal?: string;
};

type SyncAllResponse = {
  ok: boolean;
  via?: "admin" | "cron";
  error?: string;
  contacts?: TypeStats;
  orders?: TypeStats;
  consultations?: TypeStats;
};

export default function SyncAllButton() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SyncAllResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const run = useCallback(async () => {
    setRunning(true);
    setErr(null);
    setResult(null);
    try {
      const res = await fetch("/api/hubspot/sync-all", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const json = (await res.json()) as SyncAllResponse;
      if (!res.ok || !json.ok) {
        setErr(json.error ?? `HTTP ${res.status}`);
        return;
      }
      setResult(json);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  }, []);

  return (
    <section className="rounded-2xl border border-[#142e2a] bg-[#142e2a] p-6 text-white md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display text-[22px] font-semibold">
            Sync everything from HubSpot
          </h2>
          <p className="mt-1 max-w-[640px] font-ui text-[13px] text-white/75">
            Runs all three pulls (Contacts → users, Deals → orders,
            Consultations → consultations) on the server in one shot.
            Use this if any of the dashboards looks empty.
          </p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={running}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 font-ui text-[14px] font-semibold text-[#142e2a] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {running ? (
            <>
              <Spinner /> Syncing all…
            </>
          ) : (
            "Sync now"
          )}
        </button>
      </div>

      {err ? (
        <p className="mt-5 rounded-xl bg-red-500/15 px-4 py-3 font-ui text-[13px] text-red-100">
          {err}
        </p>
      ) : null}

      {result ? (
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Card title="Contacts" stats={result.contacts} />
          <Card title="Orders" stats={result.orders} />
          <Card title="Consultations" stats={result.consultations} />
        </div>
      ) : null}
    </section>
  );
}

function Card({ title, stats }: { title: string; stats?: TypeStats }) {
  if (!stats) return null;
  const errCount = stats.errors.length;
  return (
    <div className="rounded-xl bg-white/8 p-4">
      <h3 className="font-ui text-[12px] font-semibold uppercase tracking-[0.06em] text-white/60">
        {title}
      </h3>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 font-ui text-[13px]">
        <dt className="text-white/65">Pages</dt>
        <dd className="text-right">{stats.pages}</dd>
        <dt className="text-white/65">Inserted</dt>
        <dd className="text-right text-emerald-200">{stats.inserted}</dd>
        <dt className="text-white/65">Updated</dt>
        <dd className="text-right text-sky-200">{stats.updated}</dd>
        <dt className="text-white/65">Errors</dt>
        <dd className={`text-right ${errCount ? "text-red-200" : ""}`}>
          {errCount}
        </dd>
      </dl>
      {stats.fatal ? (
        <p className="mt-3 break-words rounded-lg bg-red-500/20 p-2 font-mono text-[11px] text-red-100">
          {stats.fatal}
        </p>
      ) : null}
      {errCount ? (
        <details className="mt-3 text-[12px]">
          <summary className="cursor-pointer text-white/70">
            {errCount} per-row error{errCount === 1 ? "" : "s"}
          </summary>
          <ul className="mt-2 space-y-1 font-mono text-[11px] text-white/80">
            {stats.errors.slice(0, 25).map((e, i) => (
              <li key={i} className="break-all">• {e}</li>
            ))}
            {errCount > 25 ? (
              <li className="opacity-70">…and {errCount - 25} more</li>
            ) : null}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#142e2a]/40 border-t-[#142e2a]"
    />
  );
}
