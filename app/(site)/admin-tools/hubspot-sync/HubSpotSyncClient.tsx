"use client";

import { useCallback, useRef, useState } from "react";

type PageResult = {
  ok: boolean;
  fetched: number;
  inserted: number;
  updated: number;
  errors: string[];
  nextAfter?: string | null;
  error?: string;
  status?: number;
};

type Stats = {
  pages: number;
  fetched: number;
  inserted: number;
  updated: number;
  errors: string[];
};

const ZERO: Stats = {
  pages: 0,
  fetched: 0,
  inserted: 0,
  updated: 0,
  errors: [],
};

export default function HubSpotSyncClient() {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState<Stats>(ZERO);
  const [fatal, setFatal] = useState<string | null>(null);
  const cancelRef = useRef(false);

  const start = useCallback(async () => {
    cancelRef.current = false;
    setRunning(true);
    setDone(false);
    setFatal(null);
    setStats(ZERO);

    let after: string | undefined = undefined;
    const acc: Stats = { ...ZERO, errors: [] };

    try {
      // Bound the loop hard — 1000 pages × 100 contacts = 100k contacts
      // is a comfortable ceiling that prevents an unbounded HubSpot
      // pagination bug from spinning forever.
      for (let page = 0; page < 1000; page++) {
        if (cancelRef.current) break;

        const res = await fetch("/api/hubspot/sync-contacts", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ limit: 100, after }),
        });

        const json = (await res.json()) as PageResult;

        if (!res.ok || !json.ok) {
          setFatal(
            json.error ??
              `Sync failed (HTTP ${res.status}${
                json.status ? ` · HubSpot ${json.status}` : ""
              })`
          );
          break;
        }

        acc.pages += 1;
        acc.fetched += json.fetched ?? 0;
        acc.inserted += json.inserted ?? 0;
        acc.updated += json.updated ?? 0;
        if (json.errors?.length) acc.errors.push(...json.errors);

        // Snapshot into state so the UI updates after each page.
        setStats({ ...acc, errors: [...acc.errors] });

        if (!json.nextAfter) break;
        after = json.nextAfter;
      }
    } catch (err) {
      setFatal(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
      setDone(true);
    }
  }, []);

  const cancel = useCallback(() => {
    cancelRef.current = true;
  }, []);

  return (
    <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
      {/* Left: action card */}
      <section className="rounded-2xl border border-[#142e2a]/10 bg-white p-6 md:p-8">
        <h2 className="font-display text-[20px] font-semibold text-[#142e2a]">
          Bulk import
        </h2>
        <p className="mt-2 font-ui text-[14px] text-[#142e2a]/75">
          Each batch pulls 100 contacts from HubSpot and upserts them into
          your users table. The job continues automatically until every
          page is processed.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={start}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-full bg-[#142e2a] px-6 py-3 font-ui text-[14px] font-semibold text-white transition hover:bg-[#1d3f3a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {running ? (
              <>
                <Spinner /> Syncing…
              </>
            ) : done ? (
              "Sync again"
            ) : (
              "Start sync"
            )}
          </button>
          {running ? (
            <button
              type="button"
              onClick={cancel}
              className="inline-flex items-center rounded-full border border-[#142e2a]/20 px-5 py-3 font-ui text-[14px] font-semibold text-[#142e2a] transition hover:border-[#142e2a]/40"
            >
              Stop
            </button>
          ) : null}
          {done && !fatal ? (
            <a
              href="/admin/collections/users"
              className="inline-flex items-center rounded-full border border-[#142e2a]/20 px-5 py-3 font-ui text-[14px] font-semibold text-[#142e2a] transition hover:border-[#142e2a]/40"
            >
              Open Users in CMS →
            </a>
          ) : null}
        </div>

        {fatal ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 font-ui text-[13px] text-red-800">
            <strong className="font-semibold">Sync stopped.</strong>{" "}
            {fatal}
          </div>
        ) : null}

        {stats.errors.length > 0 ? (
          <details className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 font-ui text-[13px] text-amber-900">
            <summary className="cursor-pointer font-semibold">
              {stats.errors.length} per-row error
              {stats.errors.length === 1 ? "" : "s"}
            </summary>
            <ul className="mt-3 space-y-1 font-mono text-[12px] leading-relaxed">
              {stats.errors.slice(0, 50).map((e, i) => (
                <li key={i} className="break-all">
                  • {e}
                </li>
              ))}
              {stats.errors.length > 50 ? (
                <li className="opacity-70">
                  …and {stats.errors.length - 50} more (truncated)
                </li>
              ) : null}
            </ul>
          </details>
        ) : null}
      </section>

      {/* Right: live stats */}
      <aside className="rounded-2xl border border-[#142e2a]/10 bg-[#f7f9f2] p-6">
        <h2 className="font-ui text-[12px] font-semibold uppercase tracking-[0.06em] text-[#142e2a]/60">
          Progress
        </h2>
        <dl className="mt-4 space-y-3 font-ui text-[14px]">
          <Row label="Pages" value={stats.pages} />
          <Row label="Fetched" value={stats.fetched} />
          <Row label="Inserted" value={stats.inserted} accent="green" />
          <Row label="Updated" value={stats.updated} accent="blue" />
          <Row
            label="Errors"
            value={stats.errors.length}
            accent={stats.errors.length ? "red" : undefined}
          />
        </dl>

        {done && !fatal ? (
          <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-3 font-ui text-[13px] text-emerald-900">
            ✓ Sync complete. {stats.inserted} new, {stats.updated} updated.
          </p>
        ) : null}
      </aside>
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "green" | "blue" | "red";
}) {
  const color =
    accent === "green"
      ? "text-emerald-700"
      : accent === "blue"
        ? "text-sky-700"
        : accent === "red"
          ? "text-red-700"
          : "text-[#142e2a]";
  return (
    <div className="flex items-baseline justify-between border-b border-[#142e2a]/10 pb-2 last:border-b-0 last:pb-0">
      <dt className="text-[#142e2a]/65">{label}</dt>
      <dd className={`font-display text-[22px] font-semibold ${color}`}>
        {value.toLocaleString()}
      </dd>
    </div>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
    />
  );
}
