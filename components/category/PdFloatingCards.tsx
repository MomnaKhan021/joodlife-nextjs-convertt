/**
 * Auto-scrolling "floating UI" cards behind the period-delay portrait —
 * Figma "Home Page - 2026" Component 296 (node 143:1217). In the file these
 * frosted cards fan across the full width behind her; the previous build
 * baked them into one static PNG (pd-cards.png) so they didn't move. These
 * are real elements marquee-ing left→right, looping seamlessly (two copies
 * of the row, played in reverse). Decorative → aria-hidden; paused for
 * prefers-reduced-motion via the global rule on .animate-marquee.
 *
 * Widths/heights are inline styles (not arbitrary Tailwind classes) so the
 * large Figma card sizes always apply.
 */

const PINK = "#f9b4cc";
const OK = "#5ee9b5";

// Frosted pink-glass surface — Figma fill is a #000000→#f472a8 gradient
// under a background blur, which over the section's pink reads as this.
const cardBase =
  "relative shrink-0 overflow-hidden rounded-[20px] border border-white/18 p-5 text-white shadow-[0_28px_55px_-14px_rgba(20,10,16,0.6)] backdrop-blur-[14px]";
const cardBg = {
  background:
    "linear-gradient(180deg, rgba(16,10,13,0.62) 0%, rgba(244,114,168,0.34) 100%)",
} as const;
const H = 288; // shared card height so the row aligns

