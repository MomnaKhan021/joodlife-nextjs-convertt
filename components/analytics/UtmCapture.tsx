"use client";

import { useEffect } from "react";

/**
 * Visit / attribution tracker. Builds a first-party "conversion journey" so
 * the admin can see where a patient came from and how they converted —
 * first session source, number of sessions, days to conversion, and the
 * converting campaign/ad (UTM), matching a standard conversion-summary view.
 *
 * Everything lives in two readable cookies (best-effort, per browser):
 *  - jl_journey : the session timeline {sessions:[{src,med,camp,cont,term,land,at}], last}
 *  - jl_utm     : the most recent campaign touch (for the UTM Parameters panel)
 *
 * A new "session" starts after a 30-minute gap. Source is read from utm_source
 * (the marketing team's Facebook template works as-is), then fbclid/gclid,
 * then the referrer host, else "Direct". The consultation API reads these on
 * submit and stores the journey on the consultation.
 */

const SESSION_GAP_MS = 30 * 60 * 1000;
const MAX_SESSIONS = 30;
const clip = (v: string | null) => (v ? v.slice(0, 200) : "");

type Touch = {
  src: string;
  med: string;
  camp: string;
  cont: string;
  term: string;
  land: string;
  at: string;
};

function currentTouch(params: URLSearchParams): Touch {
  const base = { land: clip(window.location.pathname), at: new Date().toISOString() };
  const s = params.get("utm_source");
  if (s) {
    return {
      src: clip(s),
      med: clip(params.get("utm_medium")),
      camp: clip(params.get("utm_campaign")),
      cont: clip(params.get("utm_content")),
      term: clip(params.get("utm_term")),
      ...base,
    };
  }
  if (params.get("fbclid")) return { src: "Facebook", med: "paid", camp: "", cont: "", term: "", ...base };
  if (params.get("gclid")) return { src: "Google", med: "cpc", camp: "", cont: "", term: "", ...base };
  try {
    const ref = document.referrer;
    if (ref) {
      const h = new URL(ref).hostname.replace(/^www\./, "").toLowerCase();
      if (!h || h === window.location.hostname.toLowerCase()) {
        return { src: "Direct", med: "", camp: "", cont: "", term: "", ...base };
      }
      const map: [RegExp, string, string][] = [
        [/google\./, "Google", "organic"],
        [/(facebook|fb\.me|fb\.com)/, "Facebook", "referral"],
        [/instagram/, "Instagram", "referral"],
        [/bing\./, "Bing", "organic"],
        [/(twitter|t\.co|x\.com)/, "X (Twitter)", "referral"],
        [/(youtube|youtu\.be)/, "YouTube", "referral"],
        [/(duckduckgo|yahoo\.)/, "Search", "organic"],
        [/tiktok/, "TikTok", "referral"],
      ];
      for (const [re, src, med] of map) if (re.test(h)) return { src, med, camp: "", cont: "", term: "", ...base };
      return { src: h, med: "referral", camp: "", cont: "", term: "", ...base };
    }
  } catch {
    /* referrer unavailable */
  }
  return { src: "Direct", med: "", camp: "", cont: "", term: "", ...base };
}

function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}
function writeCookie(name: string, value: string, days: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * days}; SameSite=Lax`;
}

export default function UtmCapture() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const touch = currentTouch(params);
      const now = Date.now();

      // Journey: append a session only after a 30-min gap (or on first visit).
      let journey: { sessions: Touch[]; last: number } = { sessions: [], last: 0 };
      const raw = readCookie("jl_journey");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.sessions)) journey = parsed;
        } catch {
          /* reset on corrupt cookie */
        }
      }
      const isNewSession = journey.sessions.length === 0 || now - (journey.last || 0) > SESSION_GAP_MS;
      if (isNewSession) {
        journey.sessions.push(touch);
        if (journey.sessions.length > MAX_SESSIONS) {
          // keep the first (attribution) + the most recent ones
          journey.sessions = [journey.sessions[0], ...journey.sessions.slice(-(MAX_SESSIONS - 1))];
        }
      } else if (
        // Within the same session, upgrade a "Direct" open to a real campaign
        // touch if one arrives (e.g. they clicked an ad in the same window).
        touch.src !== "Direct" &&
        journey.sessions.length > 0 &&
        journey.sessions[journey.sessions.length - 1].src === "Direct"
      ) {
        journey.sessions[journey.sessions.length - 1] = touch;
      }
      journey.last = now;
      writeCookie("jl_journey", JSON.stringify(journey), 90);

      // Last campaign touch (for the UTM Parameters panel).
      if (params.get("utm_source") || params.get("utm_campaign") || params.get("fbclid") || params.get("gclid")) {
        const utm: Record<string, string> = {};
        for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
          const v = params.get(k);
          if (v) utm[k] = clip(v);
        }
        if (params.get("fbclid")) utm.fbclid = clip(params.get("fbclid"));
        if (params.get("gclid")) utm.gclid = clip(params.get("gclid"));
        utm.landing_path = touch.land;
        utm.captured_at = touch.at;
        writeCookie("jl_utm", JSON.stringify(utm), 90);
      }
    } catch {
      /* never break the page over attribution */
    }
  }, []);

  return null;
}
