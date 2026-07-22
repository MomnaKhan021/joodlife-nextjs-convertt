"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type CustomerItem = { title: string | null; dose: string | null; quantity: number };
type CustomerOrder = {
  id: number;
  orderNumber: string | null;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string | null;
  items: CustomerItem[];
};
type CustomerData = {
  ok: boolean;
  customer: {
    email: string;
    name: string | null;
    phone: string | null;
    joinedAt: string | null;
    hasAccount: boolean;
    accountId?: number | null;
    role?: string | null;
  };
  stats: {
    totalOrders: number;
    totalSpent: number;
    cancellations: number;
    refunds: number;
    productCounts: Record<string, number>;
  };
  weightHistory?: WeightPoint[];
  weightChange?: number | null;
  orders: CustomerOrder[];
  error?: string;
};
type WeightPoint = { date: string | null; weightKg: number; source: string };

const gbp = (n: number) =>
  n.toLocaleString("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 });

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** WhatsApp deep link from a phone number (digits only, no +). */
function waLink(phone: string) {
  const digits = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${digits}`;
}

function StatusPill({ value }: { value: string }) {
  const v = value.toLowerCase();
  let cls = "bg-[#e3e3e3] text-[#303030]";
  if (["paid", "delivered", "dispatched", "shipped"].includes(v)) cls = "bg-[#cdfee1] text-[#0c5132]";
  else if (["cancelled", "refunded", "failed"].includes(v)) cls = "bg-[#fcd7d5] text-[#8e1f0b]";
  else if (["pending", "unfulfilled"].includes(v)) cls = "bg-[#ffea8a] text-[#5c4813]";
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-medium capitalize ${cls}`}>{value || "—"}</span>;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-[12px] border border-[#e1e3e5] bg-white shadow-[0_1px_0_rgba(0,0,0,0.05)] ${className}`}>
      {children}
    </section>
  );
}

/** Weight progression over time — a small line chart + reading list. Weight
 *  change is a legal record for GLP-1 resupplies. */
