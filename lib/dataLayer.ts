/**
 * GA4-style ecommerce dataLayer.
 *
 * Pushes the standard Google Analytics 4 / GTM ecommerce events —
 * `view_item`, `add_to_cart`, `remove_from_cart`, `begin_checkout`,
 * `purchase` — to `window.dataLayer`, so a marketing GTM container (or GA4)
 * can map conversions and funnels with zero extra work on their side.
 *
 * Works with or without GTM installed:
 *   - With GTM (set NEXT_PUBLIC_GTM_ID) → GTM reads these events live.
 *   - Without GTM → events still queue in window.dataLayer, so they're
 *     inspectable in the console and picked up the moment a container loads.
 *
 * Event shapes follow Google's spec exactly:
 * https://developers.google.com/analytics/devguides/collection/ga4/ecommerce
 */

export type DlItem = {
  item_id: string;
  item_name: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
};

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

const CURRENCY = "GBP";

function layer(): Record<string, unknown>[] | null {
  if (typeof window === "undefined") return null;
  window.dataLayer = window.dataLayer || [];
  return window.dataLayer;
}

/** Map any cart/product-shaped object into a GA4 `items[]` entry. */
export function toDlItem(i: {
  slug?: string | null;
  productId?: number | null;
  title?: string | null;
  dose?: string | null;
  price?: number | null;
  quantity?: number | null;
}): DlItem {
  return {
    item_id: String(i.slug ?? i.productId ?? "").trim() || "unknown",
    item_name: String(i.title ?? "").trim() || "Item",
    ...(i.dose ? { item_variant: String(i.dose) } : {}),
    price: Math.round((Number(i.price) || 0) * 100) / 100,
    quantity: Math.max(1, Number(i.quantity) || 1),
  };
}

function sumValue(items: DlItem[]): number {
  const v = items.reduce(
    (s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 1),
    0,
  );
  return Math.round(v * 100) / 100;
}

/** Push a GA4 ecommerce event. Clears the previous `ecommerce` object first
 *  (Google's recommended pattern) so values don't bleed between events. */
function pushEcommerce(event: string, ecommerce: Record<string, unknown>): void {
  const dl = layer();
  if (!dl) return;
  dl.push({ ecommerce: null });
  dl.push({ event, ecommerce });
}

export function dlViewItem(item: DlItem): void {
  pushEcommerce("view_item", { currency: CURRENCY, value: sumValue([item]), items: [item] });
}

export function dlAddToCart(item: DlItem): void {
  pushEcommerce("add_to_cart", { currency: CURRENCY, value: sumValue([item]), items: [item] });
}

export function dlRemoveFromCart(item: DlItem): void {
  pushEcommerce("remove_from_cart", { currency: CURRENCY, value: sumValue([item]), items: [item] });
}

export function dlBeginCheckout(items: DlItem[]): void {
  pushEcommerce("begin_checkout", { currency: CURRENCY, value: sumValue(items), items });
}

export function dlPurchase(opts: { transactionId: string; items: DlItem[]; value?: number }): void {
  pushEcommerce("purchase", {
    transaction_id: opts.transactionId,
    currency: CURRENCY,
    value: opts.value ?? sumValue(opts.items),
    items: opts.items,
  });
}
