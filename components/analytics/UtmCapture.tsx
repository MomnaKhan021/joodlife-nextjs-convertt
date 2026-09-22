"use client";

import { useEffect } from "react";

/**
 * Captures ad attribution on landing. When the URL carries any utm_* param
 * (or an fbclid/gclid click id), the current values — plus referrer and the
 * landing path — are written to a readable `jl_utm` cookie (90 days,
 * last-touch: a newer ad click overwrites). The consultation API reads this
 * cookie server-side and stamps it onto the consultation, so every submission
 * is attributed to the campaign / ad set / ad that drove it.
 *
 * Facebook example the marketing team uses:
 *   utm_source=Facebook&utm_medium={{site_source_name}}
 *   &utm_campaign={{campaign.name}}&utm_content={{adset.name}}{{ad.name}}
 */
const KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

export default function UtmCapture() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const utm: Record<string, string> = {};
      for (const k of KEYS) {
        const v = params.get(k);
        if (v) utm[k] = v.slice(0, 300);
      }
      const fbclid = params.get("fbclid");
      const gclid = params.get("gclid");
      // Only record when this visit actually carries attribution.
      if (Object.keys(utm).length === 0 && !fbclid && !gclid) return;

      if (fbclid) utm.fbclid = fbclid.slice(0, 300);
      if (gclid) utm.gclid = gclid.slice(0, 300);
      utm.landing_path = window.location.pathname.slice(0, 300);
      try {
        const ref = document.referrer;
        if (ref && !ref.includes(window.location.host)) utm.referrer = ref.slice(0, 300);
      } catch {
        /* referrer unavailable */
      }
      utm.captured_at = new Date().toISOString();

      const value = encodeURIComponent(JSON.stringify(utm));
      document.cookie = `jl_utm=${value}; path=/; max-age=${60 * 60 * 24 * 90}; SameSite=Lax`;
    } catch {
      /* never break the page over attribution */
    }
  }, []);

  return null;
}
