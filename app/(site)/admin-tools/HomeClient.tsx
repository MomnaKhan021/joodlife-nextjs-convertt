"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";

import { syncAllAction } from "./hubspot-sync/actions";

type Row = Record<string, unknown>;

const BRAND = "#142e2a";
const gbp = (n: number) =>
  `£${Number(n || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/* ---------- time-series helpers ---------- */
const DAY = 86_400_000;
function dailyBuckets(timestamps: number[], days = 30): number[] {
  const start = Date.now() - days * DAY;
  const out = new Array(days).fill(0);
  for (const t of timestamps) {
    if (!Number.isFinite(t) || t < start) continue;
    const idx = Math.min(days - 1, Math.floor((t - start) / DAY));
    out[idx] += 1;
  }
  return out;
}
function trendPct(data: number[]): number {
  const half = Math.floor(data.length / 2) || 1;
  const a = data.slice(0, half).reduce((x, y) => x + y, 0);
  const b = data.slice(half).reduce((x, y) => x + y, 0);
  if (a === 0) return b > 0 ? 100 : 0;
  return Math.round(((b - a) / a) * 100);
}
function tsOf(rows: Row[]): number[] {
  return rows
    .map((r) => new Date(String(r.created_at ?? "")).getTime())
    .filter((n) => Number.isFinite(n));
}

/* ---------- charts ---------- */
function LineChart({ data, color = BRAND, height = 160 }: { data: number[]; color?: string; height?: number }) {
  const w = 640;
  const h = height;
  const pad = 10;
  const max = Math.max(1, ...data);
  const step = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;
  const pts = data.map((v, i) => [pad + i * step, h - pad - (v / max) * (h - pad * 2)]);
  // Smooth the line a touch with simple midpoint curves for a more refined feel.
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const area = pts.length
    ? `${line} L ${pts[pts.length - 1][0].toFixed(1)} ${h} L ${pts[0][0].toFixed(1)} ${h} Z`
    : "";
  const last = pts[pts.length - 1];
  const gridY = [0.25, 0.5, 0.75].map((f) => pad + f * (h - pad * 2));
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full" style={{ height }} aria-hidden>
      <defs>
        <linearGradient id="adminAreaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
        <linearGradient id="adminLineStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1f6f5c" />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>
      {/* faint gridlines */}
      {gridY.map((y, i) => (
        <line key={i} x1={pad} x2={w - pad} y1={y} y2={y} stroke="#000" strokeOpacity={0.05} strokeWidth={1} />
      ))}
      {area ? <path d={area} fill="url(#adminAreaFill)" /> : null}
      <path
        d={line}
        fill="none"
        stroke="url(#adminLineStroke)"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {last ? (
        <>
          <circle cx={last[0]} cy={last[1]} r={6} fill={color} opacity={0.15} />
          <circle cx={last[0]} cy={last[1]} r={3.2} fill={color} />
        </>
      ) : null}
    </svg>
  );
}

function Sparkline({ data, color = BRAND }: { data: number[]; color?: string }) {
  const w = 120;
  const h = 32;
  const max = Math.max(1, ...data);
  const step = data.length > 1 ? w / (data.length - 1) : 0;
  const line = data
    .map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)} ${(h - (v / max) * h).toFixed(1)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full" style={{ height: 32 }} aria-hidden>
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrendBadge({ pct }: { pct: number }) {
  const up = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold ${
        up ? "bg-[#cdfee1] text-[#0c5132]" : "bg-[#fcd7d5] text-[#8e1f0b]"
      }`}
    >
      {up ? "▲" : "▼"} {Math.abs(pct)}%
    </span>
  );
}

