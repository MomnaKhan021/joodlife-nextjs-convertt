"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { refreshAdminBadges } from "../../AdminShell";

import { printLabels, printHtmlDocument, dispensingDate, composeMedicine, type LabelData } from "./dispensingLabel";

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

type OrderComment = {
  text: string;
  at: string; // ISO timestamp
  author?: string;
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
  admin_comments: unknown;
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

function parseComments(v: unknown): OrderComment[] {
  let arr: unknown = v;
  if (typeof v === "string") {
    try {
      arr = JSON.parse(v);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(arr)) return [];
  return arr
    .map((c): OrderComment | null => {
      if (c && typeof c === "object") {
        const o = c as Record<string, unknown>;
        const text = typeof o.text === "string" ? o.text : "";
        if (!text.trim()) return null;
        return {
          text,
          at: typeof o.at === "string" ? o.at : "",
          author: typeof o.author === "string" ? o.author : undefined,
        };
      }
      return null;
    })
    .filter((c): c is OrderComment => c !== null);
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
      className={`rounded-[16px] border border-[#e6e8e3] bg-white shadow-[0_1px_2px_rgba(20,46,42,0.05),0_10px_30px_-20px_rgba(20,46,42,0.25)] ${className}`}
    >
      {children}
    </section>
  );
}

function PaidBadge({ status }: { status: string | null }) {
  const paid = status === "paid";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e3e3e3] px-2 py-0.5 text-[12px] font-medium text-[#142e2a]">
      <span className={`h-2 w-2 rounded-full ${paid ? "bg-[#142e2a]" : "bg-[#8a6116]"}`} />
      {paid ? "Paid" : status === "refunded" ? "Refunded" : "Payment pending"}
    </span>
  );
}

