"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import TrustpilotTile from "./TrustpilotTile";

/**
 * "Metrics to monitor daily" dashboard.
 *
 * Live KPIs + charts computed from the store's own database via
 * /api/admin-tools/metrics, plus marketing stats from Brevo via
 * /api/admin-tools/marketing. Day/period switcher (Today = hourly buckets;
 * 7/30/90 days = daily). KPI cards deep-link to the relevant admin list.
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

type MarketingResponse = {
  ok: boolean;
  connected?: boolean;
  brevoConnected?: boolean;
  brevoError?: string;
  metaConnected?: boolean;
  metaError?: string;
  brevo?: {
    emailOpenRate: number | null;
    emailClickRate: number | null;
    emailsDelivered: number | null;
    smsDelivered: number | null;
    smsDeliveryRate: number | null;
  };
  meta?: {
    spend: number;
    impressions: number;
    reach: number;
    leads: number;
    purchases: number;
    purchaseValue: number;
    cpl: number | null;
    costPerPurchase: number | null;
    roas: number | null;
  } | null;
  trustpilot?: { rating: number | null; reviews: number | null } | null;
};

const RANGES = [
  { days: 1, label: "Today" },
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
] as const;

/** Either a preset window or an inclusive custom span of calendar days. */
type Range = { kind: "preset"; days: number } | { kind: "custom"; from: string; to: string };

const ymdLocal = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const rangeQuery = (r: Range) =>
  r.kind === "custom"
    ? `from=${encodeURIComponent(r.from)}&to=${encodeURIComponent(r.to)}`
    : `days=${r.days}`;

/** "2026-09-02" → "2 Sep 2026" for the active-range pill. */
const fmtYmd = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

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
const num = new Intl.NumberFormat("en-GB");

function pct(v: number | null | undefined) {
  return v === null || v === undefined ? "—" : `${v.toFixed(1)}%`;
}

/* ------------------------------------------------------------------ */
/* KPI card (optionally a deep link)                                   */
/* ------------------------------------------------------------------ */

function KpiCard({
  label,
  value,
  hint,
  accent,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
  href?: string;
}) {
  const base = `group block rounded-[14px] border p-4 transition-shadow ${
    accent
      ? "border-[#142e2a] bg-gradient-to-br from-[#1c3f39] to-[#142e2a] text-white"
      : "border-[#e6e8ea] bg-white text-[#1a1a1a]"
  } ${href ? "hover:shadow-[0_6px_20px_-8px_rgba(20,46,42,0.35)]" : ""}`;
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <p className={`text-[12px] font-medium ${accent ? "text-[#d3dabe]" : "text-[#616161]"}`}>
          {label}
        </p>
        {href ? (
          <span className={`text-[13px] transition-transform group-hover:translate-x-0.5 ${accent ? "text-[#d3dabe]" : "text-[#b3b8bc]"}`}>
            →
          </span>
        ) : null}
      </div>
      <p className="mt-1 font-display text-[24px] font-semibold leading-tight md:text-[28px]">
        {value}
      </p>
      {hint ? (
        <p className={`mt-1 text-[11px] leading-snug ${accent ? "text-white/60" : "text-[#8a8f94]"}`}>
          {hint}
        </p>
      ) : null}
    </>
  );
  return href ? (
    <Link href={href} className={base}>
      {inner}
    </Link>
  ) : (
    <div className={base}>{inner}</div>
  );
}

/* ------------------------------------------------------------------ */
/* SVG charts — smooth gradient area lines, rounded gradient bars      */
/* ------------------------------------------------------------------ */

const W = 720;
const H = 240;
const PAD = { top: 16, right: 14, bottom: 28, left: 46 };

function niceMax(n: number) {
  if (n <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(n));
  const norm = n / mag;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return step * mag;
}

