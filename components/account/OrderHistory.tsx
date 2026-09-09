"use client";

import { useState } from "react";
import type { OrderSummary } from "@/lib/accountData";

/**
 * The customer's order list on the profile page.
 *
 * Each row expands in place to show the line items, delivery address and
 * tracking. Kept inline rather than on its own route: the detail is small,
 * it's already loaded with the page, and it keeps the customer in context.
 *
 * Rows are independent toggles (not a single-open accordion) so opening one
 * order never collapses another the customer was reading.
 */

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function gbp(n: number | null) {
  if (n == null) return "—";
  return n.toLocaleString("en-GB", { style: "currency", currency: "GBP" });
}

function titleize(s: string | null) {
  if (!s) return "—";
  return s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function StatusBadge({ status }: { status: string | null }) {
  const s = (status ?? "").toLowerCase();
  const good = ["paid", "completed", "approved", "submitted", "delivered"].includes(s);
  const warn = ["pending", "awaiting", "draft", "processing", "reviewed"].includes(s);
  const tone = good
    ? "bg-[#1a8c5a]/12 text-[#1a8c5a]"
    : warn
      ? "bg-[#e8b53d]/18 text-[#8a6d12]"
      : "bg-[#142e2a]/8 text-[#142e2a]/70";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 font-ui text-[11px] font-semibold ${tone}`}
    >
      {titleize(status)}
    </span>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#142e2a]/6 transition-transform duration-300 ${
        open ? "rotate-180" : ""
      }`}
    >
      <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
        <path
          d="M1 1.5 6 6.5l5-5"
          stroke="#142e2a"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/** One label/value pair in the expanded panel. */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.06em] text-[#142e2a]/50">
        {label}
      </p>
      <div className="mt-1 font-ui text-[13px] leading-[20px] text-[#142e2a]">{children}</div>
    </div>
  );
}

function OrderRow({ order }: { order: OrderSummary }) {
  const [open, setOpen] = useState(false);
  const id = `order-${order.orderNumber.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const hasDetail =
    order.items.length > 0 || Boolean(order.shippingAddress) || Boolean(order.trackingNumber);

  return (
    <li className="border-b border-[#142e2a]/8 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        id={`${id}-trigger`}
        className="flex w-full cursor-pointer items-center justify-between gap-4 py-3.5 text-left"
      >
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="font-ui text-[14px] font-semibold text-[#142e2a]">
            {order.orderNumber}
          </span>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="whitespace-nowrap font-ui text-[12px] text-[#142e2a]/60">
              {fmtDate(order.date)} &middot; {order.itemCount} item
              {order.itemCount === 1 ? "" : "s"}
            </span>
            {/* On narrow screens the badge rides with the date so the header
                row doesn't squeeze the order number and price. */}
            <span className="sm:hidden">
              <StatusBadge status={order.paymentStatus ?? order.status} />
            </span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2 sm:gap-3">
          <span className="hidden sm:inline-flex">
            <StatusBadge status={order.paymentStatus ?? order.status} />
          </span>
          <span className="whitespace-nowrap font-ui text-[14px] font-semibold text-[#142e2a]">
            {gbp(order.total)}
          </span>
          <Chevron open={open} />
        </span>
      </button>

      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-trigger`}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="mb-3.5 rounded-xl bg-[#f7f9f2] p-4 md:p-5">
            {!hasDetail ? (
              <p className="font-ui text-[13px] text-[#142e2a]/70">
                No further detail recorded for this order. Contact us and we&rsquo;ll look it up
                for you.
              </p>
            ) : (
              <>
                {order.items.length > 0 ? (
                  <ul className="flex flex-col gap-2">
                    {order.items.map((it, i) => (
                      <li
                        key={`${it.title}-${i}`}
                        className="flex items-baseline justify-between gap-3"
                      >
                        <span className="font-ui text-[13px] leading-[20px] text-[#142e2a]">
                          {it.title}
                          {it.dose ? (
                            <span className="text-[#142e2a]/60"> &middot; {it.dose}</span>
                          ) : null}
                          <span className="text-[#142e2a]/60">
                            {" "}
                            &times;{it.quantity}
                          </span>
                        </span>
                        {it.price != null ? (
                          <span className="shrink-0 whitespace-nowrap font-ui text-[13px] font-semibold text-[#142e2a]">
                            {gbp(it.price * it.quantity)}
                            {it.quantity > 1 ? (
                              <span className="block text-right font-normal text-[11px] text-[#142e2a]/55">
                                {gbp(it.price)} each
                              </span>
                            ) : null}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {order.discount ? (
                  <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-[#142e2a]/10 pt-3">
                    <span className="font-ui text-[13px] text-[#142e2a]/70">Discount</span>
                    <span className="font-ui text-[13px] font-semibold text-[#1a8c5a]">
                      &minus;{gbp(order.discount)}
                    </span>
                  </div>
                ) : null}

                <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-[#142e2a]/10 pt-3">
                  <span className="font-ui text-[13px] font-semibold text-[#142e2a]">Total</span>
                  <span className="font-ui text-[14px] font-semibold text-[#142e2a]">
                    {gbp(order.total)}
                  </span>
                </div>

                {order.shippingAddress || order.trackingNumber || order.paymentMethod ? (
                  <div className="mt-4 grid gap-4 border-t border-[#142e2a]/10 pt-4 sm:grid-cols-2">
                    {order.shippingAddress ? (
                      <Field label="Delivery address">
                        <span className="whitespace-pre-line">{order.shippingAddress}</span>
                      </Field>
                    ) : null}
                    {order.trackingNumber ? (
                      <Field label="Tracking">
                        <a
                          href={`https://track.dpd.co.uk/parcels/${encodeURIComponent(
                            order.trackingNumber,
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-[#142e2a] underline decoration-[#142e2a]/30 underline-offset-2 hover:decoration-[#142e2a]"
                        >
                          {order.trackingNumber}
                        </a>
                        <span className="block text-[12px] text-[#142e2a]/55">
                          Track with DPD &rarr;
                        </span>
                      </Field>
                    ) : null}
                    {order.paymentMethod ? (
                      <Field label="Payment">{titleize(order.paymentMethod)}</Field>
                    ) : null}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

export default function OrderHistory({ orders }: { orders: OrderSummary[] }) {
  return (
    <ul className="mt-4 flex flex-col">
      {orders.map((o) => (
        <OrderRow key={o.orderNumber} order={o} />
      ))}
    </ul>
  );
}
