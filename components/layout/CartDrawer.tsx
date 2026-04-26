"use client";

import { useEffect } from "react";

/**
 * Right-side slide-in cart drawer. Mirrors the mobile menu drawer
 * structure (overlay + drawer with translate-x animation, ESC + click
 * outside to close, body-scroll lock while open).
 */
type Props = {
  open: boolean;
  onClose: () => void;
};

export default function CartDrawer({ open, onClose }: Props) {
  // Lock body scroll while the drawer is open
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ease-in-out ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Cart"
        aria-hidden={!open}
        className={`fixed inset-y-0 right-0 z-50 flex h-full w-[90%] max-w-[420px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-[#142e2a]/10 px-5 h-14">
          <h2 className="font-display text-[18px] font-semibold tracking-[-0.02em] text-[#142e2a]">
            Your cart
          </h2>
          <button
            type="button"
            aria-label="Close cart"
            onClick={onClose}
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-full transition-colors hover:bg-[#142e2a]/5"
          >
            <span className="relative flex h-5 w-5 items-center justify-center">
              <span className="absolute h-0.5 w-5 rotate-45 bg-[#142e2a]" />
              <span className="absolute h-0.5 w-5 -rotate-45 bg-[#142e2a]" />
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-[#f7f9f2]">
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
          </div>
          <div>
            <h3 className="font-display text-[20px] font-semibold text-[#142e2a]">
              Your cart is empty
            </h3>
            <p className="mt-1 font-ui text-[14px] text-[#142e2a]/70">
              Browse the shop to find your treatment plan.
            </p>
          </div>
          <a
            href="/shop"
            onClick={onClose}
            className="inline-flex h-[46px] items-center justify-center rounded-lg bg-[#142e2a] px-8 font-ui text-[13px] font-semibold uppercase tracking-[0.04em] text-white transition-colors hover:bg-[#0c2421]"
          >
            Browse shop
          </a>
        </div>

        {/* Footer (placeholder for subtotal + checkout once cart logic exists) */}
        <div className="border-t border-[#142e2a]/10 px-5 py-4">
          <div className="flex items-center justify-between font-ui text-[14px] text-[#142e2a]/70">
            <span>Subtotal</span>
            <span className="font-semibold text-[#142e2a]">£0.00</span>
          </div>
          <button
            type="button"
            disabled
            className="mt-3 inline-flex h-[50px] w-full cursor-not-allowed items-center justify-center rounded-lg bg-[#142e2a]/30 px-6 font-ui text-[13px] font-semibold uppercase tracking-[0.04em] text-white"
          >
            Checkout
          </button>
        </div>
      </aside>
    </>
  );
}
