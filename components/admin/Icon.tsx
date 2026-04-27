/**
 * Compact JoodLife monogram. Used by Payload in tight slots like the
 * authenticated top bar — the full <Logo /> wordmark won't fit there
 * and gets clipped to just the "J", which is what was happening
 * before this revision.
 *
 * Square, brand-green badge with a serif italic "J" in leaf-green —
 * mirrors the italic "for you" emphasis on the marketing site.
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
          y="22"
          fontFamily="'Plus Jakarta Sans', Georgia, serif"
          fontSize="20"
          fontWeight="600"
          fontStyle="italic"
          fill="#dff49f"
          textAnchor="middle"
        >
          J
        </text>
      </svg>
    </span>
  );
}

export default Icon;
