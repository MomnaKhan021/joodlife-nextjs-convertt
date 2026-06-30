/**
 * Trust / USP strip — Figma node 1:1558.
 * White bar with five trust items spread evenly (no scroll, no edge fades).
 * Dark-green outline icons + dark-green labels; items wrap on small screens.
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
    // Parcel / package
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" {...stroke}>
        <path d="m7.5 4.3 9 5.15" />
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
      </svg>
    ),
  },
  {
    label: "clinically proven medication",
    // Microscope
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" {...stroke}>
        <path d="M6 18h8" />
        <path d="M3 22h18" />
        <path d="M14 22a7 7 0 1 0 0-14h-1" />
        <path d="M9 14h2" />
        <path d="M8 6h4v4a2 2 0 0 1-2 2 2 2 0 0 1-2-2Z" />
        <path d="M12 6V4a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v2" />
      </svg>
    ),
  },
  {
    label: "Cancel anytime subscription",
    // Horizontal repeat / swap arrows
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" {...stroke}>
        <path d="m17 2 4 4-4 4" />
        <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
        <path d="m7 22-4-4 4-4" />
        <path d="M21 13v1a4 4 0 0 1-4 4H3" />
      </svg>
    ),
  },
  {
    label: "Medical support",
    // Chat / messages
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" {...stroke}>
        <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2Z" />
        <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
      </svg>
    ),
  },
  {
    label: "Trusted by 100k UK customers",
    // Person
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" {...stroke}>
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function UspBar() {
  return (
    <section
      aria-label="Why patients trust Jood"
      className="w-full border-y border-[#142e2a]/10 bg-white"
    >
      <ul className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6 py-4 md:flex-nowrap md:justify-between md:px-10 md:py-3.5 lg:px-16">
        {ITEMS.map((it) => (
          <li key={it.label} className="flex shrink-0 items-center gap-2.5">
            <span className="shrink-0">{it.icon}</span>
            <span className="whitespace-nowrap font-ui text-[14px] font-medium leading-[18px] text-[#142e2a] md:text-[15px]">
              {it.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
