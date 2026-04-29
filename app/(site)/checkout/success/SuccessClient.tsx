"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type OrderItem = {
  productId: number;
  slug: string;
  title: string;
  dose: string | null;
  price: number;
  quantity: number;
  imageUrl?: string | null;
};

type OrderSummary = {
  orderNumber: string;
  customerName: string | null;
  customerEmail: string | null;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  createdAt: string;
};

const formatPrice = (n: number) =>
  n.toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function SuccessClient({ orderNumber }: { orderNumber: string }) {
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/checkout?orderNumber=${encodeURIComponent(orderNumber)}`,
          { credentials: "include" }
        );
        const json = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json?.error ?? `HTTP ${res.status}`);
        }
        if (!cancelled) setOrder(json.order as OrderSummary);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  return (
    <section className="mx-auto w-full max-w-[680px] px-6 py-12 md:py-20">
      <div className="text-center">
        <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-[#142e2a] text-[#dff49f]">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
            <path
              d="M8 16.5L13.5 22L24 11.5"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="inline-flex items-center rounded-full bg-[#dff49f] px-3 py-1 font-ui text-[12px] font-semibold uppercase tracking-[0.04em] text-[#142e2a]">
          Order placed
        </span>
        <h1 className="mt-4 font-display text-[28px] font-bold leading-[34px] tracking-[-0.01em] text-[#142e2a] md:text-[34px] md:leading-[40px]">
          Thanks — your order is in.
        </h1>
        <p className="mx-auto mt-3 max-w-[440px] font-ui text-[15px] leading-[24px] text-[#142e2a]/75">
          A clinical consultation is required before dispatch. We&apos;ll email{" "}
          <span className="font-semibold text-[#142e2a]">
            {order?.customerEmail ?? "you"}
          </span>{" "}
          with the next steps.
        </p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#f7f9f2] px-4 py-2 font-ui text-[13px] text-[#142e2a]">
          <span className="text-[#142e2a]/60">Reference</span>
          <span className="font-mono font-semibold">{orderNumber}</span>
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="mx-auto mt-8 rounded-lg bg-red-50 px-4 py-3 font-ui text-[13px] text-red-700"
        >
          We placed the order but couldn&apos;t fetch the summary: {error}
        </p>
      ) : null}

      {order ? (
        <div className="mt-10 rounded-2xl border border-[#142e2a]/10 bg-[#f7f9f2] p-5 md:p-6">
          <h2 className="font-display text-[18px] font-semibold tracking-[-0.01em] text-[#142e2a]">
            Order summary
          </h2>
          <ul className="mt-4 flex flex-col gap-3 border-t border-[#142e2a]/10 pt-4">
            {order.items.map((item) => (
              <li
                key={`${item.productId}-${item.dose ?? "default"}`}
                className="flex items-center justify-between gap-3 font-ui text-[14px]"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="font-semibold text-[#142e2a]">
                    {item.title}
                    <span className="font-normal text-[#142e2a]/55">
                      {" "}
                      × {item.quantity}
                    </span>
                  </span>
                  {item.dose ? (
                    <span className="text-[12px] text-[#142e2a]/65">
                      {item.dose}
                    </span>
                  ) : null}
                </span>
                <span className="font-semibold text-[#142e2a]">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-baseline justify-between border-t border-[#142e2a]/10 pt-4">
            <span className="font-display text-[16px] font-semibold text-[#142e2a]">
              Total
            </span>
            <span className="font-display text-[20px] font-bold tracking-[-0.01em] text-[#142e2a]">
              {formatPrice(order.totalAmount)}
            </span>
          </div>
        </div>
      ) : null}

      <div className="mt-10 flex flex-col items-center gap-3 md:flex-row md:justify-center">
        <Link
          href="/consultation"
          className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#142e2a] px-8 font-ui text-[13px] font-semibold uppercase tracking-[0.04em] text-white transition-colors hover:bg-[#0c2421] md:w-auto"
        >
          Start consultation
        </Link>
        <Link
          href="/shop"
          className="inline-flex h-12 w-full items-center justify-center rounded-lg border border-[#142e2a]/15 bg-white px-8 font-ui text-[13px] font-semibold text-[#142e2a] transition-colors hover:bg-[#f7f9f2] md:w-auto"
        >
          Continue shopping
        </Link>
      </div>
    </section>
  );
}