/** Smooth (Catmull-Rom → cubic bézier) path through the points. */
function smoothPath(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return pts.length ? `M${pts[0].x} ${pts[0].y}` : "";
  let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

function LineChart({
  series,
  field,
  money,
  gradientId,
  stroke,
}: {
  series: Bucket[];
  field: "revenue" | "consultations";
  money?: boolean;
  gradientId: string;
  stroke: string;
}) {
  const values = series.map((b) => b[field]);
  const max = niceMax(Math.max(...values, 0));
  const iw = W - PAD.left - PAD.right;
  const ih = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (series.length > 1 ? (i / (series.length - 1)) * iw : iw / 2);
  const y = (v: number) => PAD.top + ih - (v / max) * ih;
  const pts = values.map((v, i) => ({ x: x(i), y: y(v) }));
  const line = smoothPath(pts);
  const area = pts.length
    ? `${line} L${pts[pts.length - 1].x.toFixed(1)} ${PAD.top + ih} L${pts[0].x.toFixed(1)} ${PAD.top + ih} Z`
    : "";
  const stride = Math.max(1, Math.ceil(series.length / 6));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`${field} over time`}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <g key={f}>
          <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top + ih - f * ih} y2={PAD.top + ih - f * ih} stroke="#eef0f1" strokeWidth="1" />
          <text x={PAD.left - 8} y={PAD.top + ih - f * ih + 4} textAnchor="end" fontSize="10.5" fill="#9aa0a5" fontFamily="inherit">
            {money ? gbp.format(max * f) : Math.round(max * f)}
          </text>
        </g>
      ))}
      {area ? <path d={area} fill={`url(#${gradientId})`} /> : null}
      {line ? <path d={line} fill="none" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /> : null}
      {series.length <= 40
        ? pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill="#fff" stroke={stroke} strokeWidth="1.6" />)
        : null}
      {series.map((b, i) =>
        i % stride === 0 ? (
          <text key={i} x={x(i)} y={H - 9} textAnchor="middle" fontSize="10.5" fill="#9aa0a5" fontFamily="inherit">
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
  const bw = Math.min(26, (iw / series.length) * 0.6);
  const x = (i: number) => PAD.left + ((i + 0.5) / series.length) * iw;
  const stride = Math.max(1, Math.ceil(series.length / 6));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Orders over time">
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#87af73" />
          <stop offset="100%" stopColor="#5f8a52" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top + ih - f * ih} y2={PAD.top + ih - f * ih} stroke="#eef0f1" strokeWidth="1" />
          <text x={PAD.left - 8} y={PAD.top + ih - f * ih + 4} textAnchor="end" fontSize="10.5" fill="#9aa0a5" fontFamily="inherit">
            {Math.round(max * f)}
          </text>
        </g>
      ))}
      {values.map((v, i) => {
        const h = Math.max(0, (v / max) * ih);
        return (
          <rect key={i} x={x(i) - bw / 2} y={PAD.top + ih - h} width={bw} height={h} rx="4" fill="url(#barGrad)" />
        );
      })}
      {series.map((b, i) =>
        i % stride === 0 ? (
          <text key={i} x={x(i)} y={H - 9} textAnchor="middle" fontSize="10.5" fill="#9aa0a5" fontFamily="inherit">
            {b.label}
          </text>
        ) : null,
      )}
    </svg>
  );
}

