"use client";

import { useEffect, useRef } from "react";

/**
 * Trustpilot review tile for the analytics dashboard.
 *
 * Trustpilot blocks all server-side reads (the public review page, the
 * widget-find endpoint and the REST API all return 403 to servers, and
 * the REST API needs a paid plan). The one free, sanctioned way to show
 * a live rating + review count is Trustpilot's own client-side TrustBox
 * widget, which loads its data in the browser.
 *
 * It needs a Business Unit ID — a public value from your (free) Trustpilot
 * Business account. Set NEXT_PUBLIC_TRUSTPILOT_BUSINESS_UNIT_ID and the
 * live widget renders here; without it the tile is still a link to the
 * public review page so clicking always opens Trustpilot.
 */

declare global {
  interface Window {
    Trustpilot?: { loadFromElement: (el: HTMLElement, force?: boolean) => void };
  }
}

const BOOTSTRAP_SRC =
  "https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js";
// "Micro Combo" template — shows the star rating + "TrustScore | N reviews".
const TEMPLATE_ID = "5419b6ffb0d04a076446a9af";

const BUSINESS_UNIT_ID =
  process.env.NEXT_PUBLIC_TRUSTPILOT_BUSINESS_UNIT_ID ?? "";
const DOMAIN = process.env.NEXT_PUBLIC_TRUSTPILOT_DOMAIN ?? "joodlife.com";
const REVIEW_URL = `https://www.trustpilot.com/review/${DOMAIN}`;

/** Load the TrustBox bootstrap once, resolving when window.Trustpilot exists. */
let bootstrapPromise: Promise<void> | null = null;
function loadBootstrap(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Trustpilot) return Promise.resolve();
  if (bootstrapPromise) return bootstrapPromise;
  bootstrapPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${BOOTSTRAP_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject());
      if (window.Trustpilot) resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = BOOTSTRAP_SRC;
    s.async = true;
    s.addEventListener("load", () => resolve());
    s.addEventListener("error", () => reject());
    document.head.appendChild(s);
  });
  return bootstrapPromise;
}

export default function TrustpilotTile() {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!BUSINESS_UNIT_ID || !boxRef.current) return;
    let cancelled = false;
    loadBootstrap()
      .then(() => {
        if (!cancelled && boxRef.current && window.Trustpilot) {
          window.Trustpilot.loadFromElement(boxRef.current, true);
        }
      })
      .catch(() => {
        /* CSP or network — the fallback link below still works */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <a
      href={REVIEW_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col rounded-[14px] border border-[#e6e8ea] bg-white p-4 transition-colors hover:border-[#142e2a]/30 hover:bg-[#f7faf9]"
    >
      <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#616161]">
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden fill="#00b67a">
          <path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7L12 17.9 5.7 21.2l1.7-7L2 9.5l7.1-.6L12 2z" />
        </svg>
        Trustpilot reviews
      </span>

      {BUSINESS_UNIT_ID ? (
        <div className="mt-2">
          {/* TrustBox — populated in the browser by the bootstrap script */}
          <div
            ref={boxRef}
            className="trustpilot-widget"
            data-locale="en-GB"
            data-template-id={TEMPLATE_ID}
            data-businessunit-id={BUSINESS_UNIT_ID}
            data-style-height="52px"
            data-style-width="100%"
          >
            <span className="text-[12px] text-[#8a8f94]">Loading…</span>
          </div>
        </div>
      ) : (
        <>
          <span className="mt-1 font-display text-[24px] font-semibold text-[#c1c6ca]">
            —
          </span>
          <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-[#00b67a]">
            View on Trustpilot
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M7 17L17 7M17 7H8M17 7v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </>
      )}
    </a>
  );
}
