"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

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

  useEffect(() => {
    if (isPop.current) {
      // Back/forward — let the router restore the previous position.
      isPop.current = false;
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