function TrendCard({
  label,
  value,
  series,
  href,
}: {
  label: string;
  value: string | number;
  series: number[];
  href: string;
}) {
  const pct = trendPct(series);
  return (
    <Link
      href={href}
      className="flex flex-col rounded-[12px] border border-[#e1e3e5] bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.05)] transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
    >
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[#616161]">{label}</p>
        <TrendBadge pct={pct} />
      </div>
      <p className="mt-1 text-[22px] font-semibold text-[#1a1a1a]">{value}</p>
      <div className="mt-2">
        <Sparkline data={series} color={pct >= 0 ? "#0c5132" : "#8e1f0b"} />
      </div>
    </Link>
  );
}

/* ---------- HubSpot sync panel (bottom of dashboard) ---------- */
function HubSpotSyncPanel({
  counts,
  loading,
}: {
  counts: Record<string, number>;
  loading: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [synced, setSynced] = useState<{ contacts: number; orders: number; consultations: number } | null>(null);

  const run = useCallback(() => {
    setMsg(null);
    startTransition(async () => {
      const res = await syncAllAction();
      if (!res.ok) {
        setMsg(res.error);
        return;
      }
      setSynced({
        contacts: res.contacts.inserted + res.contacts.updated,
        orders: res.orders.inserted + res.orders.updated,
        consultations: res.consultations.inserted + res.consultations.updated,
      });
      setMsg("Sync complete.");
    });
  }, []);

  const objects = [
    { key: "users", label: "Contacts → Customers", count: counts.users ?? 0, synced: synced?.contacts },
    { key: "orders", label: "Deals → Orders", count: counts.orders ?? 0, synced: synced?.orders },
    { key: "consultations", label: "Consultations", count: counts.consultations ?? 0, synced: synced?.consultations },
  ];

  return (
    <section className="mt-6 rounded-[12px] border border-[#e1e3e5] bg-white shadow-[0_1px_0_rgba(0,0,0,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e1e3e5] px-4 py-3">
        <div>
          <h2 className="text-[14px] font-semibold text-[#1a1a1a]">HubSpot synchronization</h2>
          <p className="text-[12px] text-[#616161]">Pull contacts, deals and consultations from HubSpot.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={run}
            disabled={pending}
            className="inline-flex h-[34px] items-center rounded-[8px] bg-[#142e2a] px-4 text-[13px] font-medium text-white hover:bg-[#0c2421] disabled:opacity-60"
          >
            {pending ? "Syncing…" : "Sync now"}
          </button>
          <Link
            href="/admin-tools/hubspot-sync"
            className="inline-flex h-[34px] items-center rounded-[8px] border border-[#babfc3] bg-white px-4 text-[13px] font-medium text-[#303030] hover:bg-[#f7f7f7]"
          >
            Open sync tools
          </Link>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[#fafbfb] text-[12px] text-[#6d7175]">
              <th className="px-4 py-2 text-left font-semibold">Object</th>
              <th className="px-4 py-2 text-right font-semibold">In dashboard</th>
              <th className="px-4 py-2 text-right font-semibold">Last sync</th>
            </tr>
          </thead>
          <tbody>
            {objects.map((o) => (
              <tr key={o.key} className="border-t border-[#f1f1f1]">
                <td className="px-4 py-2.5 text-[#303030]">{o.label}</td>
                <td className="px-4 py-2.5 text-right font-medium text-[#1a1a1a]">
                  {loading ? "…" : o.count.toLocaleString("en-GB")}
                </td>
                <td className="px-4 py-2.5 text-right text-[#616161]">
                  {o.synced === undefined ? "—" : `${o.synced} updated`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {msg ? (
        <p className="px-4 py-3 text-[13px] text-[#303030]">{msg}</p>
      ) : null}
    </section>
  );
}

/* ---------- page ---------- */
export default function AdminHome() {
  const [orders, setOrders] = useState<Row[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [series, setSeries] = useState<Record<string, number[]>>({
    orders: [],
    consultations: [],
    products: [],
  });
  const [sales, setSales] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const types = ["orders", "consultations", "products", "users"];
        const res = await Promise.all(
          types.map((t) =>
            fetch(`/api/admin-tools/list?type=${t}&page=1&pageSize=250`, { credentials: "include" })
              .then((r) => r.json())
              .catch(() => ({})),
          ),
        );
        if (off) return;
        const c: Record<string, number> = {};
        const rowsByType: Record<string, Row[]> = {};
        types.forEach((t, i) => {
          c[t] = typeof res[i]?.total === "number" ? res[i].total : 0;
          rowsByType[t] = Array.isArray(res[i]?.rows) ? res[i].rows : [];
        });
        setCounts(c);
        setOrders(rowsByType.orders.slice(0, 6));
        setSeries({
          orders: dailyBuckets(tsOf(rowsByType.orders)),
          consultations: dailyBuckets(tsOf(rowsByType.consultations)),
          products: dailyBuckets(tsOf(rowsByType.products)),
        });
        setSales(rowsByType.orders.reduce((a, r) => a + (Number(r.total_amount) || 0), 0));
      } finally {
        if (!off) setLoading(false);
      }
    })();
    return () => {
      off = true;
    };
  }, []);

  const ordersPct = trendPct(series.orders);

  return (
    <main className="min-h-screen bg-[#f1f1f1] px-4 py-6 md:px-8">
      <div className="mx-auto max-w-[1100px]">
        <h1 className="mb-1 text-[20px] font-semibold text-[#1a1a1a]">Home</h1>
        <p className="mb-5 text-[13px] text-[#616161]">Last 30 days overview.</p>

        {/* Main orders chart */}
        <section className="rounded-[12px] border border-[#e1e3e5] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[13px] text-[#616161]">Orders over time</p>
              <div className="mt-1 flex items-center gap-3">
                <span className="text-[26px] font-semibold text-[#1a1a1a]">
                  {loading ? "…" : counts.orders ?? 0}
                </span>
                {!loading ? <TrendBadge pct={ordersPct} /> : null}
              </div>
            </div>
            <div className="text-right">
              <p className="text-[13px] text-[#616161]">Sales (last 30 days)</p>
              <span className="text-[20px] font-semibold text-[#1a1a1a]">
                {loading ? "…" : gbp(sales)}
              </span>
            </div>
          </div>
          <div className="mt-4">
            {loading ? (
              <div className="h-[140px] animate-pulse rounded bg-[#f1f1f1]" />
            ) : (
              <LineChart data={series.orders} />
            )}
          </div>
        </section>

        {/* Trend cards */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TrendCard label="Orders" value={loading ? "…" : counts.orders ?? 0} series={series.orders} href="/admin-tools/data-browser?type=orders" />
          <TrendCard label="Consultations" value={loading ? "…" : counts.consultations ?? 0} series={series.consultations} href="/admin-tools/data-browser?type=consultations" />
          <TrendCard label="Products" value={loading ? "…" : counts.products ?? 0} series={series.products} href="/admin-tools/data-browser?type=products" />
        </div>

        {/* Recent orders */}
        <section className="mt-6 rounded-[12px] border border-[#e1e3e5] bg-white shadow-[0_1px_0_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between border-b border-[#e1e3e5] px-4 py-3">
            <h2 className="text-[14px] font-semibold text-[#1a1a1a]">Recent orders</h2>
            <Link href="/admin-tools/data-browser?type=orders" className="text-[13px] font-medium text-[#1450b0]">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[#fafbfb] text-[12px] text-[#6d7175]">
                  <th className="px-4 py-2 text-left font-semibold">Order</th>
                  <th className="px-4 py-2 text-left font-semibold">Customer</th>
                  <th className="px-4 py-2 text-left font-semibold">Status</th>
                  <th className="px-4 py-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-[#8a8a8a]">Loading…</td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-[#8a8a8a]">No orders yet.</td></tr>
                ) : (
                  orders.map((r, i) => (
                    <tr key={String(r.id ?? i)} className="border-t border-[#f1f1f1] hover:bg-[#fafbfb]">
                      <td className="px-4 py-2.5">
                        <Link href={`/admin-tools/orders/${r.id}`} className="font-medium text-[#1450b0]">
                          {String(r.order_number ?? `#${r.id}`)}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-[#303030]">{String(r.customer_name ?? r.customer_email ?? "—")}</td>
                      <td className="px-4 py-2.5">
                        <span className="rounded-full bg-[#e3e3e3] px-2 py-0.5 text-[12px] capitalize text-[#303030]">
                          {String(r.payment_status ?? r.status ?? "—")}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium text-[#1a1a1a]">{gbp(Number(r.total_amount))}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Quick actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/admin-tools/products/new"
            className="inline-flex h-[36px] items-center rounded-[8px] bg-[#142e2a] px-4 text-[13px] font-medium text-white hover:bg-[#0c2421]"
          >
            Add product
          </Link>
          <Link
            href="/admin-tools/data-browser?type=orders"
            className="inline-flex h-[36px] items-center rounded-[8px] border border-[#babfc3] bg-white px-4 text-[13px] font-medium text-[#303030] hover:bg-[#f7f7f7]"
          >
            View orders
          </Link>
          <Link
            href="/admin-tools/data-browser?type=consultations"
            className="inline-flex h-[36px] items-center rounded-[8px] border border-[#babfc3] bg-white px-4 text-[13px] font-medium text-[#303030] hover:bg-[#f7f7f7]"
          >
            Consultations
          </Link>
        </div>

        {/* HubSpot synchronization — objects + sync, at the bottom */}
        <HubSpotSyncPanel counts={counts} loading={loading} />
      </div>
    </main>
  );
}
