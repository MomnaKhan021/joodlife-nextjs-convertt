"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Row = Record<string, unknown>;

const gbp = (n: number) =>
  `£${Number(n || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string | number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[12px] border border-[#e1e3e5] bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.05)] transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
    >
      <p className="text-[13px] text-[#616161]">{label}</p>
      <p className="mt-1 text-[24px] font-semibold text-[#1a1a1a]">{value}</p>
    </Link>
  );
}

export default function AdminHome() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [recent, setRecent] = useState<Row[]>([]);
  const [sales, setSales] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const types = ["orders", "products", "users", "consultations"];
        const results = await Promise.all(
          types.map((t) =>
            fetch(`/api/admin-tools/list?type=${t}&page=1&pageSize=${t === "orders" ? 50 : 1}`, {
              credentials: "include",
            })
              .then((r) => r.json())
              .catch(() => ({})),
          ),
        );
        if (off) return;
        const c: Record<string, number> = {};
        types.forEach((t, i) => {
          c[t] = typeof results[i]?.total === "number" ? results[i].total : 0;
        });
        setCounts(c);
        const orderRows: Row[] = Array.isArray(results[0]?.rows) ? results[0].rows : [];
        setRecent(orderRows.slice(0, 6));
        setSales(
          orderRows.reduce((a, r) => a + (Number(r.total_amount) || 0), 0),
        );
      } finally {
        if (!off) setLoading(false);
      }
    })();
    return () => {
      off = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#f1f1f1] px-4 py-6 md:px-8">
      <div className="mx-auto max-w-[1100px]">
        <h1 className="mb-1 text-[20px] font-semibold text-[#1a1a1a]">Home</h1>
        <p className="mb-5 text-[13px] text-[#616161]">Overview of your store.</p>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Orders" value={loading ? "…" : counts.orders ?? 0} href="/admin-tools/data-browser?type=orders" />
          <StatCard label="Sales (recent)" value={loading || sales === null ? "…" : gbp(sales)} href="/admin-tools/data-browser?type=orders" />
          <StatCard label="Products" value={loading ? "…" : counts.products ?? 0} href="/admin-tools/data-browser?type=products" />
          <StatCard label="Customers" value={loading ? "…" : counts.users ?? 0} href="/admin-tools/data-browser?type=users" />
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
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-[#8a8a8a]">
                      Loading…
                    </td>
                  </tr>
                ) : recent.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-[#8a8a8a]">
                      No orders yet.
                    </td>
                  </tr>
                ) : (
                  recent.map((r, i) => (
                    <tr key={String(r.id ?? i)} className="border-t border-[#f1f1f1] hover:bg-[#fafbfb]">
                      <td className="px-4 py-2.5">
                        <Link href={`/admin-tools/orders/${r.id}`} className="font-medium text-[#1450b0]">
                          {String(r.order_number ?? `#${r.id}`)}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-[#303030]">
                        {String(r.customer_name ?? r.customer_email ?? "—")}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="rounded-full bg-[#e3e3e3] px-2 py-0.5 text-[12px] capitalize text-[#303030]">
                          {String(r.payment_status ?? r.status ?? "—")}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium text-[#1a1a1a]">
                        {gbp(Number(r.total_amount))}
                      </td>
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
            className="inline-flex h-[36px] items-center rounded-[8px] bg-[#303030] px-4 text-[13px] font-medium text-white hover:bg-[#1a1a1a]"
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
      </div>
    </main>
  );
}
