import Link from "next/link";

import { getPayloadInstance } from "@/lib/payload";

/**
 * Custom JoodLife dashboard. Mounts via admin.components.beforeDashboard
 * so it renders above whatever Payload would normally show on /admin.
 *
 * Reads via raw SQL through Payload's Drizzle instance — same escape
 * hatch lib/products.ts uses, since our Products collection schema is
 * the hand-written stub from /api/diag and Payload's Local API can't
 * fully resolve relationships on it.
 */
async function rawQuery<T>(sql: string): Promise<T[]> {
  try {
    const payload = await getPayloadInstance();
    const drizzle = (
      payload.db as unknown as {
        drizzle?: { execute?: (q: unknown) => Promise<unknown> };
      }
    ).drizzle;
    if (!drizzle?.execute) return [];
    const { sql: drizzleSql } = (await import("drizzle-orm")) as {
      sql: { raw: (s: string) => unknown };
    };
    const result = (await drizzle.execute(drizzleSql.raw(sql))) as
      | { rows?: T[] }
      | T[];
    return Array.isArray(result) ? result : (result.rows ?? []);
  } catch (err) {
    console.warn("[dashboard] raw query failed:", err);
    return [];
  }
}

type Stats = {
  productsTotal: number;
  productsActive: number;
  usersTotal: number;
  usersAdmins: number;
  ordersTotal: number;
  ordersRevenue: number;
  mediaCount: number;
};

async function fetchStats(): Promise<Stats> {
  const [products, users, orders, media] = await Promise.all([
    rawQuery<{ total: string; active: string }>(
      `SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE is_active = true)::int AS active FROM products`
    ),
    rawQuery<{ total: string; admins: string }>(
      `SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE role = 'admin')::int AS admins FROM users`
    ),
    rawQuery<{ total: string; revenue: string | null }>(
      `SELECT COUNT(*)::int AS total, COALESCE(SUM(total_amount), 0)::numeric AS revenue FROM orders`
    ),
    rawQuery<{ total: string }>(`SELECT COUNT(*)::int AS total FROM media`),
  ]);
  return {
    productsTotal: Number(products[0]?.total ?? 0),
    productsActive: Number(products[0]?.active ?? 0),
    usersTotal: Number(users[0]?.total ?? 0),
    usersAdmins: Number(users[0]?.admins ?? 0),
    ordersTotal: Number(orders[0]?.total ?? 0),
    ordersRevenue: Number(orders[0]?.revenue ?? 0),
    mediaCount: Number(media[0]?.total ?? 0),
  };
}

type ProductRow = {
  id: number;
  title: string;
  slug: string;
  from_price: string | null;
  category: string | null;
  is_active: boolean;
  display_order: number | null;
};

type UserRow = {
  id: number;
  name: string | null;
  email: string;
  role: string | null;
  created_at: string;
};

async function fetchRecentProducts(): Promise<ProductRow[]> {
  return rawQuery<ProductRow>(
    `SELECT id, title, slug, from_price, category, is_active, display_order
     FROM products
     ORDER BY display_order ASC NULLS LAST, id ASC
     LIMIT 5`
  );
}

async function fetchRecentUsers(): Promise<UserRow[]> {
  return rawQuery<UserRow>(
    `SELECT id, name, email, role, created_at
     FROM users
     ORDER BY created_at DESC NULLS LAST
     LIMIT 5`
  );
}

