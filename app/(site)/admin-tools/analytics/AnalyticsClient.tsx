"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * "Metrics to monitor daily" dashboard.
 *
 * Live KPIs + charts computed from the store's own database via
 * /api/admin-tools/metrics (orders, consultations, customers), with a
 * day/period switcher (Today = hourly buckets; 7/30/90 days = daily).
 *
 * Metrics that live in external tools (GA4 sessions, ad-platform CPL /
 * ROAS, email/SMS rates, Trustpilot, satisfaction surveys) are laid out
 * as placeholder tiles so the morning-review checklist stays complete —
 * they light up once those integrations are connected.
 */

type Kpis = {
  revenue: number;
  orders: number;
  aov: number | null;
  consultations: number;
  approved: number;
  declined: number;
  pending: number;
  conversionRate: number | null;
  repeatRate: number | null;
  newCustomers: number;
};

type Bucket = { label: string; orders: number; revenue: number; consultations: number };

type MetricsResponse = {
  ok: boolean;
  error?: string;
  detail?: string;
  days?: number;
  kpis?: Kpis;
  series?: Bucket[];
};

const RANGES = [
  { days: 1, label: "Today" },
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
] as const;

const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});
const gbp2 = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 2,
});

function pct(v: number | null | undefined) {
  return v === null || v === undefined ? "—" : `${v.toFixed(1)}%`;
}

/* ------------------------------------------------------------------ */
/* KPI card                                                            */
/* ------------------------------------------------------------------ */

function KpiCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-[12px] border p-4 ${
        accent
          ? "border-[#142e2a] bg-[#142e2a] text-white"
          : "border-[#e1e3e5] bg-white text-[#1a1a1a]"
      }`}
    >
      <p className={`text-[12px] font-medium ${accent ? "text-[#d3dabe]" : "text-[#616161]"}`}>
        {label}
      </p>
      <p className="mt-1 font-display text-[24px] font-semibold leading-tight md:text-[28px]">
        {value}
      </p>
      {hint ? (
        <p className={`mt-1 text-[11px] leading-snug ${accent ? "text-white/60" : "text-[#8a8f94]"}`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SVG charts (no chart lib — brand-coloured, responsive via viewBox)  */
/* ------------------------------------------------------------------ */

const W = 720;
const H = 220;
const PAD = { top: 16, right: 12, bottom: 26, left: 44 };

function niceMax(n: number) {
  if (n <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(n));
  const norm = n / mag;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return step * mag;
}

function LineChart({
  series,
  field,
  money,
}: {
  series: Bucket[];
  field: "revenue" | "consultations";
  money?: boolean;
}) {
  const values = series.map((b) => b[field]);
  const max = niceMax(Math.max(...values, 0));
  const iw = W - PAD.left - PAD.right;
  const ih = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (series.length > 1 ? (i / (series.length - 1)) * iw : iw / 2);
  const y = (v: number) => PAD.top + ih - (v / max) * ih;

  const path = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${path} L${x(values.length - 1).toFixed(1)} ${PAD.top + ih} L${x(0).toFixed(1)} ${PAD.top + ih} Z`;

  // ~6 x-axis labels max so they never collide
  const stride = Math.max(1, Math.ceil(series.length / 6));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`${field} over time`}>
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <g key={f}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={PAD.top + ih - f * ih}
            y2={PAD.top + ih - f * ih}
            stroke="#e9ebed"
            strokeWidth="1"
          />
          <text
            x={PAD.left - 8}
            y={PAD.top + ih - f * ih + 4}
            textAnchor="end"
            fontSize="10"
            fill="#8a8f94"
            fontFamily="inherit"
          >
            {money ? gbp.format(max * f) : Math.round(max * f)}
          </text>
        </g>
      ))}
      <path d={area} fill="#42746d" opacity="0.12" />
      <path d={path} fill="none" stroke="#142e2a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {values.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={series.length > 40 ? 0 : 2.6} fill="#142e2a" />
      ))}
      {series.map((b, i) =>
        i % stride === 0 ? (
          <text
            key={i}
            x={x(i)}
            y={H - 8}
            textAnchor="middle"
            fontSize="10"
            fill="#8a8f94"
            fontFamily="inherit"
          >
            {b.label}
          </text>
        ) : null,
      )}
    </svg>
  );
}