function FulfillBadge({ fulfilled }: { fulfilled: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[12px] font-medium ${
        fulfilled ? "bg-[#e3e3e3] text-[#142e2a]" : "bg-[#ffea8a] text-[#5c4813]"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${fulfilled ? "bg-[#142e2a]" : "bg-[#b98900]"}`} />
      {fulfilled ? "Dispatched" : "Not dispatched"}
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
          ? "inline-flex h-[34px] items-center justify-center rounded-[9px] bg-[#142e2a] px-4 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(20,46,42,0.2)] transition-colors hover:bg-[#0c2421]"
          : "inline-flex h-[34px] items-center justify-center rounded-[9px] border border-[#d3dabe] bg-white px-4 text-[13px] font-semibold text-[#142e2a] shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-colors hover:bg-[#f7f9f2]"
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
  const router = useRouter();
  // Back returns to wherever you came from (Orders, To Dispatch or
  // Dispatched) — not always the Orders tab. Falls back to Orders if this
  // page was opened directly with no in-app history.
  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/admin-tools/data-browser?type=orders");
  };
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fulfilled, setFulfilled] = useState(false);
  const [savingFulfil, setSavingFulfil] = useState(false);

  const [notes, setNotes] = useState("");
  const [notesDirty, setNotesDirty] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [savingTags, setSavingTags] = useState(false);

  const [comments, setComments] = useState<OrderComment[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // DPD dispatch label
  const [printingDpd, setPrintingDpd] = useState(false);
  const [dpdTracking, setDpdTracking] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

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
        setComments(parseComments(row.admin_comments));
        const rawTags = (row as Record<string, unknown>).tags;
        if (typeof rawTags === "string" && rawTags.trim()) {
          setTags(rawTags.split(",").map((t) => t.trim()).filter(Boolean));
        }
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
      void logEvent(fulfilled ? "Order marked as not dispatched." : "Order marked as dispatched.");
      // This moves the order between the Orders queue and Dispatched, so the
      // sidebar counts (and the Orders KPI strip) must move with it.
      refreshAdminBadges();
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
      setToast("Notes saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingNotes(false);
    }
  }

  async function addComment() {
    const text = commentInput.trim();
    if (!text || savingComment) return;
    setSavingComment(true);
    const entry: OrderComment = {
      text,
      at: new Date().toISOString(),
      author: "Staff",
    };
    const next = [...comments, entry];
    try {
      await patch({ admin_comments: next });
      setComments(next);
      setCommentInput("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingComment(false);
    }
  }

  // Append an automatic audit-trail entry to the order timeline (who/what is
  // recorded as a "System" event with a timestamp). Best-effort: a logging
  // failure never blocks the underlying action.
  async function logEvent(text: string) {
    const entry: OrderComment = {
      text,
      at: new Date().toISOString(),
      author: "System",
    };
    const next = [...comments, entry];
    setComments(next);
    try {
      await patch({ admin_comments: next });
    } catch {
      /* non-blocking */
    }
  }

  async function refund() {
    if (!order || refunding) return;
    if (!window.confirm(`Refund ${order.order_number} in full? This cannot be undone.`)) return;
    setRefunding(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-tools/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderId: order.id }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j?.error ?? "Refund failed");
      setOrder({ ...order, payment_status: "refunded", status: "cancelled" });
      setFulfilled(false);
      setToast(j.viaStripe ? "Refunded via Stripe." : "Order marked refunded.");
      void logEvent(j.viaStripe ? "Order refunded in full via Stripe." : "Order marked refunded.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRefunding(false);
    }
  }

  function printOrder() {
    if (typeof window !== "undefined") window.print();
  }

  function printDispensingLabels() {
    if (!order) return;
    const lineItems = parseItems(order.items_json);
    const patient = order.customer_name?.trim() || "—";
    const date = dispensingDate();
    const labels: LabelData[] = (lineItems.length ? lineItems : [{}]).map(
      (it): LabelData => {
        const { brand, productLine } = composeMedicine(it.title, it.dose);
        return {
          brand,
          productName: productLine,
          patientName: patient,
          date,
        };
      },
    );
    printLabels(labels);
    void logEvent(
      `Dispensing label printed (${labels.length} item${labels.length === 1 ? "" : "s"}).`,
    );
  }

  async function printDpdLabel() {
    if (!order || printingDpd) return;
    // Open the label window NOW, inside the click, so it isn't blocked as a
    // popup (the DPD shipment call is slow; opening after the await would not
    // count as user-initiated).
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(
        `<!doctype html><title>Dispatch label</title><body style="font-family:-apple-system,Segoe UI,Arial,sans-serif;padding:32px;color:#142e2a">Generating dispatch label…</body>`,
      );
    }
    setPrintingDpd(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-tools/dpd-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderId: order.id }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) {
        if (win) win.close();
        throw new Error(j?.error ?? "Failed to generate DPD label");
      }

      // Write the FULL DPD label into the visible window (keeping its
      // barcode-rendering script). Fall back to an iframe if popup-blocked.
      if (j.labelHtml) {
        if (win) {
          win.document.open();
          win.document.write(String(j.labelHtml));
          win.document.close();
          win.focus();
        } else {
          printHtmlDocument(String(j.labelHtml));
        }
      }

      setDpdTracking(j.trackingNumber);
      // Reflect the status change (route sets it to 'shipped')
      setOrder({ ...order, status: "shipped" });
      setFulfilled(true);
      setToast(`DPD label created · Tracking: ${j.trackingNumber}`);
      void logEvent(`Dispatch label printed (DPD) · Tracking ${j.trackingNumber}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPrintingDpd(false);
    }
  }

  async function cancelOrder() {
    if (!order) return;
    setMoreOpen(false);
    if (!window.confirm(`Cancel order ${order.order_number}?`)) return;
    try {
      await patch({ status: "cancelled" });
      setOrder({ ...order, status: "cancelled" });
      setFulfilled(false);
      setToast("Order cancelled.");
      void logEvent("Order cancelled.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function copyLink() {
    setMoreOpen(false);
    try {
      await navigator.clipboard.writeText(window.location.href);
      setToast("Order link copied.");
    } catch {
      setToast("Couldn't copy link.");
    }
  }

  async function saveTags(next: string[]) {
    if (!order) return;
    setTags(next);
    setSavingTags(true);
    try {
      await fetch("/api/admin-tools/order-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderId: order.id, tags: next }),
      });
    } catch {
      /* best-effort */
    } finally {
      setSavingTags(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f9f2] px-4 py-10">
        <div className="mx-auto max-w-[1000px] animate-pulse text-[14px] text-[#616161]">
          Loading order…
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-[#f7f9f2] px-4 py-10">
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

  // A DPD dispatch label can only be printed for a live, payable order that
  // has a delivery address. Mirror the server-side guards so the button
  // explains why it's unavailable instead of failing on click.
  const hasAddress =
    (!!order.shipping_address &&
      order.shipping_address.trim() !== "" &&
      order.shipping_address.trim() !== "—") ||
    (!!order.notes && /address:/i.test(order.notes));
  // Free/test orders legitimately have total_amount = 0 but still contain real
  // products that must be shipped. Guard on the actual order value (the paid
  // total, or the line-item subtotal when the total is £0) so only genuinely
  // empty orders are blocked from dispatch.
  const orderValue = total > 0 ? total : subtotal;
  const dpdBlockedReason: string | null =
    String(order.status).toLowerCase() === "cancelled"
      ? "Order is cancelled — dispatch label unavailable."
      : orderValue <= 0
        ? "Order has no items to ship — dispatch label unavailable."
        : !hasAddress
          ? "No delivery address on record — dispatch label unavailable."
          : null;

  return (
    <main className="min-h-screen bg-[#f7f9f2] pb-16 font-ui text-[#142e2a]">
      {toast ? (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-[8px] bg-[#142e2a] px-4 py-2.5 text-[13px] font-medium text-white shadow-[0_8px_24px_rgba(0,0,0,0.2)]">
          {toast}
        </div>
      ) : null}
      <div className="mx-auto max-w-[1000px] px-4 pt-5 md:px-6">
        {/* ── Header ── */}
        <div className="flex flex-col gap-3 pb-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={goBack}
              aria-label="Back"
              className="mt-1 grid h-7 w-7 place-items-center rounded-[8px] border border-[#babfc3] bg-white text-[#616161] transition-colors hover:bg-[#f7f7f7]"
            >
              ‹
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-[23px] font-bold leading-none tracking-[-0.01em] text-[#0c2421]">
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
          <div className="flex flex-wrap items-center gap-2">
            <HeaderBtn onClick={refund}>
              {refunding ? "Refunding…" : "Refund"}
            </HeaderBtn>
            <Link
              href={`/admin-tools/edit/orders/${order.id}`}
              className="inline-flex h-[32px] items-center justify-center rounded-[8px] border border-[#babfc3] bg-white px-3.5 text-[13px] font-medium text-[#142e2a] shadow-[0_1px_0_rgba(0,0,0,0.05)] transition-colors hover:bg-[#f7f7f7]"
            >
              Edit
            </Link>
            <HeaderBtn onClick={printOrder}>Print</HeaderBtn>
            <div className="relative">
              <HeaderBtn onClick={() => setMoreOpen((v) => !v)}>More actions ▾</HeaderBtn>
              {moreOpen ? (
                <div
                  className="absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded-[8px] border border-[#e1e3e5] bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                  onMouseLeave={() => setMoreOpen(false)}
                >
                  <button
                    type="button"
                    onClick={copyLink}
                    className="block w-full px-3 py-2 text-left text-[13px] text-[#142e2a] hover:bg-[#f7f7f7]"
                  >
                    Copy order link
                  </button>
                  <button
                    type="button"
                    onClick={cancelOrder}
                    className="block w-full px-3 py-2 text-left text-[13px] text-[#b42318] hover:bg-[#fff1f0]"
                  >
                    Cancel order
                  </button>
                </div>
              ) : null}
            </div>
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
                <div className="flex items-center gap-2 rounded-[8px] border border-[#e1e3e5] px-3 py-2 text-[13px] font-medium text-[#142e2a]">
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
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-[8px] bg-[#f7f9f2]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {it.imageUrl ? (
                        <img src={it.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-[#142e2a]">
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
              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#e1e3e5] px-5 py-3">
                <HeaderBtn onClick={markFulfilled}>
                  {savingFulfil ? "Saving…" : fulfilled ? "Mark as not dispatched" : "Mark as dispatched"}
                </HeaderBtn>
                <HeaderBtn primary onClick={printDispensingLabels}>
                  Print dispensing label
                </HeaderBtn>
                {/* DPD dispatching label */}
                <button
                  onClick={printDpdLabel}
                  disabled={printingDpd || !!dpdBlockedReason}
                  title={dpdBlockedReason ?? undefined}
                  className="inline-flex items-center gap-1.5 rounded-[6px] border border-[#cc0000] bg-[#cc0000] px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[#a80000] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {/* DPD red diamond logo mark */}
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
                    <path d="M10 1 L19 10 L10 19 L1 10 Z" fill="white" opacity="0.9" />
                    <path d="M10 5 L15 10 L10 15 L5 10 Z" fill="#cc0000" />
                  </svg>
                  {printingDpd ? "Generating…" : "Print dispatching label"}
                </button>
              </div>
              {dpdBlockedReason && (
                <div className="border-t border-[#e1e3e5] px-5 py-2.5">
                  <span className="text-[12px] text-[#8a6d00]">{dpdBlockedReason}</span>
                </div>
              )}
              {/* DPD tracking badge — shown after a label has been printed this session */}
              {dpdTracking && (
                <div className="flex items-center gap-2 border-t border-[#e1e3e5] px-5 py-2.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M2 6.5h11v9H2zM13 9.5h4l3 3v3h-7z" stroke="#616161" strokeWidth="1.6" strokeLinejoin="round" />
                    <circle cx="6.5" cy="17.5" r="1.6" stroke="#616161" strokeWidth="1.6" />
                    <circle cx="16.5" cy="17.5" r="1.6" stroke="#616161" strokeWidth="1.6" />
                  </svg>
                  <span className="text-[12px] text-[#616161]">
                    DPD tracking: <span className="font-medium text-[#142e2a]">{dpdTracking}</span>
                  </span>
                </div>
              )}
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
                    sub="Delivery charges (0.0 kg: Items 0.0 kg, Package 0.0 kg)"
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
                  <div className="flex-1">
                    <textarea
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                          e.preventDefault();
                          addComment();
                        }
                      }}
                      placeholder="Leave a comment…"
                      rows={2}
                      className="w-full resize-y rounded-[8px] border border-[#babfc3] px-3 py-2 text-[13px] text-[#142e2a] outline-none focus:border-[#142e2a]"
                    />
                    {commentInput.trim() ? (
                      <div className="mt-2 flex justify-end">
                        <HeaderBtn primary onClick={addComment}>
                          {savingComment ? "Posting…" : "Post"}
                        </HeaderBtn>
                      </div>
                    ) : null}
                  </div>
                </div>
                <p className="mt-2 text-right text-[12px] text-[#8a8a8a]">
                  Only you and other staff can see comments
                </p>

                {comments.length > 0 ? (
                  <ul className="mt-4 flex flex-col gap-3">
                    {comments
                      .slice()
                      .reverse()
                      .map((c, i) => {
                        const isSystem = c.author === "System";
                        return (
                          <li key={comments.length - 1 - i} className="flex items-start gap-2.5">
                            {isSystem ? (
                              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#eef3e6] text-[#142e2a]">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                  <circle cx="12" cy="12" r="3" />
                                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
                                </svg>
                              </span>
                            ) : (
                              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e879b9] text-[12px] font-semibold text-white">
                                JL
                              </span>
                            )}
                            <div
                              className={`flex-1 rounded-[10px] px-3 py-2 ${
                                isSystem ? "border border-[#e1e6da] bg-[#f7f9f2]" : "bg-[#f6f6f7]"
                              }`}
                            >
                              <p className="whitespace-pre-line text-[13px] text-[#142e2a]">{c.text}</p>
                              <p className="mt-1 text-[11px] text-[#8a8a8a]">
                                {isSystem ? "System · audit log" : c.author ?? "Staff"}
                                {c.at ? ` · ${fmtDateTime(c.at)}` : ""}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                  </ul>
                ) : null}

                <p className="mt-4 text-[12px] font-semibold text-[#616161]">Today</p>
                <ul className="mt-2 flex flex-col gap-3 border-l border-[#e1e3e5] pl-4">
                  <TimelineItem time={fmtTime(created)}>
                    Order confirmation email sent to {order.customer_name ?? "customer"} (
                    {order.customer_email ? (
                      <a
                        href={`mailto:${order.customer_email}`}
                        className="text-[#142e2a] hover:underline"
                      >
                        {order.customer_email}
                      </a>
                    ) : (
                      "no email"
                    )}
                    ).
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
                  className="mt-2 w-full resize-y rounded-[8px] border border-[#e1e3e5] px-3 py-2 text-[13px] text-[#142e2a] outline-none focus:border-[#142e2a]"
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
                <p className="text-[13px] text-[#142e2a]">JoodLife</p>
              </div>
            </Card>

            {/* Customer */}
            <Card>
              <div className="px-5 py-4">
                <h2 className="text-[14px] font-semibold">Customer</h2>
                {order.customer_email ? (
                  <Link
                    href={`/admin-tools/customers/${encodeURIComponent(order.customer_email)}`}
                    className="mt-2 block text-[13px] font-medium text-[#142e2a] hover:underline"
                  >
                    {order.customer_name ?? order.customer_email}
                  </Link>
                ) : (
                  <p className="mt-2 text-[13px] font-medium text-[#142e2a]">
                    {order.customer_name ?? "—"}
                  </p>
                )}

                <h3 className="mt-4 text-[13px] font-semibold">Contact information</h3>
                {order.customer_email ? (
                  <a
                    href={`mailto:${order.customer_email}`}
                    className="block text-[13px] text-[#142e2a] hover:underline"
                  >
                    {order.customer_email}
                  </a>
                ) : null}
                {order.customer_phone ? (
                  <a
                    href={`https://wa.me/${order.customer_phone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 inline-flex items-center gap-1.5 text-[13px] text-[#142e2a] hover:underline"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.9 5-1.3A10 10 0 1 0 12 2Zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2s-1.2.3-4-1.2-4.3-4.3-4.5-4.5-1.3-1.7-1.3-3.2.8-2.2 1.1-2.5.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.5.7c-.2.2-.3.4-.1.7s.8 1.3 1.6 2c1 .9 1.9 1.2 2.2 1.3s.4.1.6-.1l.8-1c.2-.2.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.2.1.6-.1 1.2Z" />
                    </svg>
                    {order.customer_phone}
                  </a>
                ) : (
                  <p className="text-[13px] text-[#616161]">No phone number</p>
                )}

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
                <h2 className="text-[14px] font-semibold">
                  Tags{savingTags ? <span className="ml-2 text-[11px] font-normal text-[#8a8a8a]">saving…</span> : null}
                </h2>
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && tagInput.trim()) {
                      e.preventDefault();
                      saveTags([...new Set([...tags, tagInput.trim()])]);
                      setTagInput("");
                    }
                  }}
                  placeholder="Add a tag and press Enter"
                  className="mt-2 w-full rounded-[8px] border border-[#e1e3e5] px-3 py-2 text-[13px] outline-none focus:border-[#142e2a]"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-[8px] bg-[#e3e3e3] px-2 py-1 text-[12px] text-[#142e2a]"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => saveTags(tags.filter((x) => x !== t))}
                        aria-label={`Remove ${t}`}
                        className="text-[#616161] hover:text-[#142e2a]"
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
        <span className={`text-[13px] ${bold ? "font-semibold" : "text-[#142e2a]"}`}>{label}</span>
        {sub ? <p className="text-[12px] text-[#616161]">{sub}</p> : null}
      </div>
      <span className={`shrink-0 text-[13px] ${bold ? "font-semibold" : "text-[#142e2a]"}`}>
        {value}
      </span>
    </div>
  );
}

function TimelineItem({ children, time }: { children: React.ReactNode; time: string }) {
  return (
    <li className="relative flex items-start justify-between gap-3">
      <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-[#8a8a8a]" />
      <span className="text-[13px] text-[#142e2a]">{children}</span>
      <span className="shrink-0 text-[12px] text-[#8a8a8a]">{time}</span>
    </li>
  );
}
