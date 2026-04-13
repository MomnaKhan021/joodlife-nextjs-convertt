'use client';

import { useEffect, useState } from 'react';

interface UseCountUpOptions {
  end: number;
  duration?: number;
  start?: number;
  enabled?: boolean;
  suffix?: string;
  prefix?: string;
}

export function useCountUp({
  end,
  duration = 2000,
  start = 0,
  enabled = false,
  suffix = '',
  prefix = '',
}: UseCountUpOptions) {
  const [value, setValue] = useState(start);

  useEffect(() => {
    if (!enabled) {
      setValue(start);
      return;
    }

    const startTime = performance.now();
    const range = end - start;

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + range * eased);
      setValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [enabled, end, duration, start]);

  return `${prefix}${value}${suffix}`;
}
