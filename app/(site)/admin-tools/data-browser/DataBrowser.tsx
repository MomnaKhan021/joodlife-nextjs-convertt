"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Multi-collection data browser. Tabs across the top, mobile-first
 * card list / desktop table for each collection, with search +
 * pagination + click-to-edit (links into Payload's per-collection
 * edit screen, which renders a single doc fine even when the list
 * view is broken).
 */

type CollectionKey =
  | "orders"
  | "consultations"
  | "posts"
  | "users"
  | "products"
  | "media"
  | "discounts";

type ColumnSpec = {
  key: string;
  label: string;
  hint?: string;
  /** Renderer for one row's cell. Receives the raw row object. */
  render?: (row: Row) => React.ReactNode;
  /** Hidden under the breakpoint (px). Default: always visible. */
  hideBelow?: number;
};

type TabSpec = {
  key: CollectionKey;
  label: string;
  description: string;
  columns: ColumnSpec[];
  payloadCollectionSlug: string;
};

type Row = Record<string, unknown>;

type ListResponse = {
  ok: boolean;
  rows?: Row[];
  total?: number;
  page?: number;
  pages?: number;
  pageSize?: number;
  error?: string;
  detail?: string;
};

const fmtCurrency = (v: unknown) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n)
    ? `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "—";
};

const fmtRelative = (iso: unknown) => {
  if (typeof iso !== "string" || !iso) return "—";
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
};

const StatusPill = ({ value }: { value: unknown }) => {
  const v = String(value ?? "—").toLowerCase();
  let tone: "ok" | "warn" | "off" | "neutral" = "neutral";
  if (
    ["paid", "delivered", "approved", "active", "published", "submitted", "dispatched", "fulfilled"].includes(v)
  )
    tone = "ok";
  else if (["shipped", "reviewed", "draft", "pending", "unfulfilled", "unpaid", "awaiting"].includes(v)) tone = "warn";
  else if (["cancelled", "rejected", "inactive", "false", "refunded", "failed"].includes(v)) tone = "off";
  return <span className={`db-pill db-pill--${tone}`}>{String(value ?? "—")}</span>;
};

/** Count line-items in an order's items_json (string, array, or {body}). */
function orderItemCount(raw: unknown): number {
  let val: unknown = raw;
  if (typeof raw === "string") {
    try {
      val = JSON.parse(raw);
    } catch {
      // "Title (dose) × 2, Other × 1" style summary → count segments
      return raw.split(",").filter((s) => s.trim()).length || 1;
    }
  }
  if (Array.isArray(val)) {
    return val.reduce((sum, it) => {
      const q = Number((it as { quantity?: unknown; qty?: unknown })?.quantity ?? (it as { qty?: unknown })?.qty ?? 1);
      return sum + (Number.isFinite(q) && q > 0 ? q : 1);
    }, 0);
  }
  if (val && typeof val === "object" && Array.isArray((val as { body?: unknown }).body)) {
    return orderItemCount((val as { body: unknown }).body);
  }
  return 0;
}

/** Shopify-style fulfillment status derived from an order row. */
function fulfillmentOf(row: Row): "Dispatched" | "Unfulfilled" {
  const status = String(row.status ?? "").toLowerCase();
  const notes = String(row.notes ?? "");
  const dispatched =
    ["shipped", "delivered", "dispatched"].includes(status) ||
    /DPD tracking:/i.test(notes);
  return dispatched ? "Dispatched" : "Unfulfilled";
}

/** Absolute short date+time for the orders list ("8 Jul, 12:06"). */
const fmtDateTime = (iso: unknown) => {
  if (typeof iso !== "string" || !iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/** Tiny inline sparkline for a KPI card (Shopify-style). */
function Sparkline({ data }: { data: number[] }) {
  if (!data || data.length < 2) {
    return <div className="db-kpi__spark" aria-hidden />;
  }
  const w = 96;
  const h = 28;
  const max = Math.max(...data, 1);
  const step = w / (data.length - 1);
  const pts = data
    .map((v, i) => `${(i * step).toFixed(1)},${(h - (v / max) * (h - 4) - 2).toFixed(1)}`)
    .join(" ");
  return (
    <svg className="db-kpi__spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden>
      <polyline points={pts} fill="none" stroke="#0c5132" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

type OrdersSummary = {
  ok: boolean;
  orders: number;
  items: number;
  fulfilled: number;
  delivered: number;
  returns: number;
  revenue: number;
  series: number[];
};

/** Shopify-style KPI header for the Orders tab. */
function OrdersKpiStrip() {
  const [s, setS] = useState<OrdersSummary | null>(null);
  useEffect(() => {
    let off = false;
    fetch("/api/admin-tools/orders-summary", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (!off && j?.ok) setS(j as OrdersSummary);
      })
      .catch(() => {});
    return () => {
      off = true;
    };
  }, []);

  const num = (n: number | undefined) =>
    typeof n === "number" ? n.toLocaleString("en-GB") : "—";
  const cards: { label: string; value: string; spark?: number[] }[] = [
    { label: "Orders", value: num(s?.orders), spark: s?.series },
    { label: "Items ordered", value: num(s?.items), spark: s?.series },
    { label: "Revenue", value: s ? fmtCurrency(s.revenue) : "—" },
    { label: "Returns", value: num(s?.returns) },
    { label: "Orders fulfilled", value: num(s?.fulfilled) },
    { label: "Orders delivered", value: num(s?.delivered) },
  ];

  return (
    <div className="db-kpis" role="group" aria-label="Order metrics">
      {cards.map((c) => (
        <div key={c.label} className="db-kpi">
          <div className="db-kpi__top">
            <span className="db-kpi__label">{c.label}</span>
            {c.spark ? <Sparkline data={c.spark} /> : null}
          </div>
          <span className="db-kpi__value">{s ? c.value : "…"}</span>
        </div>
      ))}
    </div>
  );
}

const TABS: TabSpec[] = [
  {
    key: "orders",
    label: "Orders",
    description:
      "Customer purchases. Synced from HubSpot Deals + created at checkout.",
    payloadCollectionSlug: "orders",
    columns: [
      { key: "order_number", label: "Order #", render: (r) => (
        <span className="db-cell-strong">{String(r.order_number ?? `#${r.id}`)}</span>
      ) },
      { key: "created_at", label: "Date", render: (r) => fmtDateTime(r.created_at) },
      {
        key: "customer_name",
        label: "Customer",
        render: (r) => (
          <div>
            <div className="db-cell-strong">
              {String(r.customer_name ?? r.customer_email ?? "—")}
            </div>
            <div className="db-cell-meta">{String(r.customer_email ?? "")}</div>
          </div>
        ),
      },
      {
        key: "total_amount",
        label: "Total",
        render: (r) => (
          <strong className="db-amount">{fmtCurrency(r.total_amount)}</strong>
        ),
      },
      {
        key: "fulfillment",
        label: "Fulfillment",
        render: (r) => <StatusPill value={fulfillmentOf(r)} />,
      },
      {
        key: "items_json",
        label: "Items",
        render: (r) => {
          const n = orderItemCount(r.items_json);
          return n > 0 ? `${n} item${n === 1 ? "" : "s"}` : "—";
        },
      },
      {
        key: "payment_status",
        label: "Payment",
        render: (r) => <StatusPill value={r.payment_status ?? r.status} />,
      },
    ],
  },
  {
    key: "consultations",
    label: "Consultations",
    description:
      "Form submissions from joodlife.com + the JOOD Consultation Form in HubSpot Marketing Forms.",
    payloadCollectionSlug: "consultations",
    columns: [
      {
        key: "full_name",
        label: "Customer",
        render: (r) => (
          <div>
            <div className="db-cell-strong">
              {String(r.full_name ?? r.email ?? `#${r.id}`)}
            </div>
            <div className="db-cell-meta">{String(r.email ?? "")}</div>
          </div>
        ),
      },
      { key: "product_slug", label: "Product" },
      { key: "dose", label: "Dose" },
      { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
      { key: "created_at", label: "Submitted", render: (r) => fmtRelative(r.created_at) },
    ],
  },
  {
    key: "posts",
    label: "Posts",
    description: "Blog articles published at /blogs.",
    payloadCollectionSlug: "posts",
    columns: [
      { key: "title", label: "Title" },
      { key: "category", label: "Category" },
      { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
      {
        key: "published_at",
        label: "Published",
        render: (r) => fmtRelative(r.published_at ?? r.created_at),
      },
    ],
  },
  {
    key: "users",
    label: "Users",
    description: "Customer accounts + admins.",
    payloadCollectionSlug: "users",
    columns: [
      {
        key: "name",
        label: "Name",
        render: (r) => (
          <div>
            <div className="db-cell-strong">{String(r.name ?? r.email ?? "—")}</div>
            <div className="db-cell-meta">{String(r.email ?? "")}</div>
          </div>
        ),
      },
      { key: "role", label: "Role", render: (r) => <StatusPill value={r.role} /> },
      { key: "phone", label: "Phone" },
      { key: "created_at", label: "Joined", render: (r) => fmtRelative(r.created_at) },
    ],
  },
  {
    key: "products",
    label: "Products",
    description: "Storefront catalogue.",
    payloadCollectionSlug: "products",
    columns: [
      { key: "title", label: "Title" },
      { key: "category", label: "Category" },
      {
        key: "from_price",
        label: "From",
        render: (r) => fmtCurrency(r.from_price),
      },
      {
        key: "is_active",
        label: "Active",
        render: (r) => <StatusPill value={r.is_active ? "active" : "inactive"} />,
      },
    ],
  },
  {
    key: "media",
    label: "Media",
    description: "Uploaded assets in Vercel Blob.",
    payloadCollectionSlug: "media",
    columns: [
      { key: "alt", label: "Alt text" },
      { key: "mime_type", label: "Type" },
      {
        key: "filesize",
        label: "Size",
        render: (r) => {
          const n = Number(r.filesize ?? 0);
          if (!Number.isFinite(n) || n <= 0) return "—";
          if (n < 1024) return `${n} B`;
          if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
          return `${(n / (1024 * 1024)).toFixed(1)} MB`;
        },
      },
      { key: "created_at", label: "Uploaded", render: (r) => fmtRelative(r.created_at) },
    ],
  },
  {
    key: "discounts",
    label: "Discounts",
    description: "Promo codes for the storefront.",
    payloadCollectionSlug: "discounts",
    columns: [
      { key: "code", label: "Code" },
      { key: "type", label: "Type" },
      { key: "value", label: "Value" },
      {
        key: "is_active",
        label: "Active",
        render: (r) => <StatusPill value={r.is_active ? "active" : "inactive"} />,
      },
    ],
  },
];

const PAGE_SIZE = 25;

/** Detail/edit destination per collection — products and orders use the new
 *  Shopify-style pages; everything else uses the generic editor. */
function detailHref(key: CollectionKey, id: unknown): string {
  if (key === "products") return `/admin-tools/products/${id}`;
  if (key === "orders") return `/admin-tools/orders/${id}`;
  return `/admin-tools/edit/${key}/${id}`;
}
function newHref(key: CollectionKey): string {
  if (key === "products") return `/admin-tools/products/new`;
  return `/admin-tools/edit/${key}/new`;
}
function addLabel(label: string): string {
  return `Add ${label.replace(/s$/, "").toLowerCase()}`;
}

const TAB_KEYS: CollectionKey[] = [
  "orders",
  "consultations",
  "posts",
  "users",
  "products",
  "media",
  "discounts",
];

function normalizeTab(t: string | null | undefined): CollectionKey {
  return t && (TAB_KEYS as string[]).includes(t) ? (t as CollectionKey) : "orders";
}

export default function DataBrowser({ allowedTypes }: { allowedTypes?: string[] | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Staff only see the collection tabs they're permitted (admins: all).
  const visibleTabs = useMemo(
    () => (allowedTypes ? TABS.filter((t) => allowedTypes.includes(t.key)) : TABS),
    [allowedTypes],
  );

  // The URL's ?type= is the single source of truth for the active tab.
  // Reading it via useSearchParams() means the tab reacts to sidebar
  // navigation (which only changes the query string) WITHOUT a reload —
  // the previous mount-only read left the tab stale until a refresh.
  const activeTab = normalizeTab(searchParams.get("type"));

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const tab = useMemo(
    () => TABS.find((t) => t.key === activeTab) ?? TABS[0],
    [activeTab]
  );

  // Switch tab by updating the URL — keeps the sidebar highlight,
  // back/forward, and shareable links all in sync.
  const selectTab = useCallback(
    (key: CollectionKey) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("type", key);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  // Debounce search input so we don't hammer the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 whenever the active tab, search or date filter changes.
  useEffect(() => {
    setPage(1);
  }, [activeTab, debouncedSearch, dateFilter]);

  // Date filter only applies to the orders tab; clear it when leaving.
  useEffect(() => {
    if (activeTab !== "orders") setDateFilter("");
  }, [activeTab]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const params = new URLSearchParams({
        type: activeTab,
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (dateFilter && activeTab === "orders") params.set("date", dateFilter);
      const res = await fetch(`/api/admin-tools/list?${params.toString()}`, {
        credentials: "include",
      });
      const json = (await res.json()) as ListResponse;
      if (!res.ok || !json.ok) {
        setErr(json.error ?? `HTTP ${res.status}`);
        setData(null);
        return;
      }
      setData(json);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [activeTab, debouncedSearch, dateFilter, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData();
  }, [fetchData]);

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;

  return (
    <section className="db-browser">
      {/* Tabs */}
      <nav className="db-tabs" aria-label="Collections">
        {visibleTabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => selectTab(t.key)}
            className={`db-tab ${activeTab === t.key ? "db-tab--active" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Shopify-style KPI header — orders tab only */}
      {activeTab === "orders" ? <OrdersKpiStrip /> : null}

      {/* Description + search row */}
      <div className="db-toolbar">
        <p className="db-toolbar__hint">{tab.description}</p>
        <div className="db-toolbar__controls">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeTab === "orders"
                ? "Search by order # or email…"
                : `Search ${tab.label.toLowerCase()}…`
            }
            className="db-search"
          />
          {activeTab === "orders" ? (
            <>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                aria-label="Filter orders by date"
                className="db-btn"
                style={{ colorScheme: "light" }}
              />
              {dateFilter ? (
                <button
                  type="button"
                  onClick={() => setDateFilter("")}
                  className="db-btn"
                >
                  Clear date
                </button>
              ) : null}
            </>
          ) : null}
          <button
            type="button"
            onClick={() => fetchData()}
            disabled={loading}
            className="db-btn"
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
          <Link
            href={newHref(tab.key)}
            className="db-btn db-btn--primary"
          >
            {addLabel(tab.label)}
          </Link>
        </div>
      </div>

      {err ? (
        <div className="db-error">
          <strong>Failed to load:</strong> {err}
        </div>
      ) : null}

      {/* Card list (mobile) + Table (desktop), same data either way */}
      {!err ? (
        <>
          <div className="db-table-wrap" role="region" aria-label="Results">
            <table className="db-table">
              <thead>
                <tr>
                  {tab.columns.map((c) => (
                    <th key={c.key}>{c.label}</th>
                  ))}
                  <th aria-label="Edit">&nbsp;</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && !loading ? (
                  <tr>
                    <td
                      colSpan={tab.columns.length + 1}
                      className="db-table__empty"
                    >
                      {debouncedSearch
                        ? `No ${tab.label.toLowerCase()} match "${debouncedSearch}".`
                        : `No ${tab.label.toLowerCase()} yet.`}
                    </td>
                  </tr>
                ) : null}
                {rows.map((row, idx) => (
                  <tr
                    key={String(row.id ?? idx)}
                    className="db-table__row--link"
                    onClick={() => router.push(detailHref(tab.key, row.id))}
                  >
                    {tab.columns.map((c) => (
                      <td key={c.key}>
                        {c.render
                          ? c.render(row)
                          : row[c.key] === null || row[c.key] === undefined
                            ? "—"
                            : String(row[c.key])}
                      </td>
                    ))}
                    <td className="db-table__edit">
                      <Link
                        href={detailHref(tab.key, row.id)}
                        className="db-btn db-btn--ghost"
                      >
                        {tab.key === "orders" ? "View" : "Edit"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile-only card list */}
          <ul className="db-cards" aria-label="Results (mobile)">
            {rows.length === 0 && !loading ? (
              <li className="db-cards__empty">
                {debouncedSearch
                  ? `No ${tab.label.toLowerCase()} match "${debouncedSearch}".`
                  : `No ${tab.label.toLowerCase()} yet.`}
              </li>
            ) : null}
            {rows.map((row, idx) => (
              <li key={String(row.id ?? idx)} className="db-card">
                <dl className="db-card__list">
                  {tab.columns.map((c) => (
                    <div key={c.key} className="db-card__row">
                      <dt>{c.label}</dt>
                      <dd>
                        {c.render
                          ? c.render(row)
                          : row[c.key] === null || row[c.key] === undefined
                            ? "—"
                            : String(row[c.key])}
                      </dd>
                    </div>
                  ))}
                </dl>
                <Link
                  href={detailHref(tab.key, row.id)}
                  className="db-btn db-btn--block"
                >
                  {tab.key === "orders" ? "View →" : "Edit →"}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {/* Pagination */}
      <div className="db-pager">
        <p className="db-pager__count">
          {total > 0
            ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(
                page * PAGE_SIZE,
                total
              )} of ${total.toLocaleString("en-GB")}`
            : `0 results`}
        </p>
        <div className="db-pager__controls">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="db-btn"
          >
            ← Prev
          </button>
          <span className="db-pager__page">
            Page {page} / {pages}
          </span>
          <button
            type="button"
            disabled={page >= pages || loading}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            className="db-btn"
          >
            Next →
          </button>
        </div>
      </div>
    </section>
  );
}
