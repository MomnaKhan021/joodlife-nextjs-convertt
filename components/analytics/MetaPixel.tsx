"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import {
  META_PIXEL_ID,
  fbPageView,
  fbTrack,
  fbTrackCustom,
  loadMetaPixel,
} from "@/lib/metaPixel";

/** Readable label for a clicked element (aria-label → text → value → title). */
function clickLabel(el: HTMLElement): string {
  const raw =
    el.getAttribute("aria-label") ||
    el.textContent ||
    (el as HTMLInputElement).value ||
    el.getAttribute("title") ||
    "";
  return raw.replace(/\s+/g, " ").trim().slice(0, 80);
}

/**
 * Loads the Meta Pixel once and reports:
 *   - PageView on every route change (App Router client navigations don't
 *     reload the page, so we track them manually),
 *   - ButtonClick (custom) for EVERY button/link click, with its label,
 *   - the matching STANDARD event for key CTAs (AddToCart / InitiateCheckout)
 *     and a custom BookConsultation — so Meta ad optimisation gets the funnel.
 * Admin tooling under /admin-tools is excluded. Renders nothing.
 */
export default function MetaPixel() {
  const pathname = usePathname();
  const loaded = useRef(false);

  // Load pixel + PageView on each route (excluding admin).
  useEffect(() => {
    if (!META_PIXEL_ID) return;
    if (pathname?.startsWith("/admin-tools")) return;
    if (!loaded.current) {
      loadMetaPixel();
      loaded.current = true;
    }
    fbPageView();
  }, [pathname]);

  // Global click tracking — one listener catches every button/link.
  useEffect(() => {
    if (!META_PIXEL_ID || typeof document === "undefined") return;
    function onClick(e: MouseEvent) {
      if (window.location.pathname.startsWith("/admin-tools")) return;
      const target = e.target as HTMLElement | null;
      const el = target?.closest<HTMLElement>(
        'button, a[href], [role="button"], input[type="submit"], input[type="button"]',
      );
      if (!el) return;
      const label = clickLabel(el);
      if (!label) return;
      const href = el.getAttribute("href") || undefined;
      const path = window.location.pathname;

      // Every button/link → a custom ButtonClick with its label.
      fbTrackCustom("ButtonClick", { label, href, path });

      // Map the important CTAs to standard funnel events for ad optimisation.
      const t = label.toLowerCase();
      if (/\badd to (cart|basket|bag)\b/.test(t)) {
        fbTrack("AddToCart", { content_name: label });
      } else if (
        /\b(buy now|checkout|proceed to (pay|checkout)|complete your purchase)\b/.test(t) ||
        /^continue with /.test(t)
      ) {
        fbTrack("InitiateCheckout", { content_name: label });
      } else if (/\bbook consultation\b/.test(t)) {
        fbTrackCustom("BookConsultation", { label });
      }
    }
    // Capture phase so we still record clicks that navigate away.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
