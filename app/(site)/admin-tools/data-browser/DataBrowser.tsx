"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { BADGE_REFRESH_EVENT } from "../AdminShell";
import {
  printLabels,
  composeMedicine,
  dispensingDate,
  type LabelData,
} from "../orders/[id]/dispensingLabel";
import { orderNumberDisplay, supplyTypeOf, isRedFlagOrder } from "@/lib/orderTag";

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
  /** When set, the header is a clickable sort control; value is the `sort`
   *  param sent to the list API (must be in that spec's sortableColumns). */
  sortKey?: string;
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

/** Human-readable absolute timestamp: "Today at 12:06 PM", "Yesterday at
 *  9:30 AM", else "8 Jul 2026 at 12:06 PM". Replaces relative "23h ago"
 *  formatting per the operational-workflow review. */
const fmtSmartDateTime = (iso: unknown) => {
  if (typeof iso !== "string" || !iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const time = d.toLocaleString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const now = new Date();
  const dayDiff = Math.round((startOf(now) - startOf(d)) / 86400000);
  if (dayDiff === 0) return `Today at ${time}`;
  if (dayDiff === 1) return `Yesterday at ${time}`;
  const sameYear = d.getFullYear() === now.getFullYear();
  const date = d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
  return `${date} at ${time}`;
};

const StatusPill = ({ value }: { value: unknown }) => {
  const v = String(value ?? "—").toLowerCase();
  let tone: "ok" | "warn" | "off" | "neutral" = "neutral";
  if (
    ["paid", "delivered", "approved", "active", "published", "submitted", "dispatched", "fulfilled"].includes(v)
  )
    tone = "ok";
  else if (["shipped", "reviewed", "draft", "pending", "unfulfilled", "clinical check", "to dispatch", "in clinical queue", "unpaid", "awaiting"].includes(v)) tone = "warn";
  else if (["cancelled", "rejected", "inactive", "false", "refunded", "failed"].includes(v)) tone = "off";
  return <span className={`db-pill db-pill--${tone}`}>{String(value ?? "—")}</span>;
};

/** One-click Published ⇄ Draft switch for blog posts, straight from the list.
 *  Optimistic: the pill flips immediately, then persists via the record API. */
const PostStatusToggle = ({ id, initial }: { id: number; initial: string }) => {
  const [status, setStatus] = useState(initial || "draft");
  const [busy, setBusy] = useState(false);
  const next = status === "published" ? "draft" : "published";
  const flip = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const prev = status;
    setStatus(next);
    try {
      const res = await fetch(`/api/admin-tools/record?type=posts&id=${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fields: { status: next } }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error ?? "failed");
    } catch {
      setStatus(prev); // revert on failure
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      type="button"
      onClick={flip}
      disabled={busy}
      title={`Click to ${next === "published" ? "publish" : "move to draft"}`}
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-semibold transition-colors disabled:opacity-50"
      style={
        status === "published"
          ? { background: "#cdfee1", color: "#0c5132", borderColor: "#9be3bd" }
          : { background: "#ffea8a", color: "#5c4813", borderColor: "#eeda7a" }
      }
    >
      {status === "published" ? "Published" : "Draft"}
      <span aria-hidden style={{ opacity: 0.6 }}>⇄</span>
    </button>
  );
};

/** Parse an order's items_json into { title, dose } line items for labels. */
function parseOrderLineItems(raw: unknown): Array<{ title: string; dose: string | null }> {
  let val: unknown = raw;
  if (typeof raw === "string") {
    try {
      val = JSON.parse(raw);
    } catch {
      return raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => {
          const m = s.match(/^(.*?)(?:\s*\(([^)]*)\))?\s*[x×]\s*\d+\s*$/i);
          return m
            ? { title: m[1].trim(), dose: (m[2] ?? "").trim() || null }
            : { title: s, dose: null };
        });
    }
  }
  const arr = Array.isArray(val) ? val : val && typeof val === "object" ? [val] : [];
  const out: Array<{ title: string; dose: string | null }> = [];
  for (const el of arr) {
    if (!el || typeof el !== "object") continue;
    const it = el as Record<string, unknown>;
    const title = String(it.title ?? it.name ?? it.product ?? "").trim();
    if (!title) continue;
    const dose =
      (typeof it.dose === "string" && it.dose) ||
      (typeof it.variant === "string" && it.variant) ||
      null;
    out.push({ title, dose });
  }
  return out;
}

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

/** Fulfillment status derived from an order row — mirrors where the order
 *  actually sits in the workflow, using the same names as the sidebar tabs:
 *    Dispatched      → already sent (shipped/delivered or has DPD tracking)
 *    To Dispatch     → supply approved, waiting to be dispensed + dispatched
 *    Clinical Check  → still awaiting clinical review */
function fulfillmentOf(row: Row): "Dispatched" | "To Dispatch" | "Clinical Check" {
  const status = String(row.status ?? "").toLowerCase();
  const notes = String(row.notes ?? "");
  const dispatched =
    ["shipped", "delivered", "dispatched"].includes(status) ||
    /DPD tracking:/i.test(notes);
  if (dispatched) return "Dispatched";
  return row.clinically_approved ? "To Dispatch" : "Clinical Check";
}


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
    const load = () => {
      fetch("/api/admin-tools/orders-summary", { credentials: "include", cache: "no-store" })
        .then((r) => r.json())
        .then((j) => {
          if (!off && j?.ok) setS(j as OrdersSummary);
        })
        .catch(() => {});
    };
    load();
    // Re-read the summary whenever an action changes the data (approve,
    // dispatch, fulfil) or the window regains focus, so these totals move at
    // the same moment as the sidebar counts instead of going stale.
    window.addEventListener(BADGE_REFRESH_EVENT, load);
    window.addEventListener("focus", load);
    return () => {
      off = true;
      window.removeEventListener(BADGE_REFRESH_EVENT, load);
      window.removeEventListener("focus", load);
    };
  }, []);

  // Nothing to summarise when there are no orders — hide the strip entirely
  // rather than showing a row of zeros.
  if (s && s.orders === 0) return null;

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
      { key: "order_number", label: "Order #", sortKey: "order_number", render: (r) => {
        // Prefer the server's history-aware flag (a repeat customer is a
        // reorder even when the order number is a clean JLxxxx); fall back to
        // the name-prefix check if the column isn't present.
        const supply =
          r.is_reorder === true || r.is_reorder === "true"
            ? "Reorder"
            : r.is_reorder === false || r.is_reorder === "false"
              ? "New Supply"
              : supplyTypeOf(r.order_number);
        const redFlag = isRedFlagOrder(r.order_number);
        return (
          <div>
            <span className="db-cell-strong">{orderNumberDisplay(r.order_number, r.id)}</span>
            <div className="db-order-tags">
              <span className={`db-pill db-pill--${supply === "Reorder" ? "warn" : "neutral"}`}>
                {supply}
              </span>
              {redFlag ? <span className="db-pill db-pill--off">Red flag</span> : null}
            </div>
          </div>
        );
      } },
      { key: "created_at", label: "Date", sortKey: "created_at", render: (r) => <span className="db-nowrap">{fmtSmartDateTime(r.created_at)}</span> },
      {
        key: "customer_name",
        label: "Customer",
        sortKey: "customer_name",
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
        sortKey: "total_amount",
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
          return <span className="db-nowrap">{n > 0 ? `${n} item${n === 1 ? "" : "s"}` : "—"}</span>;
        },
      },
      {
        key: "payment_status",
        label: "Payment",
        sortKey: "payment_status",
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
        sortKey: "full_name",
        render: (r) => (
          <div>
            <div className="db-cell-strong">
              {String(r.full_name ?? r.email ?? `#${r.id}`)}
            </div>
            <div className="db-cell-meta">{String(r.email ?? "")}</div>
          </div>
        ),
      },
      { key: "product_slug", label: "Product", sortKey: "product_slug" },
      { key: "dose", label: "Dose" },
      { key: "status", label: "Status", sortKey: "status", render: (r) => <StatusPill value={r.status} /> },
      { key: "created_at", label: "Submitted", sortKey: "created_at", render: (r) => fmtSmartDateTime(r.created_at) },
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
      {
        key: "status",
        label: "Status",
        render: (r) => (
          <PostStatusToggle id={Number(r.id)} initial={String(r.status ?? "draft")} />
        ),
      },
      {
        key: "published_at",
        label: "Published",
        render: (r) => fmtSmartDateTime(r.published_at ?? r.created_at),
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
      { key: "created_at", label: "Joined", render: (r) => fmtSmartDateTime(r.created_at) },
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
      { key: "created_at", label: "Uploaded", render: (r) => fmtSmartDateTime(r.created_at) },
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
/** Per-row destination. Customers open the rich customer page (keyed by
 *  email — full order history + stats) rather than the generic user editor. */
function rowHref(key: CollectionKey, row: Row): string {
  if (key === "users" && typeof row.email === "string" && row.email) {
    return `/admin-tools/customers/${encodeURIComponent(row.email)}`;
  }
  return detailHref(key, row.id);
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

  // Sort: which column + direction. null = server default order.
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  // Orders "job queue" fulfillment filter. Defaults to unfulfilled work.
  const [fulfillment, setFulfillment] = useState<"unfulfilled" | "all" | "dispatched">(
    "unfulfilled",
  );
  // Supply-type filter: show every order, only reorders, or only first-time
  // supplies. Composes with the fulfillment tabs (e.g. "To do" + "Reorder").
  const [supply, setSupply] = useState<"all" | "reorder" | "new">("all");
  // Batch multi-select — set of selected row ids on the current page.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchBusy, setBatchBusy] = useState(false);

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

  // Reset to page 1 whenever the active tab, search, date, sort or filter changes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [activeTab, debouncedSearch, dateFilter, sort, fulfillment, supply]);

  // Reset per-tab controls when switching collections.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setSort(null);
    setSelected(new Set());
    if (activeTab !== "orders") {
      setDateFilter("");
      setFulfillment("unfulfilled");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [activeTab]);

  // Toggle a column's sort: asc → desc → off (back to default order).
  const toggleSort = useCallback((key: string) => {
    setSort((cur) => {
      if (!cur || cur.key !== key) return { key, dir: "asc" };
      if (cur.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErr(null);
    setSelected(new Set());
    try {
      const params = new URLSearchParams({
        type: activeTab,
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (dateFilter && activeTab === "orders") params.set("date", dateFilter);
      if (activeTab === "orders" && fulfillment !== "all") {
        params.set("fulfillment", fulfillment);
      }
      if (activeTab === "orders" && supply !== "all") {
        params.set("supply", supply);
      }
      if (sort) {
        params.set("sort", sort.key);
        params.set("dir", sort.dir);
      }
      const res = await fetch(`/api/admin-tools/list?${params.toString()}`, {
        credentials: "include",
      });
      const json = (await res.json()) as ListResponse;
      if (!res.ok || !json.ok) {
        // Surface the real cause (e.g. "column X does not exist"), not just
        // the generic label, so schema issues are diagnosable.
        setErr(
          json.detail
            ? `${json.error ?? "Error"}: ${json.detail}`
            : (json.error ?? `HTTP ${res.status}`)
        );
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
  }, [activeTab, debouncedSearch, dateFilter, fulfillment, supply, sort, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData();
  }, [fetchData]);

  // Batch: mark all selected orders as dispatched (status → shipped).
  const batchMarkDispatched = useCallback(async () => {
    if (selected.size === 0 || batchBusy) return;
    setBatchBusy(true);
    setErr(null);
    try {
      const ids = [...selected];
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/admin-tools/record?type=orders&id=${encodeURIComponent(id)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ fields: { status: "shipped" } }),
          }),
        ),
      );
      await fetchData();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBatchBusy(false);
    }
  }, [selected, batchBusy, fetchData]);

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;

  // Batch: print dispensing labels for every selected order in one document.
  function batchPrintLabels() {
    const chosen = (data?.rows ?? []).filter((r) => selected.has(String(r.id)));
    if (chosen.length === 0) return;
    const date = dispensingDate();
    const labels: LabelData[] = [];
    for (const row of chosen) {
      const patient = String(row.customer_name ?? row.customer_email ?? "—").trim() || "—";
      const items = parseOrderLineItems(row.items_json);
      for (const it of items.length ? items : [{ title: "", dose: null }]) {
        const { brand, productLine } = composeMedicine(it.title, it.dose);
        labels.push({ brand, productName: productLine, patientName: patient, date });
      }
    }
    if (labels.length) printLabels(labels);
  }

  // Batch selection is offered on the Orders tab only.
  const selectable = activeTab === "orders";
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(String(r.id)));
  const someSelected = selected.size > 0;
  const toggleRow = (id: string) =>
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

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

      {/* Orders job-queue filter: unfulfilled work by default */}
      {activeTab === "orders" ? (
        <div className="db-segment" role="group" aria-label="Fulfillment filter">
          {([
            ["unfulfilled", "To do"],
            ["dispatched", "Dispatched"],
            ["all", "All"],
          ] as const).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setFulfillment(val)}
              className={`db-segment__btn ${fulfillment === val ? "db-segment__btn--active" : ""}`}
            >
              {label}
              {val === "unfulfilled" && fulfillment === "unfulfilled" && total > 0
                ? ` (${total.toLocaleString("en-GB")})`
                : ""}
            </button>
          ))}
          {fulfillment === "unfulfilled" ? (
            <span className="db-segment__note">
              Work queue — clear this to zero each day.
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Supply-type filter: separate reorders from first-time supplies */}
      {activeTab === "orders" ? (
        <div className="db-segment" role="group" aria-label="Supply type filter">
          {([
            ["all", "All supplies"],
            ["reorder", "Reorder"],
            ["new", "New Supply"],
          ] as const).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setSupply(val)}
              className={`db-segment__btn ${supply === val ? "db-segment__btn--active" : ""}`}
            >
              {label}
            </button>
          ))}
          {supply !== "all" ? (
            <span className="db-segment__note">
              Showing {supply === "reorder" ? "reorders" : "first-time supplies"} only
              {total > 0 ? ` (${total.toLocaleString("en-GB")})` : ""}.
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Batch action bar — appears when rows are selected (orders only) */}
      {activeTab === "orders" && selected.size > 0 ? (
        <div className="db-batchbar" role="region" aria-label="Batch actions">
          <span className="db-batchbar__count">
            {selected.size} selected
          </span>
          <button
            type="button"
            onClick={batchPrintLabels}
            className="db-btn"
          >
            Print dispensing labels
          </button>
          <button
            type="button"
            onClick={batchMarkDispatched}
            disabled={batchBusy}
            className="db-btn db-btn--primary"
          >
            {batchBusy ? "Working…" : "Mark as dispatched"}
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="db-btn"
          >
            Clear
          </button>
        </div>
      ) : null}

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
                  {selectable ? (
                    <th className="db-table__check">
                      <input
                        type="checkbox"
                        aria-label="Select all on this page"
                        checked={allSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someSelected && !allSelected;
                        }}
                        onChange={() =>
                          setSelected(
                            allSelected
                              ? new Set()
                              : new Set(rows.map((r) => String(r.id))),
                          )
                        }
                      />
                    </th>
                  ) : null}
                  {tab.columns.map((c) => {
                    const active = sort?.key === c.sortKey;
                    return (
                      <th key={c.key}>
                        {c.sortKey ? (
                          <button
                            type="button"
                            className={`db-sort ${active ? "db-sort--active" : ""}`}
                            onClick={() => toggleSort(c.sortKey as string)}
                          >
                            {c.label}
                            <span className="db-sort__arrow" aria-hidden>
                              {active ? (sort?.dir === "asc" ? "▲" : "▼") : "↕"}
                            </span>
                          </button>
                        ) : (
                          c.label
                        )}
                      </th>
                    );
                  })}
                  <th aria-label="Edit">&nbsp;</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && !loading ? (
                  <tr>
                    <td
                      colSpan={tab.columns.length + 1 + (selectable ? 1 : 0)}
                      className="db-table__empty"
                    >
                      {debouncedSearch
                        ? `No ${tab.label.toLowerCase()} match "${debouncedSearch}".`
                        : activeTab === "orders" && fulfillment === "unfulfilled"
                          ? "Nothing to do — the queue is clear."
                          : `No ${tab.label.toLowerCase()} yet.`}
                    </td>
                  </tr>
                ) : null}
                {rows.map((row, idx) => (
                  <tr
                    key={String(row.id ?? idx)}
                    className="db-table__row--link"
                    onClick={() => router.push(rowHref(tab.key, row))}
                  >
                    {selectable ? (
                      <td
                        className="db-table__check"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          aria-label={`Select order ${String(row.order_number ?? row.id)}`}
                          checked={selected.has(String(row.id))}
                          onChange={() => toggleRow(String(row.id))}
                        />
                      </td>
                    ) : null}
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
                        href={rowHref(tab.key, row)}
                        className="db-btn db-btn--ghost"
                      >
                        {tab.key === "orders" || tab.key === "users" ? "View" : "Edit"}
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
                {selectable ? (
                  <label className="db-card__check">
                    <input
                      type="checkbox"
                      checked={selected.has(String(row.id))}
                      onChange={() => toggleRow(String(row.id))}
                    />
                    Select
                  </label>
                ) : null}
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
                  href={rowHref(tab.key, row)}
                  className="db-btn db-btn--block"
                >
                  {tab.key === "orders" || tab.key === "users" ? "View →" : "Edit →"}
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