// The six cards, as render functions so each can be placed on the arc.
const CARDS: { w: number; body: React.ReactNode }[] = [
  {
    w: 300,
    body: (
      <>
        <p className="font-ui text-[15px] font-semibold">Cycle Window</p>
        <p className="mt-1 font-ui text-[12px] text-white/70">Your predicted cycle</p>
        <p className="mt-5 font-display text-[34px] font-semibold leading-none">
          Day 6 <span className="text-[15px] font-normal text-white/70">of 28</span>
        </p>
        <div className="mt-4 flex gap-1" aria-hidden>
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="h-1.5 flex-1 rounded-full"
              style={{ background: i < 6 ? PINK : "rgba(255,255,255,0.25)" }}
            />
          ))}
        </div>
        <p className="mt-5 font-ui text-[12px] text-white/70">Next period</p>
        <p className="font-ui text-[13px] font-medium">May 24 – May 28</p>
      </>
    ),
  },
  {
    w: 300,
    body: (
      <>
        <p className="font-ui text-[15px] font-semibold">Event Date</p>
        <p className="mt-1 font-ui text-[12px] text-white/70">Your important date</p>
        <p className="mt-5 font-display text-[28px] font-semibold" style={{ color: PINK }}>
          June 1, 2025
        </p>
        <p className="mt-5 font-ui text-[13px] leading-relaxed text-white/85">
          <span className="mr-1" aria-hidden>🎉</span>
          You&rsquo;re all set! Your period is planned around it.
        </p>
      </>
    ),
  },
  {
    w: 216,
    body: (
      <>
        <p className="font-ui text-[15px] font-semibold">Discreet Delivery</p>
        <p className="mt-1 font-ui text-[12px] leading-snug text-white/70">
          Private &amp; discreet delivery to your door.
        </p>
        <ul className="mt-5 flex flex-col gap-3 font-ui text-[12.5px]">
          {["Clinically approved", "Discreet packaging", "Fast UK delivery"].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <span
                className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px]"
                style={{ background: "rgba(249,180,204,0.22)", color: PINK }}
                aria-hidden
              >
                ✓
              </span>
              {t}
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    w: 216,
    body: (
      <>
        <p className="font-ui text-[15px] font-semibold">Hormone Balance</p>
        <p className="mt-1 font-ui text-[12px] text-white/70">Your cycle at a glance</p>
        <ul className="mt-5 flex flex-col gap-4">
          {[
            ["Estrogen", 0.7],
            ["Progesterone", 0.45],
            ["LH", 0.85],
          ].map(([label, pct]) => (
            <li key={label as string}>
              <span className="font-ui text-[11.5px] text-white/80">{label}</span>
              <span className="mt-1.5 block h-2 w-full rounded-full bg-white/15" aria-hidden>
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${(pct as number) * 100}%`, background: PINK }}
                />
              </span>
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    w: 300,
    body: (
      <>
        <div className="flex items-center justify-between">
          <p className="font-ui text-[15px] font-semibold">Eligibility Check</p>
          <span
            className="rounded-full px-2.5 py-1 font-ui text-[11px] font-semibold"
            style={{ background: "rgba(94,233,181,0.16)", color: OK }}
          >
            Eligible
          </span>
        </div>
        <p className="mt-1 font-ui text-[12px] leading-snug text-white/70">
          You may be eligible for period delay treatment.
        </p>
        <ul className="mt-5 flex flex-col gap-3 font-ui text-[12.5px]">
          {["Health questionnaire", "Reviewed by clinician", "Safe & appropriate"].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <span
                className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px]"
                style={{ background: "rgba(94,233,181,0.18)", color: OK }}
                aria-hidden
              >
                ✓
              </span>
              {t}
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    w: 300,
    body: (
      <>
        <div className="flex items-center justify-between font-ui text-[12px] text-white/80">
          <span aria-hidden>‹</span>
          <span className="font-semibold text-white">May 2025</span>
          <span aria-hidden>›</span>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-y-1.5 text-center font-ui text-[10px] text-white/55">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="mt-1.5 grid grid-cols-7 gap-y-1.5 text-center font-ui text-[11px]">
          {Array.from({ length: 31 }).map((_, i) => {
            const d = i + 1;
            const highlight = d === 24 || d === 25;
            const today = d === 15;
            return (
              <span
                key={d}
                className="mx-auto grid h-5 w-5 place-items-center rounded-full"
                style={
                  highlight
                    ? { background: PINK, color: "#3a0d20", fontWeight: 600 }
                    : today
                      ? { background: "#ffffff", color: "#3a0d20", fontWeight: 600 }
                      : { color: "rgba(255,255,255,0.8)" }
                }
              >
                {d}
              </span>
            );
          })}
        </div>
      </>
    ),
  },
];

// Band + arc geometry. Coordinates are in this fixed 1600×560 space; the
// band is clipped by the section, so the arc's ends sit off-screen.
const BAND_W = 1840;
const BAND_H = 460;
// Rising curve, bottom-left → top-right (matches the Figma card ascent:
// left card ~y470, right card ~y90).
const ARC = "path('M -120 360 C 480 320, 1360 170, 1960 130')";
const DUR = 40; // seconds for one full traversal

export default function PdFloatingCards() {
  // Render each card twice so the arc stays populated end-to-end; 12 evenly
  // delayed instances give continuous, well-spaced flow.
  const instances = [...CARDS];
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-[46%] z-0 -translate-x-1/2 -translate-y-1/2 overflow-hidden"
      style={{
        width: BAND_W,
        height: BAND_H,
        maxWidth: "100vw",
        // Generous fade on all four edges so cards dissolve into the section
        // as they enter/leave the curve rather than hard-cutting.
        maskImage:
          "linear-gradient(90deg, transparent 0, #000 7%, #000 93%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(90deg, transparent 0, #000 7%, #000 93%, transparent 100%)",
      }}
    >
      {instances.map((card, idx) => (
        <div
          key={idx}
          className={`pd-arc-card absolute left-0 top-0 ${cardBase}`}
          style={{
            ...cardBg,
            width: card.w,
            minHeight: H,
            offsetPath: ARC,
            // Even spacing around the loop (duration is in the .pd-arc-card class).
            animationDelay: `-${(idx / instances.length) * DUR}s`,
          }}
        >
          {card.body}
        </div>
      ))}
    </div>
  );
}
