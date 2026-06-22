"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
type OrderItem = {
  title?: string;
  dose?: string | null;
  price?: number;
  quantity?: number;
  imageUrl?: string | null;
};

type OrderRow = {
  id: number;
  order_number: string;
  status: string | null;
  payment_status: string | null;
  payment_method: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  shipping_address: string | null;
  items_json: unknown;
  total_amount: number | string | null;
  discount_amount: number | string | null;
  notes: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string | null;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const gbp = (n: number) =>
  n.toLocaleString("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 });

function num(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
}

function parseItems(v: unknown): OrderItem[] {
  if (Array.isArray(v)) return v as OrderItem[];
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function fmtTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true });
}

/* ------------------------------------------------------------------ */
/* Small UI atoms                                                      */
/* ------------------------------------------------------------------ */
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-[12px] border border-[#e1e3e5] bg-white shadow-[0_1px_0_rgba(0,0,0,0.05)] ${className}`}
    >
      {children}
    </section>
  );
}

function PaidBadge({ status }: { status: string | null }) {
  const paid = status === "paid";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e3e3e3] px-2 py-0.5 text-[12px] font-medium text-[#303030]">
      <span className={`h-2 w-2 rounded-full ${paid ? "bg-[#303030]" : "bg-[#8a6116]"}`} />
      {paid ? "Paid" : status === "refunded" ? "Refunded" : "Payment pending"}
    </span>
  );
}

