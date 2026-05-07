"use client";

import Link from "next/link";
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
    ["paid", "delivered", "approved", "active", "published", "submitted"].includes(v)
  )
    tone = "ok";
  else if (["shipped", "reviewed", "draft", "pending"].includes(v)) tone = "warn";
  else if (["cancelled", "rejected", "inactive", "false"].includes(v)) tone = "off";
  return <span className={`db-pill db-pill--${tone}`}>{String(value ?? "—")}</span>;
};

const TABS: TabSpec[] = [
  {
    key: "orders",
    label: "Orders",
    description:
      "Customer purchases. Synced from HubSpot Deals + created at checkout.",
    payloadCollectionSlug: "orders",
    columns: [
      { key: "order_number", label: "Order #" },
      {
        key: "total_amount",
        label: "Total",
        render: (r) => (
          <strong className="db-amount">{fmtCurrency(r.total_amount)}</strong>
        ),
      },
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
      { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
      { key: "created_at", label: "Created", render: (r) => fmtRelative(r.created_at) },
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

function readInitialTab(): CollectionKey {
  if (typeof window === "undefined") return "orders";
  const params = new URLSearchParams(window.location.search);
  const t = params.get("type") ?? "";
  if (
    [
      "orders",
      "consultations",
      "posts",
      "users",
      "products",
      "media",
      "discounts",
    ].includes(t)
  ) {
    return t as CollectionKey;
  }
  return "orders";
}

export default function DataBrowser() {
  const [activeTab, setActiveTab] = useState<CollectionKey>("orders");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const tab = useMemo(
    () => TABS.find((t) => t.key === activeTab) ?? TABS[0],
    [activeTab]
  );

  // Sync the active tab with the ?type= query param on first mount
  // so dashboard CTAs land on the right collection.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveTab(readInitialTab());
  }, []);

  // Debounce search input so we don't hammer the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 whenever the active tab or search changes.
  useEffect(() => {
    setPage(1);
  }, [activeTab, debouncedSearch]);

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
  }, [activeTab, debouncedSearch, page]);

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
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            className={`db-tab ${activeTab === t.key ? "db-tab--active" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Description + search row */}
      <div className="db-toolbar">
        <p className="db-toolbar__hint">{tab.description}</p>
        <div className="db-toolbar__controls">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${tab.label.toLowerCase()}…`}
            className="db-search"
          />
          <button
            type="button"
            onClick={() => fetchData()}
            disabled={loading}
            className="db-btn"
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
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
                  <tr key={String(row.id ?? idx)}>
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
                        href={`/admin/collections/${tab.payloadCollectionSlug}/${row.id}`}
                        className="db-btn db-btn--ghost"
                      >
                        Edit
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
                  href={`/admin/collections/${tab.payloadCollectionSlug}/${row.id}`}
                  className="db-btn db-btn--block"
                >
                  Edit →
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
