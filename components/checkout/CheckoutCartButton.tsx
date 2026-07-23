"use client";

import { useCart } from "@/components/cart/CartContext";
import CartDrawer from "@/components/layout/CartDrawer";

/**
 * Cart control for the checkout header. The checkout page uses a minimal
 * header (no site nav), so the global header's cart button/drawer aren't
 * present — this mounts both: a top-right cart icon with the item count,
 * and the drawer itself so shoppers can review/remove items mid-checkout.
 */
export default function CheckoutCartButton() {
  const { itemCount, openDrawer } = useCart();
  return (
    <>
      <button
        type="button"
        onClick={openDrawer}
        aria-label={`Open cart (${itemCount} item${itemCount === 1 ? "" : "s"})`}
        className="absolute right-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-[#142e2a] transition-colors hover:bg-[#f7f9f2] md:right-8"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 7h12l1 13H5L6 7z" />
          <path d="M9 9V6a3 3 0 0 1 6 0v3" />
        </svg>
        {itemCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#142e2a] px-1 font-ui text-[11px] font-bold leading-none text-white">
            {itemCount}
          </span>
        )}
      </button>
      <CartDrawer />
    </>
  );
}