function WeightTracking({ history, change }: { history: WeightPoint[]; change: number | null | undefined }) {
  if (!history.length) {
    return (
      <Card>
        <div className="px-5 py-4">
          <h2 className="text-[14px] font-semibold">Weight tracking</h2>
          <p className="mt-2 text-[13px] text-[#616161]">No weight recorded yet.</p>
        </div>
      </Card>
    );
  }
  const w = 280;
  const h = 90;
  const pad = 6;
  const weights = history.map((p) => p.weightKg);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const span = max - min || 1;
  const stepX = history.length > 1 ? (w - pad * 2) / (history.length - 1) : 0;
  const y = (kg: number) => pad + (1 - (kg - min) / span) * (h - pad * 2);
  const pts = history.map((p, i) => `${(pad + i * stepX).toFixed(1)},${y(p.weightKg).toFixed(1)}`).join(" ");
  const latest = weights[weights.length - 1];
  const first = weights[0];
  const down = change != null && change < 0;

  return (
    <Card>
      <div className="px-5 py-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[14px] font-semibold">Weight tracking</h2>
          {change != null ? (
            <span className={`text-[13px] font-semibold ${down ? "text-[#0c5132]" : "text-[#8e1f0b]"}`}>
              {down ? "▼" : "▲"} {Math.abs(change)} kg
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-[12px] text-[#616161]">
          {first} kg → <span className="font-semibold text-[#1a1a1a]">{latest} kg</span> over{" "}
          {history.length} reading{history.length === 1 ? "" : "s"}
        </p>
        {history.length > 1 ? (
          <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 w-full" preserveAspectRatio="none" aria-hidden>
            <polyline points={pts} fill="none" stroke="#142e2a" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {history.map((p, i) => (
              <circle key={i} cx={pad + i * stepX} cy={y(p.weightKg)} r="2.5" fill="#142e2a" />
            ))}
          </svg>
        ) : null}
        <ul className="mt-3 flex flex-col gap-1">
          {history
            .slice()
            .reverse()
            .map((p, i) => (
              <li key={i} className="flex items-center justify-between text-[12px]">
                <span className="text-[#616161]">
                  {fmtDate(p.date)}
                  {p.source === "logged" ? " · self-logged" : " · consultation"}
                </span>
                <span className="font-semibold text-[#303030]">{p.weightKg} kg</span>
              </li>
            ))}
        </ul>
      </div>
    </Card>
  );
}

export default function CustomerDetailClient({ email }: { email: string }) {
  const [data, setData] = useState<CustomerData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin-tools/customer?email=${encodeURIComponent(email)}`, {
          credentials: "include",
          cache: "no-store",
        });
        const json = (await res.json()) as CustomerData;
        if (!res.ok || !json.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
        if (!off) setData(json);
      } catch (e) {
        if (!off) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!off) setLoading(false);
      }
    })();
    return () => {
      off = true;
    };
  }, [email]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f1f1f1] px-4 py-10">
        <div className="mx-auto max-w-[1000px] animate-pulse text-[14px] text-[#616161]">Loading customer…</div>
      </main>
    );
  }
  if (error || !data) {
    return (
      <main className="min-h-screen bg-[#f1f1f1] px-4 py-10">
        <div className="mx-auto max-w-[1000px] rounded-lg border border-[#e1e3e5] bg-white p-6 text-[14px] text-red-700">
          {error ?? "Customer not found."}
        </div>
      </main>
    );
  }

  const { customer, stats, orders } = data;
  const products = Object.entries(stats.productCounts).sort((a, b) => b[1] - a[1]);
  const kpis = [
    { label: "Total orders", value: String(stats.totalOrders) },
    { label: "Total spent", value: gbp(stats.totalSpent) },
    { label: "Cancellations", value: String(stats.cancellations) },
    { label: "Refunds", value: String(stats.refunds) },
  ];

  return (
    <main className="min-h-screen bg-[#f1f1f1] pb-16 font-ui text-[#303030]">
      <div className="mx-auto max-w-[1000px] px-4 pt-5 md:px-6">
        {/* Header */}
        <div className="flex items-start gap-2 pb-5">
          <Link
            href="/admin-tools/data-browser?type=users"
            aria-label="Back to customers"
            className="mt-1 grid h-7 w-7 place-items-center rounded-[8px] border border-[#babfc3] bg-white text-[#616161] transition-colors hover:bg-[#f7f7f7]"
          >
            ‹
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[20px] font-semibold leading-tight text-[#1a1a1a]">
                {customer.name || customer.email}
              </h1>
              {customer.role ? (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                    customer.role === "admin"
                      ? "bg-[#142e2a] text-white"
                      : customer.role === "staff"
                        ? "bg-[#e7efe0] text-[#142e2a]"
                        : "bg-[#f1f1f1] text-[#616161]"
                  }`}
                >
                  {customer.role}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-[13px] text-[#616161]">
              {customer.hasAccount ? "Customer" : "Guest (no account)"}
              {customer.joinedAt ? ` · joined ${fmtDate(customer.joinedAt)}` : ""}
            </p>
          </div>
          {/* Manage access — opens the user editor (role: customer / staff /
              admin + per-section staff permissions). Only when an account exists. */}
          {customer.accountId ? (
            <Link
              href={`/admin-tools/edit/users/${customer.accountId}`}
              className="mt-1 inline-flex h-9 shrink-0 items-center rounded-[8px] bg-[#142e2a] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#0c2421]"
            >
              Manage access
            </Link>
          ) : null}
        </div>

        {/* KPI strip */}
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {kpis.map((k) => (
            <Card key={k.label} className="px-4 py-3">
              <p className="text-[12px] font-semibold text-[#6d7175]">{k.label}</p>
              <p className="mt-1 text-[22px] font-bold tracking-[-0.01em] text-[#1a1a1a]">{k.value}</p>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* LEFT: order history */}
          <Card>
            <div className="border-b border-[#e1e3e5] px-5 py-3.5">
              <h2 className="text-[14px] font-semibold">Order history</h2>
            </div>
            {orders.length === 0 ? (
              <p className="px-5 py-8 text-center text-[13px] text-[#8a8a8a]">No orders yet.</p>
            ) : (
              <ul>
                {orders.map((o, i) => (
                  <li key={o.id} className={i > 0 ? "border-t border-[#f1f1f1]" : ""}>
                    <Link
                      href={`/admin-tools/orders/${o.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-[#fafbfb]"
                    >
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[#142e2a] underline decoration-[#142e2a]/25 underline-offset-2">
                          {o.orderNumber ?? `#${o.id}`}
                        </p>
                        <p className="text-[12px] text-[#616161]">
                          {fmtDate(o.createdAt)}
                          {o.items.length
                            ? ` · ${o.items.map((it) => `${it.title}${it.dose ? ` (${it.dose})` : ""} ×${it.quantity}`).join(", ")}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusPill value={o.status} />
                        <span className="w-[80px] text-right text-[13px] font-semibold">{gbp(o.total)}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* RIGHT: contact + weight + products purchased */}
          <div className="flex flex-col gap-4">
            <WeightTracking history={data.weightHistory ?? []} change={data.weightChange} />
            <Card>
              <div className="px-5 py-4">
                <h2 className="text-[14px] font-semibold text-[#142e2a]">Contact</h2>
                <a
                  href={`mailto:${customer.email}`}
                  className="mt-2 block break-all text-[13px] font-medium text-[#142e2a] underline decoration-[#142e2a]/30 underline-offset-2 transition-colors hover:decoration-[#142e2a]"
                >
                  {customer.email}
                </a>
                {customer.phone ? (
                  <a
                    href={waLink(customer.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#142e2a] underline decoration-[#142e2a]/30 underline-offset-2 transition-colors hover:decoration-[#142e2a]"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.9 5-1.3A10 10 0 1 0 12 2Zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2s-1.2.3-4-1.2-4.3-4.3-4.5-4.5-1.3-1.7-1.3-3.2.8-2.2 1.1-2.5.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.5.7c-.2.2-.3.4-.1.7s.8 1.3 1.6 2c1 .9 1.9 1.2 2.2 1.3s.4.1.6-.1l.8-1c.2-.2.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.2.1.6-.1 1.2Z" />
                    </svg>
                    {customer.phone}
                  </a>
                ) : (
                  <p className="mt-1 text-[13px] text-[#616161]">No phone number</p>
                )}
              </div>
            </Card>

            <Card>
              <div className="px-5 py-4">
                <h2 className="text-[14px] font-semibold">Products purchased</h2>
                {products.length === 0 ? (
                  <p className="mt-2 text-[13px] text-[#616161]">—</p>
                ) : (
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {products.map(([title, qty]) => (
                      <li key={title} className="flex items-center justify-between text-[13px]">
                        <span className="min-w-0 truncate text-[#303030]">{title}</span>
                        <span className="ml-2 shrink-0 rounded-md bg-[#eef3e6] px-2 py-0.5 text-[12px] font-semibold text-[#142e2a]">
                          ×{qty}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
