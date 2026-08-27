"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// useLayoutEffect on the client, useEffect on the server (avoids the SSR warning).
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Force the window to the top when navigating between blog posts.
 *
 * Related-post / carousel links go from /blogs/[slug] → /blogs/[slug] — the
 * SAME dynamic segment — and the Next.js App Router doesn't reliably reset
 * scroll for same-segment navigations. So clicking a related post from the
 * bottom of one article left you at the bottom of the next one.
 *
 * We scroll to the top only on forward navigation. Browser back/forward is
 * detected via popstate and skipped so Next's native scroll restoration
 * still returns the reader to where they were.
 */
export default function ScrollToTopOnNav() {
  const pathname = usePathname();
  const isPop = useRef(false);

  useEffect(() => {
    const onPop = () => {
      isPop.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (isPop.current) {
      // Back/forward — let the router restore the previous position.
      isPop.current = false;
      return;
    }
    // Coming from a long page (e.g. the homepage blog carousel) the browser
    // keeps the old, larger scroll offset and clamps it to the shorter post —
    // landing you near its bottom. One scrollTo can lose the race with that
    // clamp / streamed layout, so we force the top before paint, on the next
    // frame, and once more shortly after.
    const toTop = () => window.scrollTo(0, 0);
    toTop();
    const raf = requestAnimationFrame(toTop);
    const t = setTimeout(toTop, 80);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [pathname]);

  return null;
}
