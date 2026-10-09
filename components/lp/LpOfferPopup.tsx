"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { LANDER_CTA_HREF, type LanderPopup } from "@/lib/landerContentTypes";

import { LP_ASSETS } from "./shared";

/** Shown once per browser session, so closing it isn't undone by a reload. */
const SEEN_KEY = "jood-lander-offer-seen";
const DELAY_MS = 3000;

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers / non-secure contexts: the textarea fallback.
    try {
      const t = document.createElement("textarea");
      t.value = text;
      t.setAttribute("readonly", "");
      t.style.position = "fixed";
      t.style.opacity = "0";
      document.body.appendChild(t);
      t.select();
      const ok = document.execCommand("copy");
      t.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/**
 * Stop the page behind the popup scrolling until it closes. overflow:hidden
 * alone doesn't hold on iPhone Safari, so the body is pinned in place (fixed,
 * shifted up by the scroll position) and put back exactly where it was. The
 * scrollbar's width is padded back so the page doesn't jump sideways.
 */
function lockPageScroll() {
  const html = document.documentElement;
  const body = document.body;
  const y = window.scrollY;
  const scrollbar = window.innerWidth - html.clientWidth;
  const prev = {
    htmlOverflow: html.style.overflow,
    overflow: body.style.overflow,
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    width: body.style.width,
    paddingRight: body.style.paddingRight,
  };
  html.style.overflow = "hidden";
  body.style.overflow = "hidden";
  body.style.position = "fixed";
  body.style.top = `-${y}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
  if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
  return () => {
    html.style.overflow = prev.htmlOverflow;
    body.style.overflow = prev.overflow;
    body.style.position = prev.position;
    body.style.top = prev.top;
    body.style.left = prev.left;
    body.style.right = prev.right;
    body.style.width = prev.width;
    body.style.paddingRight = prev.paddingRight;
    window.scrollTo({ top: y, behavior: "instant" });
  };
}

/**
 * The first-order discount popup on the ads lander: opens three seconds after
 * landing, once per session, with the code to copy and the consultation
 * button. Copy and code come from the CMS (Weight loss ads lander → Offer
 * popup); switched off there, it never renders.
 */
export default function LpOfferPopup({ content: c }: { content: LanderPopup }) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const code = c.code.trim();

  useEffect(() => {
    if (!c.enabled || !code) return;
    try {
      if (sessionStorage.getItem(SEEN_KEY)) return;
    } catch {
      // Storage blocked (private mode): show it, just without remembering.
    }
    const t = window.setTimeout(() => {
      setOpen(true);
      try {
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {}
    }, DELAY_MS);
    return () => window.clearTimeout(t);
  }, [c.enabled, code]);

  // Fade in, lock the page behind it, focus the close button, Esc closes.
  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => setShown(true));
    const unlock = lockPageScroll();
    closeBtn.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      unlock();
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open) return null;

  const close = () => setOpen(false);
  const copy = async () => {
    if (await copyText(code)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto overscroll-contain p-4 transition-opacity duration-300 sm:items-center ${
        shown ? "opacity-100" : "opacity-0"
      }`}
    >
      <div aria-hidden className="fixed inset-0 bg-[rgba(12,30,27,0.45)] backdrop-blur-[10px]" onClick={close} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative w-full max-w-[440px] rounded-[22px] bg-white px-[20px] pb-[22px] pt-[26px] text-center shadow-[0_24px_60px_rgba(12,30,27,0.35)] transition-transform duration-300 sm:px-[32px] sm:pb-[28px] sm:pt-[30px] ${
          shown ? "translate-y-0" : "translate-y-4"
        }`}
      >
        <button
          ref={closeBtn}
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-[12px] top-[12px] grid h-[36px] w-[36px] cursor-pointer place-items-center rounded-full text-[#5b6b67] transition-colors hover:bg-[#f2f5ee] hover:text-[#142e2a]"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        <Image src={`${LP_ASSETS}/logo-header.svg`} alt="Jood" width={95} height={30} unoptimized className="mx-auto h-[22px] w-auto" />

        <span className="mt-[16px] inline-block rounded-full bg-[#b4ff9f] px-[14px] py-[4px] font-ui text-[12px] font-medium leading-[17.8px] text-[#13332b]">
          New patient offer
        </span>

        <h2
          id={titleId}
          className="mx-auto mt-[12px] max-w-[360px] font-display text-[28px] !font-semibold leading-[32px] tracking-[-1px] text-[#142e2a] sm:text-[32px] sm:leading-[36px]"
        >
          {c.title}{" "}
          {c.titleAccent ? <em className="font-serif font-normal italic text-[#42746d]">{c.titleAccent}</em> : null}{" "}
          {c.titleEnd}
        </h2>

        <div className="mt-[20px] flex items-center justify-between gap-3 rounded-[12px] border border-dashed border-[#bfd0bb] bg-[#f7f9f2] py-[6px] pl-[16px] pr-[6px]">
          <p className="font-ui text-[15px] text-[#5b6b67]">
            Use code{" "}
            <span className="font-semibold tracking-[1.5px] text-[#142e2a]">{code}</span>
          </p>
          <button
            type="button"
            onClick={copy}
            className="flex h-[38px] shrink-0 cursor-pointer items-center gap-[6px] rounded-[8px] border border-[#dfe6da] bg-white px-[12px] font-ui text-[14px] font-medium text-[#142e2a] transition-colors hover:bg-[#f2f5ee]"
          >
            {copied ? (
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M3 8.5l3.2 3.2L13 5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
                <rect x="5.5" y="5.5" width="8" height="8" rx="1.6" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10.5 3.5V3a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 3v5A1.5 1.5 0 0 0 4 9.5h.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            )}
            <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>

        {c.ctaLabel.trim() ? (
          <Link
            href={c.ctaHref || LANDER_CTA_HREF}
            // The code is on their clipboard ready for checkout.
            onClick={() => {
              void copyText(code);
              close();
            }}
            className="btn-cta mt-[16px] flex h-[52px] w-full items-center justify-center rounded-[8px] border border-[#0c2421] bg-[#142e2a] px-[24px] font-ui text-[16.3px] font-medium leading-[19.5px] tracking-[-0.3px] text-white"
          >
            {c.ctaLabel}
          </Link>
        ) : null}

        {c.note.trim() ? (
          <p className="mt-[14px] flex items-center justify-center gap-[6px] font-ui text-[14px] text-[#5b6b67]">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
              <circle cx="8" cy="8" r="6.3" stroke="currentColor" strokeWidth="1.4" />
              <path d="M8 4.8V8l2.2 1.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            {c.note}
          </p>
        ) : null}
      </div>
    </div>
  );
}
