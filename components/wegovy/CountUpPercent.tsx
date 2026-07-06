"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animated stat that counts up from 0 to `value` the first time it scrolls
 * into view (easeOutCubic). Renders the real value on the server / before
 * animating so no-JS and SEO still see the final number.
 */
export default function CountUpPercent({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1300,
  className = "",
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(value.toFixed(decimals));
  const played = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || played.current) return;
        played.current = true;
        io.disconnect();

        const start = performance.now();
        setDisplay((0).toFixed(decimals));
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
          setDisplay((value * eased).toFixed(decimals));
          if (t < 1) requestAnimationFrame(tick);
          else setDisplay(value.toFixed(decimals));
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [value, decimals, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
