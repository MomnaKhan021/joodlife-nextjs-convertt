/**
 * JoodLife admin icon — compact monogram shown in the admin sidebar
 * header (next to "JoodLife CMS") and used as the favicon.
 *
 * A solid brand-green circle with a serif italic "J" inside, mirroring
 * the italic "for you" emphasis used across the marketing site.
 */
export function Icon() {
  return (
    <div className="jood-admin-icon" aria-label="JoodLife">
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
      >
        <circle cx="16" cy="16" r="16" fill="#142e2a" />
        <text
          x="16"
          y="22"
          fontFamily="'Plus Jakarta Sans', 'Source Serif Pro', Georgia, serif"
          fontSize="20"
          fontStyle="italic"
          fontWeight="600"
          fill="#dff49f"
          textAnchor="middle"
        >
          J
        </text>
      </svg>
    </div>
  );
}

export default Icon;
