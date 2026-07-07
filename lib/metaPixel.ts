/**
 * Meta (Facebook) Pixel — client-side conversion tracking.
 *
 * The Pixel is write-only: it SENDS events to Meta (PageView, Lead,
 * Purchase) so campaigns can attribute conversions in Meta Ads Manager.
 * It does NOT read spend/ROAS back — that's the Marketing API
 * (see app/api/admin-tools/marketing/route.ts).
 *
 * Enabled by NEXT_PUBLIC_META_PIXEL_ID. With no id set, every helper here
 * is a no-op, so the site behaves exactly as before.
 */

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
  push?: unknown;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

/** Inject fbevents.js and init the pixel. Safe to call repeatedly. */
export function loadMetaPixel(): void {
  if (typeof window === "undefined" || !META_PIXEL_ID || window.fbq) return;
  const n: Fbq = function (...args: unknown[]) {
    n.callMethod ? n.callMethod.apply(n, args) : n.queue!.push(args);
  } as Fbq;
  n.queue = [];
  n.loaded = true;
  n.version = "2.0";
  n.push = n;
  window.fbq = n;
  if (!window._fbq) window._fbq = n;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);

  window.fbq("init", META_PIXEL_ID);
}

/** Fire a standard/custom event (no-op until the pixel is loaded). */
export function fbTrack(event: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined" || !window.fbq) return;
  if (params) window.fbq("track", event, params);
  else window.fbq("track", event);
}

export const fbPageView = () => fbTrack("PageView");

export const fbLead = (params?: Record<string, unknown>) => fbTrack("Lead", params);

export const fbPurchase = (value: number, currency = "GBP", params?: Record<string, unknown>) =>
  fbTrack("Purchase", { value, currency, ...params });