function FulfillBadge({ fulfilled }: { fulfilled: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[12px] font-medium ${
        fulfilled ? "bg-[#e3e3e3] text-[#303030]" : "bg-[#ffea8a] text-[#5c4813]"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${fulfilled ? "bg-[#303030]" : "bg-[#b98900]"}`} />
      {fulfilled ? "Fulfilled" : "Unfulfilled"}
    </span>
  );
}

function HeaderBtn({
  children,
  primary,
  onClick,
}: {
  children: React.ReactNode;
  primary?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        primary
          ? "inline-flex h-[32px] items-center justify-center rounded-[8px] bg-[#303030] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#1a1a1a]"
          : "inline-flex h-[32px] items-center justify-center rounded-[8px] border border-[#babfc3] bg-white px-3.5 text-[13px] font-medium text-[#303030] shadow-[0_1px_0_rgba(0,0,0,0.05)] transition-colors hover:bg-[#f7f7f7]"
      }
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */
export default function OrderDetailClient({ id }: { id: string }) {
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fulfilled, setFulfilled] = useState(false);
  const [savingFulfil, setSavingFulfil] = useState(false);

  const [notes, setNotes] = useState("");
  const [notesDirty, setNotesDirty] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  const [tags, setTags] = useState<string[]>(["checkify_order"]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/admin-tools/record?type=orders&id=${encodeURIComponent(id)}`,
          { credentials: "include" },
        );
        const json = await res.json();
        if (!res.ok || !json.ok || !json.row) {
          throw new Error(json?.error ?? "Order not found");
        }
        if (cancelled) return;
        const row = json.row as OrderRow;
        setOrder(row);
        setFulfilled(["shipped", "delivered", "fulfilled"].includes(String(row.status)));
        setNotes(row.notes ?? "");
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function patch(fields: Record<string, unknown>) {
    const res = await fetch(
      `/api/admin-tools/record?type=orders&id=${encodeURIComponent(id)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fields }),
      },
    );
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.error ?? `Save failed (HTTP ${res.status})`);
    }
  }

  async function markFulfilled() {
    if (!order || savingFulfil) return;
    setSavingFulfil(true);
    try {
      const next = fulfilled ? "paid" : "shipped";
      await patch({ status: next });
      setFulfilled(!fulfilled);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingFulfil(false);
    }
  }

  async function saveNotes() {
    if (savingNotes) return;
    setSavingNotes(true);
    try {
      await patch({ notes });
      setNotesDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingNotes(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f1f1f1] px-4 py-10">
        <div className="mx-auto max-w-[1000px] animate-pulse text-[14px] text-[#616161]">
          Loading order…
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-[#f1f1f1] px-4 py-10">
        <div className="mx-auto max-w-[1000px] rounded-lg border border-[#e1e3e5] bg-white p-6 text-[14px] text-red-700">
          {error ?? "Order not found."}
        </div>
      </main>
    );
  }

  const items = parseItems(order.items_json);
  const itemCount = items.reduce((a, i) => a + (i.quantity ?? 1), 0);
  const subtotal = items.reduce((a, i) => a + num(i.price) * (i.quantity ?? 1), 0);
  const discount = num(order.discount_amount);
  const total = num(order.total_amount);
  const paid = order.payment_status === "paid";
  const created = order.created_at;

  return (
    <main className="min-h-screen bg-[#f1f1f1] pb-16 font-ui text-[#303030]">
      <div className="mx-auto max-w-[1000px] px-4 pt-5 md:px-6">
        {/* ── Header ── */}
        <div className="flex flex-col gap-3 pb-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-2">
            <Link
              href="/admin-tools/data-browser"
              aria-label="Back to orders"
              className="mt-1 grid h-7 w-7 place-items-center rounded-[8px] border border-[#babfc3] bg-white text-[#616161] transition-colors hover:bg-[#f7f7f7]"
            >
              ‹
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[20px] font-semibold leading-none text-[#1a1a1a]">
                  {order.order_number}
                </h1>
                <PaidBadge status={order.payment_status} />
                <FulfillBadge fulfilled={fulfilled} />
              </div>
              <p className="mt-1.5 text-[13px] text-[#616161]">
                {fmtDateTime(created)} from JoodLife
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <HeaderBtn>Refund</HeaderBtn>
            <HeaderBtn>Edit</HeaderBtn>
            <HeaderBtn>Print ▾</HeaderBtn>
            <HeaderBtn>More actions ▾</HeaderBtn>
          </div>
        </div>

        {/* ── Body grid ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_336px]">
          {/* LEFT */}
          <div className="flex flex-col gap-4">
            {/* Fulfillment */}
            <Card>
              <div className="flex items-center gap-2 px-5 pt-4">
                <FulfillBadge fulfilled={fulfilled} />
              </div>
              <div className="px-5 pb-2 pt-4">
                <div className="flex items-center gap-2 rounded-[8px] border border-[#e1e3e5] px-3 py-2 text-[13px] font-medium text-[#303030]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="text-[#616161]">
                    <path d="M2 6.5h11v9H2zM13 9.5h4l3 3v3h-7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                    <circle cx="6.5" cy="17.5" r="1.6" stroke="currentColor" strokeWidth="1.6" />
                    <circle cx="16.5" cy="17.5" r="1.6" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                  Delivery Charges
                </div>
              </div>
              <div className="px-5 pb-4">
                {items.map((it, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-[8px] border border-[#e1e3e5] px-3 py-3"
                  >
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-[8px] bg-[#f1f1f1]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {it.imageUrl ? (
                        <img src={it.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-[#1450b0]">
                        {it.title ?? "Item"}
                      </p>
                      {it.dose ? (
                        <p className="text-[12px] text-[#616161]">{it.dose}</p>
                      ) : null}
                    </div>
                    <div className="text-[13px] text-[#616161]">
                      {gbp(num(it.price))} × {it.quantity ?? 1}
                    </div>
                    <div className="w-[80px] text-right text-[13px] font-medium">
                      {gbp(num(it.price) * (it.quantity ?? 1))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-[#e1e3e5] px-5 py-3">
                <HeaderBtn onClick={markFulfilled}>
                  {savingFulfil ? "Saving…" : fulfilled ? "Mark as unfulfilled" : "Mark as fulfilled ▾"}
                </HeaderBtn>
                <HeaderBtn primary>Create shipping label</HeaderBtn>
              </div>
            </Card>

            {/* Payment */}
            <Card>
              <div className="flex items-center gap-2 px-5 pt-4">
                <PaidBadge status={order.payment_status} />
              </div>
              <div className="px-5 py-4">
                <div className="rounded-[10px] border border-[#e1e3e5]">
                  <Row label="Subtotal" sub={`${itemCount} item${itemCount === 1 ? "" : "s"}`} value={gbp(subtotal)} />
                  {discount > 0 ? (
                    <Row label="Discount" sub="" value={`-${gbp(discount)}`} />
                  ) : null}
                  <Row
                    label="Shipping"
                    sub="Delivery Charges (0.0 lb: Items 0.0 lb, Package 0.0 lb)"
                    value={gbp(0)}
                  />
                  <Row label="Total" value={gbp(total)} bold />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-[#e1e3e5] px-1 pt-3 text-[13px]">
                  <span className="font-semibold">{paid ? "Paid" : "Amount due"}</span>
                  <span className="font-semibold">{gbp(paid ? total : total)}</span>
                </div>
              </div>
            </Card>

            {/* Timeline */}
            <Card>
              <div className="px-5 py-4">
                <h2 className="text-[14px] font-semibold">Timeline</h2>
                <div className="mt-3 flex items-start gap-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e879b9] text-[12px] font-semibold text-white">
                    JL
                  </span>
                  <div className="flex-1 rounded-[8px] border border-[#babfc3] px-3 py-2 text-[13px] text-[#8a8a8a]">
                    Leave a comment…
                  </div>
                </div>
                <p className="mt-2 text-right text-[12px] text-[#8a8a8a]">
                  Only you and other staff can see comments
                </p>

                <p className="mt-4 text-[12px] font-semibold text-[#616161]">Today</p>
                <ul className="mt-2 flex flex-col gap-3 border-l border-[#e1e3e5] pl-4">
                  <TimelineItem time={fmtTime(created)}>
                    Order confirmation email sent to {order.customer_name ?? "customer"} ({order.customer_email}).
                  </TimelineItem>
                  <TimelineItem time={fmtTime(created)}>
                    A {gbp(total)} payment was processed on{" "}
                    {order.payment_method === "test" ? "a free order" : "Stripe"}.
                  </TimelineItem>
                  {order.stripe_payment_intent_id ? (
                    <TimelineItem time={fmtTime(created)}>
                      Confirmation {order.stripe_payment_intent_id} was generated for this order.
                    </TimelineItem>
                  ) : null}
                  <TimelineItem time={fmtTime(created)}>
                    {order.customer_name ?? "Customer"} placed this order on JoodLife.
                  </TimelineItem>
                </ul>
              </div>
            </Card>
          </div>

          {/* RIGHT */}
          <div className="flex flex-col gap-4">
            {/* Notes */}
            <Card>
              <div className="px-5 py-4">
                <h2 className="text-[14px] font-semibold">Notes</h2>
                <textarea
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    setNotesDirty(true);
                  }}
                  placeholder="No notes from customer"
                  rows={2}
                  className="mt-2 w-full resize-y rounded-[8px] border border-[#e1e3e5] px-3 py-2 text-[13px] text-[#303030] outline-none focus:border-[#303030]"
                />
                {notesDirty ? (
                  <div className="mt-2 flex justify-end">
                    <HeaderBtn primary onClick={saveNotes}>
                      {savingNotes ? "Saving…" : "Save"}
                    </HeaderBtn>
                  </div>
                ) : null}
              </div>
            </Card>

            {/* Channel */}
            <Card>
              <div className="px-5 py-4">
                <h2 className="text-[14px] font-semibold">Channel information</h2>
                <p className="mt-2 text-[12px] text-[#616161]">Channel</p>
                <p className="text-[13px] text-[#303030]">JoodLife</p>
              </div>
            </Card>

            {/* Customer */}
            <Card>
              <div className="px-5 py-4">
                <h2 className="text-[14px] font-semibold">Customer</h2>
                <p className="mt-2 text-[13px] font-medium text-[#1450b0]">
                  {order.customer_name ?? "—"}
                </p>

                <h3 className="mt-4 text-[13px] font-semibold">Contact information</h3>
                {order.customer_email ? (
                  <a
                    href={`mailto:${order.customer_email}`}
                    className="block text-[13px] text-[#1450b0]"
                  >
                    {order.customer_email}
                  </a>
                ) : null}
                <p className="text-[13px] text-[#616161]">
                  {order.customer_phone || "No phone number"}
                </p>

                <h3 className="mt-4 text-[13px] font-semibold">Shipping address</h3>
                <p className="whitespace-pre-line text-[13px] text-[#616161]">
                  {order.shipping_address || "—"}
                </p>

                <h3 className="mt-4 text-[13px] font-semibold">Billing address</h3>
                <p className="text-[13px] text-[#616161]">Same as shipping address</p>
              </div>
            </Card>

            {/* Tags */}
            <Card>
              <div className="px-5 py-4">
                <h2 className="text-[14px] font-semibold">Tags</h2>
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && tagInput.trim()) {
                      setTags((t) => [...new Set([...t, tagInput.trim()])]);
                      setTagInput("");
                    }
                  }}
                  placeholder="Add a tag and press Enter"
                  className="mt-2 w-full rounded-[8px] border border-[#e1e3e5] px-3 py-2 text-[13px] outline-none focus:border-[#303030]"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-[8px] bg-[#e3e3e3] px-2 py-1 text-[12px] text-[#303030]"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => setTags((arr) => arr.filter((x) => x !== t))}
                        aria-label={`Remove ${t}`}
                        className="text-[#616161] hover:text-[#303030]"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

function Row({
  label,
  sub,
  value,
  bold,
}: {
  label: string;
  sub?: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[#e1e3e5] px-3.5 py-2.5 last:border-b-0">
      <div className="min-w-0">
        <span className={`text-[13px] ${bold ? "font-semibold" : "text-[#303030]"}`}>{label}</span>
        {sub ? <p className="text-[12px] text-[#616161]">{sub}</p> : null}
      </div>
      <span className={`shrink-0 text-[13px] ${bold ? "font-semibold" : "text-[#303030]"}`}>
        {value}
      </span>
    </div>
  );
}

function TimelineItem({ children, time }: { children: React.ReactNode; time: string }) {
  return (
    <li className="relative flex items-start justify-between gap-3">
      <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-[#8a8a8a]" />
      <span className="text-[13px] text-[#303030]">{children}</span>
      <span className="shrink-0 text-[12px] text-[#8a8a8a]">{time}</span>
    </li>
  );
}
