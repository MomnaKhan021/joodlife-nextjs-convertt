/**
 * Trust / USP strip — Figma node 1:1558.
 * White bg, auto-scrolling marquee, Cairo 500 18px black labels, outline icons.
 * Section: 60px tall (10px py). Five items, duplicated for seamless loop.
 */

type Item = { label: string; icon: React.ReactNode };

const s = {
  fill: "none",
  stroke: "#000000",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ITEMS: Item[] = [
  {
    label: "free next-day delivery",
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" {...s}>
        <rect x="3" y="8" width="20" height="15" rx="1.5" />
        <path d="M3 12h20" />
        <path d="M9 8V5a4 4 0 0 1 8 0v3" />
        <path d="M10 16h6" />
      </svg>
    ),
  },
  {
    label: "clinically proven medication",
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" {...s}>
        <path d="M9 3h8v6l-4 4-4-4Z" />
        <path d="M13 13v4" />
        <circle cx="13" cy="20" r="3" />
        <path d="M7 23h12" />
        <path d="M9 3H7a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2" />
      </svg>
    ),
  },
  {
    label: "Cancel anytime subscription",
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" {...s}>
        <path d="M20 8A9 9 0 1 0 22 13" />
        <path d="M20 4v4h-4" />
      </svg>
    ),
  },
  {
    label: "Medical support",
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" {...s}>
        <path d="M4 5h18a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H8l-5 4V6a1 1 0 0 1 1-1Z" />
        <path d="M13 9v6M10 12h6" />
      </svg>
    ),
  },
  {
    label: "Trusted by 100k UK customers",
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" {...s}>
        <circle cx="13" cy="8" r="4" />
        <path d="M5 22v-2a8 8 0 0 1 16 0v2" />
      </svg>
    ),
  },
];

export default function UspBar() {
  const track = [...ITEMS, ...ITEMS];

  return (
    <section aria-label="Why patients trust Jood" className="w-full bg-white">
      <div className="relative overflow-hidden py-[10px]">
        <ul
          className="flex w-max animate-marquee items-center"
          style={{ animationDuration: "30s" }}
        >
          {track.map((it, i) => (
            <li
              key={i}
              className="flex shrink-0 items-center gap-3 px-10"
              aria-hidden={i >= ITEMS.length}
            >
              <span className="shrink-0 text-black">{it.icon}</span>
              <span className="whitespace-nowrap font-cairo text-[16px] font-medium leading-[22.4px] tracking-[-0.02em] text-black md:text-[18px] md:leading-[25.2px]">
                {it.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
