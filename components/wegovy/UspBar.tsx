/**
 * Trust / USP strip — Figma node 1:1558.
 * Green marquee bar: the five trust items scroll continuously, with fade
 * shadows masking both edges.
 */

type Item = { label: string; icon: React.ReactNode };

const stroke = {
  fill: "none",
  stroke: "#142e2a",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ITEMS: Item[] = [
  {
    label: "free next-day delivery",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" {...stroke}>
        <path d="M3 7l9-4 9 4-9 4-9-4z" />
        <path d="M3 7v10l9 4 9-4V7" />
        <path d="M12 11v10" />
      </svg>
    ),
  },
  {
    label: "clinically proven medication",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" {...stroke}>
        <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3" />
        <path d="M7 15h10" />
      </svg>
    ),
  },
  {
    label: "Cancel anytime subscription",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" {...stroke}>
        <path d="M4 9a8 8 0 0 1 14-3l2 2M20 4v4h-4" />
        <path d="M20 15a8 8 0 0 1-14 3l-2-2M4 20v-4h4" />
      </svg>
    ),
  },
  {
    label: "Medical support",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" {...stroke}>
        <path d="M4 5h16v11H8l-4 4V5z" />
        <path d="M12 8v5M9.5 10.5h5" />
      </svg>
    ),
  },
  {
    label: "Trusted by 100k UK customers",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" {...stroke}>
        <circle cx="12" cy="8" r="3.4" />
        <path d="M5.5 20c0-3.3 2.9-5.6 6.5-5.6s6.5 2.3 6.5 5.6" />
      </svg>
    ),
  },
];

export default function UspBar() {
  // Two identical copies of the row so the -50% marquee translate loops seamlessly.
  const track = [...ITEMS, ...ITEMS];

  return (
    <section
      aria-label="Why patients trust Jood"
      className="w-full bg-[#87af73]"
    >
      <div className="relative overflow-hidden py-3.5">
        {/* Edge fade shadows */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#87af73] to-transparent md:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#87af73] to-transparent md:w-24" />

        <ul className="flex w-max animate-marquee items-center [animation-duration:34s]">
          {track.map((it, i) => (
            <li
              key={i}
              className="flex shrink-0 items-center gap-2.5 px-6"
              aria-hidden={i >= ITEMS.length}
            >
              <span className="shrink-0">{it.icon}</span>
              <span className="whitespace-nowrap font-ui text-[14px] font-medium leading-[18px] text-[#142e2a] md:text-[15px]">
                {it.label}
              </span>
              <span className="ml-6 h-1.5 w-1.5 rounded-full bg-[#142e2a]/40" aria-hidden />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
