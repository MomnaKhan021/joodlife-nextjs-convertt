import Link from "next/link";

import { getPayloadInstance } from "@/lib/payload";
import DashboardActions from "./DashboardActions";

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
  ordersPaid: number;
  consultationsTotal: number;
  consultationsSubmitted: number;
  postsTotal: number;
  postsPublished: number;
  mediaCount: number;
};

async function fetchStats(): Promise<Stats> {
  const [products, users, orders, consultations, posts, media] =
    await Promise.all([
      rawQuery<{ total: string; active: string }>(
        `SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE is_active = true)::int AS active FROM products`
      ),
      rawQuery<{ total: string; admins: string }>(
        `SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE role = 'admin')::int AS admins FROM users`
      ),
      rawQuery<{ total: string; revenue: string | null; paid: string }>(
        `SELECT COUNT(*)::int AS total,
                COALESCE(SUM(total_amount), 0)::numeric AS revenue,
                COUNT(*) FILTER (WHERE status IN ('paid','shipped','delivered'))::int AS paid
         FROM orders`
      ),
      rawQuery<{ total: string; submitted: string }>(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE status IN ('submitted','reviewed','approved'))::int AS submitted
         FROM consultations`
      ),
      rawQuery<{ total: string; published: string }>(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE status = 'published')::int AS published
         FROM posts`
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
    ordersPaid: Number(orders[0]?.paid ?? 0),
    consultationsTotal: Number(consultations[0]?.total ?? 0),
    consultationsSubmitted: Number(consultations[0]?.submitted ?? 0),
    postsTotal: Number(posts[0]?.total ?? 0),
    postsPublished: Number(posts[0]?.published ?? 0),
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

type OrderRow = {
  id: number;
  order_number: string;
  customer_name: string | null;
  customer_email: string | null;
  total_amount: string | null;
  status: string;
  created_at: string;
};

type ConsultationRow = {
  id: number;
  email: string | null;
  full_name: string | null;
  product_slug: string | null;
  status: string;
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

async function fetchRecentOrders(): Promise<OrderRow[]> {
  return rawQuery<OrderRow>(
    `SELECT id, order_number, customer_name, customer_email,
            total_amount, status, created_at
     FROM orders
     ORDER BY created_at DESC NULLS LAST
     LIMIT 6`
  );
}

async function fetchRecentConsultations(): Promise<ConsultationRow[]> {
  return rawQuery<ConsultationRow>(
    `SELECT id, email, full_name, product_slug, status, created_at
     FROM consultations
     ORDER BY created_at DESC NULLS LAST
     LIMIT 6`
  );
}

function fmtRelative(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diffMs = Date.now() - d.getTime();
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtCurrency(value: string | null): string {
  const n = Number(value ?? 0);
  return `£${n.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export async function Dashboard() {
  // Belt-and-braces: any SQL exception bubbling out of these helpers
  // would unmount the whole widget under Payload's error boundary,
  // making the dashboard look broken. Catch each one so we always
  // render the layout.
  let stats: Stats = {
    productsTotal: 0,
    productsActive: 0,
    usersTotal: 0,
    usersAdmins: 0,
    ordersTotal: 0,
    ordersRevenue: 0,
    ordersPaid: 0,
    consultationsTotal: 0,
    consultationsSubmitted: 0,
    postsTotal: 0,
    postsPublished: 0,
    mediaCount: 0,
  };
  let recentProducts: ProductRow[] = [];
  let recentUsers: UserRow[] = [];
  let recentOrders: OrderRow[] = [];
  let recentConsultations: ConsultationRow[] = [];

  // Independent try/catch per-fetch so one missing table (e.g. posts
  // or consultations not yet auto-migrated on a fresh deploy) doesn't
  // zero out the others. Promise.allSettled gives us per-promise
  // success/fail visibility.
  const settled = await Promise.allSettled([
    fetchStats(),
    fetchRecentProducts(),
    fetchRecentUsers(),
    fetchRecentOrders(),
    fetchRecentConsultations(),
  ]);
  if (settled[0].status === "fulfilled") stats = settled[0].value;
  else console.warn("[dashboard] stats failed:", settled[0].reason);
  if (settled[1].status === "fulfilled") recentProducts = settled[1].value;
  if (settled[2].status === "fulfilled") recentUsers = settled[2].value;
  if (settled[3].status === "fulfilled") recentOrders = settled[3].value;
  if (settled[4].status === "fulfilled") recentConsultations = settled[4].value;

  return (
    <section className="jood-dashboard">
      <header className="jood-dashboard__header">
        <p className="jood-dashboard__eyebrow">Overview</p>
        <h1 className="jood-dashboard__title">Welcome to JoodLife CMS</h1>
        <p className="jood-dashboard__subtitle">
          Manage products, customers, orders and consultations — and pull
          fresh data from HubSpot.
        </p>
        <div className="jood-dashboard__cta-row">
          <Link
            href="/admin-tools/hubspot-sync"
            className="jood-dashboard__cta jood-dashboard__cta--primary"
          >
            Sync HubSpot now →
          </Link>
          <Link
            href="/admin/collections/orders"
            className="jood-dashboard__cta"
          >
            View all orders
          </Link>
          <Link
            href="/admin/collections/consultations"
            className="jood-dashboard__cta"
          >
            View consultations
          </Link>
        </div>
      </header>

      <DashboardActions />

      <div className="jood-stats">
        <StatCard
          label="Orders"
          value={stats.ordersTotal}
          subtitle={`${fmtCurrency(String(stats.ordersRevenue))} · ${stats.ordersPaid} paid`}
          accent="green"
          href="/admin/collections/orders"
        />
        <StatCard
          label="Consultations"
          value={stats.consultationsTotal}
          subtitle={`${stats.consultationsSubmitted} submitted`}
          accent="leaf"
          href="/admin/collections/consultations"
        />
        <StatCard
          label="Users"
          value={stats.usersTotal}
          subtitle={`${stats.usersAdmins} admin${
            stats.usersAdmins === 1 ? "" : "s"
          } · ${stats.usersTotal - stats.usersAdmins} customer${
            stats.usersTotal - stats.usersAdmins === 1 ? "" : "s"
          }`}
          accent="green"
          href="/admin/collections/users"
        />
        <StatCard
          label="Products"
          value={stats.productsActive}
          subtitle={`${stats.productsTotal} total · ${
            stats.productsTotal - stats.productsActive
          } inactive`}
          accent="leaf"
          href="/admin/collections/products"
        />
        <StatCard
          label="Posts"
          value={stats.postsTotal}
          subtitle={`${stats.postsPublished} published`}
          accent="green"
          href="/admin/collections/posts"
        />
        <StatCard
          label="Media files"
          value={stats.mediaCount}
          subtitle="uploaded assets"
          accent="leaf"
          href="/admin/collections/media"
        />
      </div>

      {/* Recent orders + consultations row */}
      <div className="jood-panels">
        <section className="jood-panel">
          <header className="jood-panel__header">
            <h2 className="jood-panel__title">Recent orders</h2>
            <Link
              href="/admin/collections/orders"
              className="jood-panel__link"
            >
              Manage all →
            </Link>
          </header>
          {recentOrders.length === 0 ? (
            <p className="jood-panel__empty">
              No orders yet.{" "}
              <Link href="/admin-tools/hubspot-sync/orders">
                Pull from HubSpot →
              </Link>
            </p>
          ) : (
            <ul className="jood-panel__list">
              {recentOrders.map((o) => (
                <li key={o.id} className="jood-panel__row">
                  <Link
                    href={`/admin/collections/orders/${o.id}`}
                    className="jood-panel__row-link"
                  >
                    <span className="jood-panel__row-title">
                      {o.order_number}
                      {" · "}
                      <span className="jood-panel__row-amount">
                        {fmtCurrency(o.total_amount)}
                      </span>
                    </span>
                    <span className="jood-panel__row-meta">
                      {o.customer_name || o.customer_email || "guest"}
                      {" · "}
                      <span
                        className={`jood-panel__pill jood-panel__pill--${
                          o.status === "paid" ||
                          o.status === "delivered" ||
                          o.status === "shipped"
                            ? "ok"
                            : o.status === "cancelled"
                              ? "off"
                              : "neutral"
                        }`}
                      >
                        {o.status}
                      </span>
                      {" · "}
                      {fmtRelative(o.created_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="jood-panel">
          <header className="jood-panel__header">
            <h2 className="jood-panel__title">Recent consultations</h2>
            <Link
              href="/admin/collections/consultations"
              className="jood-panel__link"
            >
              Manage all →
            </Link>
          </header>
          {recentConsultations.length === 0 ? (
            <p className="jood-panel__empty">
              No consultations yet.{" "}
              <Link href="/admin-tools/hubspot-sync/consultations">
                Pull from HubSpot →
              </Link>
            </p>
          ) : (
            <ul className="jood-panel__list">
              {recentConsultations.map((c) => (
                <li key={c.id} className="jood-panel__row">
                  <Link
                    href={`/admin/collections/consultations/${c.id}`}
                    className="jood-panel__row-link"
                  >
                    <span className="jood-panel__row-title">
                      {c.full_name || c.email || `#${c.id}`}
                    </span>
                    <span className="jood-panel__row-meta">
                      {c.email ?? "—"}
                      {c.product_slug ? ` · ${c.product_slug}` : ""}
                      {" · "}
                      <span
                        className={`jood-panel__pill jood-panel__pill--${
                          c.status === "approved" ||
                          c.status === "submitted" ||
                          c.status === "reviewed"
                            ? "ok"
                            : c.status === "rejected"
                              ? "off"
                              : "neutral"
                        }`}
                      >
                        {c.status}
                      </span>
                      {" · "}
                      {fmtRelative(c.created_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Latest products + recent users row */}
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