export async function Dashboard() {
  const [stats, recentProducts, recentUsers] = await Promise.all([
    fetchStats(),
    fetchRecentProducts(),
    fetchRecentUsers(),
  ]);

  return (
    <section className="jood-dashboard">
      <header className="jood-dashboard__header">
        <p className="jood-dashboard__eyebrow">Overview</p>
        <h1 className="jood-dashboard__title">Welcome to JoodLife CMS</h1>
        <p className="jood-dashboard__subtitle">
          Manage products, customers and orders for the storefront.
        </p>
      </header>

      <div className="jood-stats">
        <StatCard
          label="Products"
          value={stats.productsActive}
          subtitle={`${stats.productsTotal} total · ${
            stats.productsTotal - stats.productsActive
          } inactive`}
          accent="green"
          href="/admin/collections/products"
        />
        <StatCard
          label="Users"
          value={stats.usersTotal}
          subtitle={`${stats.usersAdmins} admin${
            stats.usersAdmins === 1 ? "" : "s"
          } · ${stats.usersTotal - stats.usersAdmins} customer${
            stats.usersTotal - stats.usersAdmins === 1 ? "" : "s"
          }`}
          accent="leaf"
          href="/admin/collections/users"
        />
        <StatCard
          label="Orders"
          value={stats.ordersTotal}
          subtitle={`£${stats.ordersRevenue.toLocaleString("en-GB", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} revenue`}
          accent="green"
          href="/admin/collections/orders"
        />
        <StatCard
          label="Media files"
          value={stats.mediaCount}
          subtitle="uploaded assets"
          accent="leaf"
          href="/admin/collections/media"
        />
      </div>

      <div className="jood-panels">
        <section className="jood-panel">
          <header className="jood-panel__header">
            <h2 className="jood-panel__title">Latest products</h2>
            <Link
              href="/admin/collections/products"
              className="jood-panel__link"
            >
              Manage all →
            </Link>
          </header>
          {recentProducts.length === 0 ? (
            <p className="jood-panel__empty">No products yet.</p>
          ) : (
            <ul className="jood-panel__list">
              {recentProducts.map((p) => (
                <li key={p.id} className="jood-panel__row">
                  <Link
                    href={`/admin/collections/products/${p.id}`}
                    className="jood-panel__row-link"
                  >
                    <span className="jood-panel__row-title">{p.title}</span>
                    <span className="jood-panel__row-meta">
                      {p.from_price ? `from £${Number(p.from_price)}` : "—"}
                      {" · "}
                      {p.category ?? "—"}
                      {" · "}
                      <span
                        className={
                          p.is_active
                            ? "jood-panel__pill jood-panel__pill--ok"
                            : "jood-panel__pill jood-panel__pill--off"
                        }
                      >
                        {p.is_active ? "Active" : "Inactive"}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="jood-panel">
          <header className="jood-panel__header">
            <h2 className="jood-panel__title">Recent users</h2>
            <Link
              href="/admin/collections/users"
              className="jood-panel__link"
            >
              Manage all →
            </Link>
          </header>
          {recentUsers.length === 0 ? (
            <p className="jood-panel__empty">No users yet.</p>
          ) : (
            <ul className="jood-panel__list">
              {recentUsers.map((u) => (
                <li key={u.id} className="jood-panel__row">
                  <Link
                    href={`/admin/collections/users/${u.id}`}
                    className="jood-panel__row-link"
                  >
                    <span className="jood-panel__row-title">
                      {u.name ?? u.email}
                    </span>
                    <span className="jood-panel__row-meta">
                      {u.email}
                      {" · "}
                      <span
                        className={
                          u.role === "admin"
                            ? "jood-panel__pill jood-panel__pill--ok"
                            : "jood-panel__pill jood-panel__pill--neutral"
                        }
                      >
                        {u.role === "admin" ? "Admin" : "Customer"}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}

export default Dashboard;

function StatCard({
  label,
  value,
  subtitle,
  accent,
  href,
}: {
  label: string;
  value: number;
  subtitle: string;
  accent: "green" | "leaf";
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`jood-stat-card jood-stat-card--${accent}`}
      aria-label={`${label} · ${subtitle}`}
    >
      <span className="jood-stat-card__label">{label}</span>
      <span className="jood-stat-card__value">
        {value.toLocaleString("en-GB")}
      </span>
      <span className="jood-stat-card__subtitle">{subtitle}</span>
    </Link>
  );
}
