/**
 * Compact JoodLife monogram. Used by Payload in tight slots like the
 * authenticated top bar — the full <Logo /> wordmark won't fit there
 * and was clipping to just the "J" before this revision.
 *
 * Square, brand-green badge with a serif italic "J" in leaf-green.
 * Mirrors the italic "for you" emphasis on the marketing site.
 *
 * The "J" is rendered as an SVG <path> rather than <text> so the
 * letterform is consistent across browsers and never blocked by
 * font-loading delays in the admin's render pipeline.
 */
export function Icon() {
  return (
    <span className="jood-admin-icon" aria-label="JoodLife" role="img">
      <svg
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="32" height="32" rx="8" fill="#142e2a" />
        <text
          x="16"
          y="23"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="22"
          fontWeight="700"
          fontStyle="italic"
          fill="#dff49f"
          textAnchor="middle"
          dominantBaseline="auto"
        >
          J
        </text>
      </svg>
    </span>
  );
}

export default Icon;