function BarChart({ series }: { series: Bucket[] }) {
  const values = series.map((b) => b.orders);
  const max = niceMax(Math.max(...values, 0));
  const iw = W - PAD.left - PAD.right;
  const ih = H - PAD.top - PAD.bottom;
  const bw = Math.min(28, (iw / series.length) * 0.62);
  const x = (i: number) => PAD.left + ((i + 0.5) / series.length) * iw;
  const stride = Math.max(1, Math.ceil(series.length / 6));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Orders over time">
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={PAD.top + ih - f * ih}
            y2={PAD.top + ih - f * ih}
            stroke="#e9ebed"
            strokeWidth="1"
          />
          <text
            x={PAD.left - 8}
            y={PAD.top + ih - f * ih + 4}
            textAnchor="end"
            fontSize="10"
            fill="#8a8f94"
            fontFamily="inherit"
          >
            {Math.round(max * f)}
          </text>
        </g>
      ))}
      {values.map((v, i) => (
        <rect
          key={i}
          x={x(i) - bw / 2}
          y={PAD.top + ih - (v / max) * ih}
          width={bw}
          height={Math.max(0, (v / max) * ih)}
          rx="3"
          fill="#87af73"
        />
      ))}
      {series.map((b, i) =>
        i % stride === 0 ? (
          <text
            key={i}
            x={x(i)}
            y={H - 8}
            textAnchor="middle"
            fontSize="10"
            fill="#8a8f94"
            fontFamily="inherit"
          >
            {b.label}
          </text>
        ) : null,
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* External-integration tiles                                          */
/* ------------------------------------------------------------------ */

const EXTERNAL: { label: string; source: string }[] = [
  { label: "Website sessions", source: "Google Analytics" },
  { label: "Cost per lead", source: "Ad platform" },
  { label: "Cost per purchase", source: "Ad platform" },
  { label: "ROAS", source: "Ad platform" },
  { label: "Email open rate", source: "Email provider" },
  { label: "Email click rate", source: "Email provider" },
  { label: "SMS click rate", source: "SMS provider" },
  { label: "Trustpilot reviews", source: "Trustpilot" },
  { label: "Patient satisfaction", source: "Survey tool" },
  { label: "Average response time", source: "Support inbox" },
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function AnalyticsClient() {
  const [days, setDays] = useState<number>(7);
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (d: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin-tools/metrics?days=${d}`, {
        credentials: "include",
      });
      const json: MetricsResponse = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.detail ? `${json.error}: ${json.detail}` : json.error ?? `HTTP ${res.status}`);
      }
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(days);
  }, [days, load]);

  const k = data?.kpis;
  const series = useMemo(() => data?.series ?? [], [data]);

  return (
    <main className="min-h-screen bg-[#f1f1f1] px-4 py-6 font-ui text-[#303030] md:px-8">
      <div className="mx-auto w-full max-w-[1100px]">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5">
          <div>
            <h1 className="text-[20px] font-semibold text-[#1a1a1a]">Analytics</h1>
            <p className="text-[13px] text-[#616161]">
              Metrics to monitor daily — live from the store database.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-[10px] border border-[#d0d3d6] bg-white p-0.5">
              {RANGES.map((r) => (
                <button
                  key={r.days}
                  type="button"
                  onClick={() => setDays(r.days)}
                  className={`rounded-[8px] px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    days === r.days
                      ? "bg-[#142e2a] text-white"
                      : "text-[#303030] hover:bg-[#f1f1f1]"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => load(days)}
              disabled={loading}
              className="rounded-[10px] border border-[#d0d3d6] bg-white px-3 py-1.5 text-[13px] font-medium hover:bg-[#f7f7f7] disabled:opacity-50"
            >
              {loading ? "Loading…" : "Refresh"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {error}
          </div>
        ) : null}

        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          <KpiCard
            accent
            label="Revenue"
            value={k ? gbp.format(k.revenue) : "—"}
            hint="Paid orders in the selected period"
          />
          <KpiCard label="Orders" value={k ? String(k.orders) : "—"} />
          <KpiCard
            label="Average order value"
            value={k?.aov != null ? gbp2.format(k.aov) : "—"}
          />
          <KpiCard
            label="Conversion rate"
            value={pct(k?.conversionRate)}
            hint="Consultations → paid orders"
          />
          <KpiCard
            label="Repeat order rate"
            value={pct(k?.repeatRate)}
            hint="Customers with 2+ orders (all-time)"
          />
          <KpiCard label="Consultations" value={k ? String(k.consultations) : "—"} />
          <KpiCard label="Approved" value={k ? String(k.approved) : "—"} />
          <KpiCard label="Declined" value={k ? String(k.declined) : "—"} />
          <KpiCard label="Pending review" value={k ? String(k.pending) : "—"} />
          <KpiCard label="New customers" value={k ? String(k.newCustomers) : "—"} />
        </div>

        {/* Charts */}
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-[12px] border border-[#e1e3e5] bg-white p-4">
            <p className="pb-2 text-[13px] font-semibold text-[#1a1a1a]">Revenue</p>
            {series.length ? <LineChart series={series} field="revenue" money /> : (
              <p className="py-10 text-center text-[13px] text-[#8a8f94]">No data</p>
            )}
          </div>
          <div className="rounded-[12px] border border-[#e1e3e5] bg-white p-4">
            <p className="pb-2 text-[13px] font-semibold text-[#1a1a1a]">Orders</p>
            {series.length ? <BarChart series={series} /> : (
              <p className="py-10 text-center text-[13px] text-[#8a8f94]">No data</p>
            )}
          </div>
          <div className="rounded-[12px] border border-[#e1e3e5] bg-white p-4 lg:col-span-2">
            <p className="pb-2 text-[13px] font-semibold text-[#1a1a1a]">Consultations</p>
            {series.length ? <LineChart series={series} field="consultations" /> : (
              <p className="py-10 text-center text-[13px] text-[#8a8f94]">No data</p>
            )}
          </div>
        </div>

        {/* External metrics — placeholders until integrations connect */}
        <div className="mt-6">
          <p className="pb-2 text-[13px] font-semibold text-[#1a1a1a]">
            Marketing &amp; service metrics
          </p>
          <p className="pb-3 text-[12px] text-[#616161]">
            These come from external tools and appear here automatically once the
            integration is connected.
          </p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {EXTERNAL.map((m) => (
              <div
                key={m.label}
                className="rounded-[12px] border border-dashed border-[#c9cdd1] bg-white/60 p-4"
              >
                <p className="text-[12px] font-medium text-[#616161]">{m.label}</p>
                <p className="mt-1 font-display text-[24px] font-semibold text-[#c1c6ca]">—</p>
                <p className="mt-1 text-[11px] text-[#8a8f94]">Connect {m.source}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
