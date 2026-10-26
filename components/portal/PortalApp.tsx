"use client";

import { useEffect, useRef } from "react";

import type { PortalInitial } from "@/lib/portal/data";
import { mountPortal } from "./engine";
import "./portal.css";

/**
 * The patient portal shell. The engine renders the screens into these
 * elements (data-jp="…") and owns all interaction inside them; React only
 * mounts it with the server-built data and tears it down on navigation.
 */
export default function PortalApp({ initial }: { initial: PortalInitial }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    return mountPortal(ref.current, initial);
  }, [initial]);

  return (
    // Masked in Microsoft Clarity recordings: every screen shows patient data.
    <div ref={ref} className="jp" data-svc={initial.svc} data-clarity-mask="True">
      <div data-jp="app" />
      <nav className="tabbar" data-jp="tabbar" aria-label="Main" />
      <div className="sheet-bg" data-jp="sheetBg" data-act="closeSheet" />
      <div className="sheet" data-jp="sheet" role="dialog" aria-modal="true" />
      <div className="toast" data-jp="toast" role="status" aria-live="polite" />
    </div>
  );
}