/** Donut for consultation outcomes (approved / declined / pending). */
function DonutChart({ approved, declined, pending }: { approved: number; declined: number; pending: number }) {
  const segs = [
    { label: "Approved", value: approved, color: "#42746d" },
    { label: "Pending", value: pending, color: "#e2b04a" },
    { label: "Declined", value: declined, color: "#c0553f" },
  ];
  const total = segs.reduce((s, x) => s + x.value, 0);
  const R = 62;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 160 160" className="h-[150px] w-[150px] shrink-0 -rotate-90">
        <circle cx="80" cy="80" r={R} fill="none" stroke="#eef0f1" strokeWidth="18" />
        {total > 0 &&
          segs.map((s) => {
            const len = (s.value / total) * C;
            const el = (
              <circle
                key={s.label}
                cx="80"
                cy="80"
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth="18"
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += len;
            return el;
          })}
        <text x="80" y="76" textAnchor="middle" fontSize="26" fontWeight="700" fill="#142e2a" fontFamily="inherit" transform="rotate(90 80 80)">
          {total}
        </text>
        <text x="80" y="96" textAnchor="middle" fontSize="11" fill="#8a8f94" fontFamily="inherit" transform="rotate(90 80 80)">
          total
        </text>
      </svg>
      <ul className="flex flex-col gap-2">
        {segs.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-[13px]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            <span className="font-medium text-[#1a1a1a]">{s.label}</span>
            <span className="ml-1 text-[#8a8f94]">
              {s.value} · {total > 0 ? Math.round((s.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChartCard({ title, children, wide }: { title: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`rounded-[14px] border border-[#e6e8ea] bg-white p-4 ${wide ? "lg:col-span-2" : ""}`}>
      <p className="pb-2 text-[13px] font-semibold text-[#1a1a1a]">{title}</p>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function AnalyticsClient() {
  const [range, setRange] = useState<Range>({ kind: "preset", days: 7 });
  // Draft custom dates — applied with the button so we don't refetch on
  // every keystroke of a half-typed date. Defaults to the last 30 days.
  const [draftFrom, setDraftFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return ymdLocal(d);
  });
  const [draftTo, setDraftTo] = useState(() => ymdLocal(new Date()));
  const [customOpen, setCustomOpen] = useState(false);
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [mkt, setMkt] = useState<MarketingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (r: Range) => {
    setLoading(true);
    setError(null);
    try {
      const qs = rangeQuery(r);
      const [mRes, kRes] = await Promise.all([
        fetch(`/api/admin-tools/metrics?${qs}`, { credentials: "include" }),
        fetch(`/api/admin-tools/marketing?${qs}`, { credentials: "include" }).catch(() => null),
      ]);
      const json: MetricsResponse = await mRes.json();
      if (!mRes.ok || !json.ok) {
        throw new Error(json.detail ? `${json.error}: ${json.detail}` : json.error ?? `HTTP ${mRes.status}`);
      }
      setData(json);
      if (kRes) {
        setMkt(await kRes.json().catch(() => null));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Kick off the fetch for the selected range; `load` sets the loading flag
    // as its first step, which is the intent here (show the spinner at once).
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    load(range);
  }, [range, load]);

  const today = ymdLocal(new Date());
  const customValid = Boolean(draftFrom && draftTo && draftFrom <= draftTo && draftTo <= today);
  const applyCustom = () => {
    if (!customValid) return;
    setRange({ kind: "custom", from: draftFrom, to: draftTo });
  };

  const k = data?.kpis;
  const series = useMemo(() => data?.series ?? [], [data]);
  const brevo = mkt?.brevoConnected ? mkt.brevo : null;
  const meta = mkt?.metaConnected ? mkt.meta : null;

  // Marketing tiles — Brevo, Meta Ads & Trustpilot populate live; the rest
  // await their tool. Meta tiles come from the Marketing API (spend/ROAS);
  // the Meta Pixel only feeds Meta's own reporting, not these.
  const externalTiles: { label: string; value: string | null; hint: string }[] = [
    { label: "Ad spend", value: meta ? gbp2.format(meta.spend) : null, hint: meta ? "via Meta Ads" : "Connect Meta" },
    { label: "Cost per lead", value: meta && meta.cpl != null ? gbp2.format(meta.cpl) : null, hint: meta ? "via Meta Ads" : "Connect Meta" },
    { label: "Cost per purchase", value: meta && meta.costPerPurchase != null ? gbp2.format(meta.costPerPurchase) : null, hint: meta ? "via Meta Ads" : "Connect Meta" },
    { label: "ROAS", value: meta && meta.roas != null ? `${meta.roas.toFixed(2)}×` : null, hint: meta ? "purchase value ÷ spend" : "Connect Meta" },
    { label: "Ad reach", value: meta ? num.format(meta.reach) : null, hint: meta ? "via Meta Ads" : "Connect Meta" },
    { label: "Email open rate", value: brevo ? pct(brevo.emailOpenRate) : null, hint: brevo ? "via Brevo" : "Connect Brevo" },
    { label: "Email click rate", value: brevo ? pct(brevo.emailClickRate) : null, hint: brevo ? "via Brevo" : "Connect Brevo" },
    { label: "Emails delivered", value: brevo && brevo.emailsDelivered != null ? num.format(brevo.emailsDelivered) : null, hint: brevo ? "via Brevo" : "Connect Brevo" },
    { label: "SMS delivered", value: brevo && brevo.smsDelivered != null ? num.format(brevo.smsDelivered) : null, hint: brevo ? "via Brevo" : "Connect Brevo" },
  ];

  return (
    <main className="min-h-screen bg-[#f4f5f6] px-4 py-6 font-ui text-[#303030] md:px-8">
      <div className="mx-auto w-full max-w-[1120px]">
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
                  onClick={() => {
                    setCustomOpen(false);
                    setRange({ kind: "preset", days: r.days });
                  }}
                  className={`rounded-[8px] px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    range.kind === "preset" && range.days === r.days
                      ? "bg-[#142e2a] text-white"
                      : "text-[#303030] hover:bg-[#f1f1f1]"
                  }`}
                >
                  {r.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCustomOpen((v) => !v)}
                className={`rounded-[8px] px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  range.kind === "custom" ? "bg-[#142e2a] text-white" : "text-[#303030] hover:bg-[#f1f1f1]"
                }`}
              >
                {range.kind === "custom"
                  ? `${fmtYmd(range.from)} – ${fmtYmd(range.to)}`
                  : "Custom"}
              </button>
            </div>
            {customOpen ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  applyCustom();
                }}
                className="flex flex-wrap items-center gap-1.5 rounded-[10px] border border-[#d0d3d6] bg-white px-2 py-1"
              >
                <label className="flex items-center gap-1 text-[12px] text-[#616161]">
                  From
                  <input
                    type="date"
                    value={draftFrom}
                    max={draftTo || today}
                    onChange={(e) => setDraftFrom(e.target.value)}
                    className="rounded-[6px] border border-[#d0d3d6] px-1.5 py-1 text-[13px] text-[#303030]"
                  />
                </label>
                <label className="flex items-center gap-1 text-[12px] text-[#616161]">
                  To
                  <input
                    type="date"
                    value={draftTo}
                    min={draftFrom}
                    max={today}
                    onChange={(e) => setDraftTo(e.target.value)}
                    className="rounded-[6px] border border-[#d0d3d6] px-1.5 py-1 text-[13px] text-[#303030]"
                  />
                </label>
                <button
                  type="submit"
                  disabled={!customValid || loading}
                  className="rounded-[8px] bg-[#142e2a] px-3 py-1.5 text-[13px] font-medium text-white disabled:opacity-40"
                >
                  Apply
                </button>
              </form>
            ) : null}
            <button
              type="button"
              onClick={() => load(range)}
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

        {/* KPI grid — cards deep-link to the matching admin list */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          <KpiCard accent label="Revenue" value={k ? gbp.format(k.revenue) : "—"} hint="Paid orders in the period" href="/admin-tools/data-browser?type=orders" />
          <KpiCard label="Orders" value={k ? num.format(k.orders) : "—"} href="/admin-tools/data-browser?type=orders" />
          <KpiCard label="Average order value" value={k?.aov != null ? gbp2.format(k.aov) : "—"} href="/admin-tools/data-browser?type=orders" />
          <KpiCard label="Consultation → order rate" value={pct(k?.conversionRate)} hint="Paid orders ÷ consultations (not a visitor conversion rate)" href="/admin-tools/data-browser?type=consultations" />
          <KpiCard label="Repeat order rate" value={pct(k?.repeatRate)} hint="Customers with 2+ orders" href="/admin-tools/data-browser?type=users" />
          <KpiCard label="Consultations" value={k ? num.format(k.consultations) : "—"} href="/admin-tools/data-browser?type=consultations" />
          <KpiCard label="Approved" value={k ? num.format(k.approved) : "—"} href="/admin-tools/clinical-queue" />
          <KpiCard label="Declined" value={k ? num.format(k.declined) : "—"} href="/admin-tools/clinical-queue" />
          <KpiCard label="Pending review" value={k ? num.format(k.pending) : "—"} href="/admin-tools/clinical-queue" />
          <KpiCard label="New customers" value={k ? num.format(k.newCustomers) : "—"} href="/admin-tools/data-browser?type=users" />
        </div>

        {/* Charts */}
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard title="Revenue">
            {series.length ? <LineChart series={series} field="revenue" money gradientId="revGrad" stroke="#142e2a" /> : <p className="py-10 text-center text-[13px] text-[#8a8f94]">No data</p>}
          </ChartCard>
          <ChartCard title="Orders">
            {series.length ? <BarChart series={series} /> : <p className="py-10 text-center text-[13px] text-[#8a8f94]">No data</p>}
          </ChartCard>
          <ChartCard title="Consultations">
            {series.length ? <LineChart series={series} field="consultations" gradientId="consGrad" stroke="#42746d" /> : <p className="py-10 text-center text-[13px] text-[#8a8f94]">No data</p>}
          </ChartCard>
          <ChartCard title="Consultation outcomes">
            {k ? (
              <div className="flex min-h-[172px] items-center py-2">
                <DonutChart approved={k.approved} declined={k.declined} pending={k.pending} />
              </div>
            ) : (
              <p className="py-10 text-center text-[13px] text-[#8a8f94]">No data</p>
            )}
          </ChartCard>
        </div>

        {/* Marketing & service metrics */}
        <div className="mt-6">
          <p className="pb-1 text-[13px] font-semibold text-[#1a1a1a]">Marketing &amp; service metrics</p>
          <p className="pb-3 text-[12px] text-[#616161]">
            Ad spend &amp; ROAS come from Meta Ads, email from Brevo, reviews
            from Trustpilot. The rest light up once their tool is connected.
          </p>
          {mkt && !mkt.brevoConnected && mkt.brevoError ? (
            <div className="mb-3 flex items-start gap-2.5 rounded-[10px] border border-[#cfe0ff] bg-[#eff5ff] px-3.5 py-2.5 text-[12px] text-[#1a4b8f]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0" aria-hidden>
                <circle cx="12" cy="12" r="9" stroke="#3b6fb0" strokeWidth="1.7" />
                <path d="M12 11v5M12 8h.01" stroke="#3b6fb0" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              <span>
                <strong className="font-semibold">One-time setup to show email metrics.</strong>{" "}
                {mkt.brevoError}
              </span>
            </div>
          ) : null}
          {mkt && !mkt.metaConnected && mkt.metaError ? (
            <div className="mb-3 flex items-start gap-2.5 rounded-[10px] border border-[#cfe0ff] bg-[#eff5ff] px-3.5 py-2.5 text-[12px] text-[#1a4b8f]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0" aria-hidden>
                <circle cx="12" cy="12" r="9" stroke="#3b6fb0" strokeWidth="1.7" />
                <path d="M12 11v5M12 8h.01" stroke="#3b6fb0" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              <span>
                <strong className="font-semibold">One-time setup to show ad spend &amp; ROAS.</strong>{" "}
                {mkt.metaError}
              </span>
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            <TrustpilotTile />
            {externalTiles.map((m) => {
              const live = m.value != null;
              return (
                <div
                  key={m.label}
                  className={`rounded-[14px] border p-4 ${
                    live ? "border-[#e6e8ea] bg-white" : "border-dashed border-[#cdd1d5] bg-white/60"
                  }`}
                >
                  <p className="text-[12px] font-medium text-[#616161]">{m.label}</p>
                  <p className={`mt-1 font-display text-[24px] font-semibold ${live ? "text-[#1a1a1a]" : "text-[#c1c6ca]"}`}>
                    {live ? m.value : "—"}
                  </p>
                  <p className="mt-1 text-[11px] text-[#8a8f94]">{m.hint}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
