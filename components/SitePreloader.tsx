"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Fullscreen brand preloader shown before the marketing site renders.
 *
 * - Centers the JoodLife logo mark inside a circular dotted ring.
 * - Ring rotates and uses a sage→dark gradient so the dots appear to fade
 *   into a trail, matching the brand reference.
 * - Always displays for ~3 seconds (deliberate brand moment), then fades
 *   out over 300ms and unmounts so it never blocks interaction.
 * - Server-renders into the initial HTML so users see it during FOUC too;
 *   the client effect then dismisses it after hydration.
 * - Skipped on app/account/admin/checkout routes — a marketing splash there
 *   reads as a glitch (e.g. on /profile/weight-logs).
 */
const PRELOADER_VISIBLE_MS = 3_000;
const PRELOADER_FADE_MS = 300;

/** Utility/app routes that must NOT show the marketing splash. */
const SKIP_PREFIXES = [
  "/profile",
  "/admin-tools",
  "/login",
  "/signup",
  "/checkout",
  "/reorder",
  "/consultation",
];

export default function SitePreloader() {
  const pathname = usePathname();
  const skip = SKIP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const [visible, setVisible] = useState(true);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    if (skip) return;
    // Fixed-duration display: keep the brand moment consistent regardless
    // of how fast (or slow) the actual page assets resolve.
    const fadeTimer = window.setTimeout(
      () => setVisible(false),
      PRELOADER_VISIBLE_MS,
    );
    const unmountTimer = window.setTimeout(
      () => setRemoved(true),
      PRELOADER_VISIBLE_MS + PRELOADER_FADE_MS,
    );
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(unmountTimer);
    };
  }, [skip]);

  if (skip || removed) return null;

  return (
    <div
      aria-hidden="true"
      role="presentation"
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="relative h-32 w-32 sm:h-40 sm:w-40 md:h-48 md:w-48">
        {/* Rotating dotted ring. */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full animate-[spin_1.6s_linear_infinite]"
          aria-hidden="true"
        >
          <defs>
            {/* Linear gradient gives the dots a fading trail effect as
                they rotate. The "head" of the spinner is the brand dark
                teal, fading down to the sage muted on the tail. */}
            <linearGradient id="jood-preloader-ring" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0b3b3c" stopOpacity="1" />
              <stop offset="40%" stopColor="#0b3b3c" stopOpacity="0.7" />
              <stop offset="75%" stopColor="#d3dabe" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#d3dabe" stopOpacity="0" />
            </linearGradient>
          </defs>
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="url(#jood-preloader-ring)"
            strokeWidth="3"
            strokeLinecap="round"
            // 0.5 visible + 6 gap → renders as ~24 small dots around the ring.
            strokeDasharray="0.5 6"
          />
        </svg>

        {/* JoodLife logo mark, centered. The mark is wider than tall (55x26),
            so we size it relative to the ring so it fits comfortably inside. */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            viewBox="0 0 55 26"
            xmlns="http://www.w3.org/2000/svg"
            className="h-auto w-1/2"
            aria-label="JoodLife"
            role="img"
          >
            <path
              d="M18.3258 7.40901L23.6863 12.7695L23.7043 12.7541L27.441 16.4908L27.4564 16.5062L32.9173 21.9671C34.717 23.7663 37.0097 24.9914 39.5057 25.4876C42.0016 25.9839 44.5886 25.7288 46.9396 24.7548C49.2906 23.7809 51.3 22.1316 52.7137 20.0157C54.1274 17.8997 54.882 15.4121 54.882 12.8673C54.882 10.3226 54.1274 7.83492 52.7137 5.71898C51.3 3.60303 49.2906 1.95379 46.9396 0.979796C44.5886 0.00579941 42.0016 -0.249213 39.5057 0.247C37.0097 0.743213 34.717 1.96837 32.9173 3.76756L28.1999 8.48496L31.8414 12.1238L36.5562 7.40901C37.6358 6.32906 39.0115 5.59353 40.5091 5.29545C42.0068 4.99737 43.5592 5.15012 44.9701 5.73439C46.3809 6.31866 47.5868 7.3082 48.4353 8.57786C49.2837 9.84752 49.7366 11.3403 49.7366 12.8673C49.7366 14.3944 49.2837 15.8871 48.4353 17.1568C47.5868 18.4264 46.3809 19.416 44.9701 20.0003C43.5592 20.5845 42.0068 20.7373 40.5091 20.4392C39.0115 20.1411 37.6358 19.4056 36.5562 18.3256L31.224 12.9934L31.206 13.0089L21.9673 3.77013C20.1679 1.97021 17.8751 0.744336 15.379 0.247532C12.8829 -0.249271 10.2955 0.0053175 7.9441 0.9791C5.59268 1.95288 3.58285 3.60212 2.1688 5.71822C0.754753 7.83432 0 10.3222 0 12.8673C0 15.4124 0.754753 17.9003 2.1688 20.0164C3.58285 22.1325 5.59268 23.7818 7.9441 24.7555C10.2955 25.7293 12.8829 25.9839 15.379 25.4871C17.8751 24.9903 20.1679 23.7644 21.9673 21.9645L26.775 17.1568L23.1361 13.5179L18.3258 18.3256C17.2462 19.4056 15.8705 20.1411 14.3729 20.4392C12.8752 20.7373 11.3228 20.5845 9.91191 20.0003C8.50106 19.416 7.29516 18.4264 6.44673 17.1568C5.5983 15.8871 5.14545 14.3944 5.14545 12.8673C5.14545 11.3403 5.5983 9.84752 6.44673 8.57786C7.29516 7.3082 8.50106 6.31866 9.91191 5.73439C11.3228 5.15012 12.8752 4.99737 14.3729 5.29545C15.8705 5.59353 17.2462 6.32906 18.3258 7.40901Z"
              fill="#0C2421"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
