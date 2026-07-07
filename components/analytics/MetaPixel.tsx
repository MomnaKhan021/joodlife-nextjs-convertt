"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { META_PIXEL_ID, fbPageView, loadMetaPixel } from "@/lib/metaPixel";

/**
 * Loads the Meta Pixel once and fires a PageView on every route change
 * (App Router client navigations don't reload the page, so we track them
 * manually). Admin tooling under /admin-tools is excluded — it's staff
 * activity, not marketing traffic. Renders nothing.
 */
export default function MetaPixel() {
  const pathname = usePathname();
  const loaded = useRef(false);

  useEffect(() => {
    if (!META_PIXEL_ID) return;
    if (pathname?.startsWith("/admin-tools")) return;
    if (!loaded.current) {
      loadMetaPixel();
      loaded.current = true;
    }
    fbPageView();
  }, [pathname]);

  return null;
}
