"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

import { useCart } from "@/components/cart/CartContext";

/**
 * Right-side slide-in cart drawer. Reads from the global CartContext
 * so the same drawer is shared between the desktop nav and the mobile
 * menu. Backdrop + ESC + click-outside-to-close, body-scroll lock.
 */
export default function CartDrawer() {
  const {
    items,
    drawerOpen,
    closeDrawer,
    setQuantity,
    removeItem,
    itemCount,
    subtotal,
  } = useCart();

  // Lock body scroll while open
  useEffect(() => {
    if (!drawerOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [drawerOpen]);

  // Close on Escape
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen, closeDrawer]);

  const formatPrice = (n: number) =>
    n.toLocaleString("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden
        onClick={closeDrawer}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ease-in-out ${
          drawerOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Cart"
        aria-hidden={!drawerOpen}
        className={`fixed inset-y-0 right-0 z-50 flex h-full w-[92%] max-w-[440px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#142e2a]/10 px-5 h-14">
          <h2 className="font-display text-[18px] font-semibold tracking-[-0.02em] text-[#142e2a]">
            Your cart{" "}
            {itemCount > 0 ? (
              <span className="ml-1 font-ui text-[14px] font-medium text-[#142e2a]/55">
                ({itemCount})
              </span>
            ) : null}
          </h2>
          <button
            type="button"
            aria-label="Close cart"
            onClick={closeDrawer}
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-full transition-colors hover:bg-[#142e2a]/5"
          >
            <span className="relative flex h-5 w-5 items-center justify-center">
              <span className="absolute h-0.5 w-5 rotate-45 bg-[#142e2a]" />
              <span className="absolute h-0.5 w-5 -rotate-45 bg-[#142e2a]" />
            </span>
          </button>
        </div>

        {/* Body */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-[#f7f9f2]">
              <CartIcon />
            </div>
            <div>
              <h3 className="font-display text-[20px] font-semibold text-[#142e2a]">
                Your cart is empty
              </h3>
              <p className="mt-1 font-ui text-[14px] text-[#142e2a]/70">
                Browse the shop to find your treatment plan.
              </p>
            </div>
            <Link
              href="/shop"
              onClick={closeDrawer}
              className="inline-flex h-[46px] items-center justify-center rounded-lg bg-[#142e2a] px-8 font-ui text-[13px] font-semibold uppercase tracking-[0.04em] text-white transition-colors hover:bg-[#0c2421]"
            >
              Browse shop
            </Link>
          </div>
        ) : (
          <ul className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-5">
            {items.map((item) => {
              const lineTotal = item.price * item.quantity;
              return (
                <li
                  key={`${item.productId}-${item.dose ?? "default"}`}
                  className="flex items-start gap-4 rounded-2xl border border-[#142e2a]/8 bg-white p-3"
                >
                  {/* Thumbnail */}
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#f7f9f2]">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>

                  {/* Details */}
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/shop/${item.slug}`}
                        onClick={closeDrawer}
                        className="font-display text-[15px] font-semibold leading-[20px] text-[#142e2a] hover:text-[#0c2421]"
                      >
                        {item.title}
                      </Link>
                      <button
                        type="button"
                        aria-label={`Remove ${item.title}`}
                        onClick={() => removeItem(item.productId, item.dose)}
                        className="grid h-7 w-7 place-items-center rounded-full text-[#142e2a]/60 transition-colors hover:bg-[#142e2a]/5 hover:text-[#142e2a]"
                      >
                        <span aria-hidden className="text-[14px]">
                          ×
                        </span>
                      </button>
                    </div>

                    {item.dose ? (
                      <span className="w-fit rounded-full bg-[#f7f9f2] px-2 py-0.5 font-ui text-[11px] font-medium text-[#142e2a]/70">
                        {item.dose}
                      </span>
                    ) : null}

                    <div className="mt-1 flex items-center justify-between gap-3">
                      {/* Quantity stepper */}
                      <div className="inline-flex items-center rounded-lg border border-[#142e2a]/15">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() =>
                            setQuantity(item.productId, item.dose, item.quantity - 1)
                          }
                          className="grid h-8 w-8 cursor-pointer place-items-center text-[#142e2a] hover:bg-[#f7f9f2]"
                        >
                          −
                        </button>
                        <span className="min-w-[28px] text-center font-ui text-[13px] font-semibold text-[#142e2a]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() =>
                            setQuantity(item.productId, item.dose, item.quantity + 1)
                          }
                          className="grid h-8 w-8 cursor-pointer place-items-center text-[#142e2a] hover:bg-[#f7f9f2]"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-ui text-[14px] font-semibold text-[#142e2a]">
                        {formatPrice(lineTotal)}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Footer (subtotal + checkout) */}
        {items.length > 0 ? (
          <div className="border-t border-[#142e2a]/10 px-5 py-4">
            <div className="flex items-center justify-between font-ui text-[14px] text-[#142e2a]/75">
              <span>Subtotal</span>
              <span className="font-display text-[18px] font-semibold text-[#142e2a]">
                {formatPrice(subtotal)}
              </span>
            </div>
            <p className="mt-1 font-ui text-[12px] text-[#142e2a]/55">
              Tax + delivery calculated at checkout. A clinical consultation is required before dispatch.
            </p>
            <Link
              href="/checkout"
              onClick={closeDrawer}
              className="mt-3 inline-flex h-[50px] w-full items-center justify-center rounded-lg bg-[#142e2a] px-6 font-ui text-[13px] font-semibold uppercase tracking-[0.04em] text-white transition-colors hover:bg-[#0c2421]"
            >
              Checkout
            </Link>
            <Link
              href="/consultation"
              onClick={closeDrawer}
              className="mt-2 inline-flex h-[44px] w-full items-center justify-center rounded-lg border border-[#142e2a]/15 bg-white px-6 font-ui text-[12px] font-semibold uppercase tracking-[0.04em] text-[#142e2a] transition-colors hover:bg-[#f7f9f2]"
            >
              Start consultation
            </Link>
          </div>
        ) : (
          <div className="border-t border-[#142e2a]/10 px-5 py-4">
            <div className="flex items-center justify-between font-ui text-[14px] text-[#142e2a]/55">
              <span>Subtotal</span>
              <span>£0.00</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

function CartIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M6 6h15l-1.5 9h-12L4 3H2"
        stroke="#142e2a"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="20" r="1.5" stroke="#142e2a" strokeWidth="1.6" />
      <circle cx="18" cy="20" r="1.5" stroke="#142e2a" strokeWidth="1.6" />
    </svg>
  );
}
