"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Eligibility call-to-action that becomes a "Reorder" button for returning
 * patients. Renders identically to a styled <Link> (pass the same className),
 * but points at /reorder with the reorder label once the user has an order.
 *
 * Returning status comes from /api/account/returning; the endpoint also sets
 * a readable `jl_returning` cookie, so after the first visit the correct
 * label renders immediately (no flash) on later navigations. Initial state is
 * always `false` to avoid a hydration mismatch — for a first-time returning
 * visitor the label swaps once, on mount.
 */
export default function EligibilityCta({
  product,
  href,
  className,
  label = "Check Your Eligibility",
  reorderLabel = "Reorder",
}: {
  /** Consultation product slug used to build the default non-returning href. */
  product?: string;
  /** Explicit non-returning destination; defaults to /consultation?product=…. */
  href?: string;
  className?: string;
  label?: string;
  reorderLabel?: string;
}) {
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    let alive = true;

    // Instant best-guess from the cookie (deferred out of the effect body so
    // it isn't a synchronous setState), then confirm with the API.
    const m = document.cookie.match(/(?:^|; )jl_returning=([01])/);
    if (m) queueMicrotask(() => alive && setReturning(m[1] === "1"));

    fetch("/api/account/returning", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (alive) setReturning(Boolean(d?.returning));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return (
    <Link
      href={returning ? "/reorder" : (href ?? `/consultation?product=${product}`)}
      className={className}
    >
      {returning ? reorderLabel : label}
    </Link>
  );
}
