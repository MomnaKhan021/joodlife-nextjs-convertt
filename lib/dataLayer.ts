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

import { fbTrack } from "./metaPixel";

export type DlItem = {
  item_id: string;
  item_name: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
};

/**
 * Customer details sent with `purchase` as `user_data`, so the GTM container
 * can feed Meta Advanced Matching (raising Event Match Quality) and Google
 * Enhanced Conversions. Shape follows Google's enhanced-conversions spec.
 *
 * Values are normalised (trimmed, lower-cased, phone in E.164) because both
 * platforms hash them and only match on an exact, canonical form. Hashing
 * itself is done in the tag manager, which is the documented approach.
 */
export type DlUserData = {
  email_address?: string;
  phone_number?: string;
  address?: {
    first_name?: string;
    last_name?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  };
};

/** Normalise the parts Meta/Google match on. Empty values are dropped. */
export function toDlUserData(input: {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  postcode?: string | null;
  country?: string | null;
}): DlUserData {
  const clean = (v: string | null | undefined) => (v ?? "").trim().toLowerCase();
  // UK numbers to E.164: 07700900000 -> +447700900000
  const phoneE164 = (() => {
    let n = (input.phone ?? "").replace(/[^\d+]/g, "");
    if (!n) return "";
    if (n.startsWith("+")) return n;
    if (n.startsWith("0044")) n = n.slice(4);
    else if (n.startsWith("44")) n = n.slice(2);
    else if (n.startsWith("0")) n = n.slice(1);
    else return "";
    return n ? `+44${n}` : "";
  })();

  const address: NonNullable<DlUserData["address"]> = {};
  if (clean(input.firstName)) address.first_name = clean(input.firstName);
  if (clean(input.lastName)) address.last_name = clean(input.lastName);
  if (clean(input.city)) address.city = clean(input.city);
  if (clean(input.postcode)) {
    address.postal_code = clean(input.postcode).replace(/\s+/g, "");
  }
  address.country = clean(input.country) || "gb";

  const out: DlUserData = {};
  if (clean(input.email)) out.email_address = clean(input.email);
  if (phoneE164) out.phone_number = phoneE164;
  if (Object.keys(address).length > 0) out.address = address;
  return out;
}

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
function pushEcommerce(
  event: string,
  ecommerce: Record<string, unknown>,
  /** Extra top-level keys (e.g. user_data on purchase). */
  extra?: Record<string, unknown>,
): void {
  const dl = layer();
  if (!dl) return;
  dl.push({ ecommerce: null });
  dl.push({ event, ecommerce, ...(extra ?? {}) });
}

export function dlViewItem(item: DlItem): void {
  pushEcommerce("view_item", { currency: CURRENCY, value: sumValue([item]), items: [item] });
  // Meta's matching standard event. AddToCart / InitiateCheckout / Purchase
  // already reach our pixel from the click tracker and the checkout; this was
  // the one funnel step it never saw.
  fbTrack("ViewContent", {
    content_name: item.item_name,
    content_ids: [item.item_id],
    content_type: "product",
    value: sumValue([item]),
    currency: CURRENCY,
  });
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

export function dlPurchase(opts: {
  transactionId: string;
  items: DlItem[];
  value?: number;
  /** Customer details for Meta Advanced Matching / Google Enhanced Conversions. */
  userData?: DlUserData;
}): void {
  pushEcommerce(
    "purchase",
    {
      transaction_id: opts.transactionId,
      currency: CURRENCY,
      value: opts.value ?? sumValue(opts.items),
      items: opts.items,
    },
    opts.userData && Object.keys(opts.userData).length > 0
      ? { user_data: opts.userData }
      : undefined,
  );
}
