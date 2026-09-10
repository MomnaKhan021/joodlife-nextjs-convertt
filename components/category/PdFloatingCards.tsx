
/**
 * Auto-scrolling "floating UI" cards behind the period-delay portrait —
 * Figma "Home Page - 2026" Component 296 (node 143:1217). In the file these
 * six frosted cards drift horizontally behind her; the previous build baked
 * them into one static PNG (pd-cards.png), so they didn't move. These are
 * real elements marquee-ing across, looping seamlessly (two copies of the
 * row, translated -50%). Decorative, so aria-hidden; paused for
 * prefers-reduced-motion via the global rule on .animate-marquee.
 */

const PINK = "#f9b4cc";
const OK = "#5ee9b5";

// Frosted pink-glass surface — Figma fill is a #000000→#f472a8 gradient
// under a background blur, which over the section's pink reads as this.
const cardBase =
  "relative shrink-0 overflow-hidden rounded-[18px] border border-white/18 p-4 text-white shadow-[0_24px_50px_-12px_rgba(20,10,16,0.55)] backdrop-blur-[14px]";
const cardBg = {
  background:
    "linear-gradient(180deg, rgba(16,10,13,0.60) 0%, rgba(244,114,168,0.32) 100%)",
} as const;

function Row() {
  return (
    <div className="flex items-center gap-4">
      {/* Cycle Window */}
      <div className={`${cardBase} w-[240px]`} style={cardBg}>
        <p className="font-ui text-[13px] font-semibold">Cycle Window</p>
        <p className="mt-0.5 font-ui text-[11px] text-white/70">Your predicted cycle</p>
        <p className="mt-3 font-display text-[26px] font-semibold leading-none">
          Day 6 <span className="text-[13px] font-normal text-white/70">of 28</span>
        </p>
        <div className="mt-3 flex gap-1" aria-hidden>
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="h-1.5 flex-1 rounded-full"
              style={{ background: i < 6 ? PINK : "rgba(255,255,255,0.25)" }}
            />
          ))}
        </div>
        <p className="mt-3 font-ui text-[11px] text-white/70">Next period</p>
        <p className="font-ui text-[12px] font-medium">May 24 – May 28</p>
      </div>

      {/* Event Date */}
      <div className={`${cardBase} w-[240px]`} style={cardBg}>
        <p className="font-ui text-[13px] font-semibold">Event Date</p>
        <p className="mt-0.5 font-ui text-[11px] text-white/70">Your important date</p>
        <p className="mt-3 font-display text-[22px] font-semibold" style={{ color: PINK }}>
          June 1, 2025
        </p>
        <p className="mt-3 font-ui text-[12px] leading-snug text-white/85">
          <span className="mr-1" aria-hidden>🎉</span>
          You&rsquo;re all set! Your period is planned around it.
        </p>
      </div>

      {/* Discreet Delivery */}
      <div className={`${cardBase} w-[208px]`} style={cardBg}>
        <p className="font-ui text-[13px] font-semibold">Discreet Delivery</p>
        <p className="mt-0.5 font-ui text-[11px] leading-snug text-white/70">
          Private &amp; discreet delivery to your door.
        </p>
        <ul className="mt-3 flex flex-col gap-2 font-ui text-[11.5px]">
          {["Clinically approved", "Discreet packaging", "Fast UK delivery"].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <span
                className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px]"
                style={{ background: "rgba(249,180,204,0.22)", color: PINK }}
                aria-hidden
              >
                ✓
              </span>
              {t}
            </li>
          ))}
        </ul>
      </div>

      {/* Hormone Balance */}
      <div className={`${cardBase} w-[196px]`} style={cardBg}>
        <p className="font-ui text-[13px] font-semibold">Hormone Balance</p>
        <p className="mt-0.5 font-ui text-[11px] text-white/70">Your cycle at a glance</p>
        <ul className="mt-3 flex flex-col gap-2.5">
          {[
            ["Estrogen", 0.7],
            ["Progesterone", 0.45],
            ["LH", 0.85],
          ].map(([label, pct]) => (
            <li key={label as string}>
              <span className="font-ui text-[10.5px] text-white/80">{label}</span>
              <span className="mt-1 block h-1.5 w-full rounded-full bg-white/15" aria-hidden>
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${(pct as number) * 100}%`, background: PINK }}
                />
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Eligibility Check */}
      <div className={`${cardBase} w-[236px]`} style={cardBg}>
        <div className="flex items-center justify-between">
          <p className="font-ui text-[13px] font-semibold">Eligibility Check</p>
          <span
            className="rounded-full px-2 py-0.5 font-ui text-[10px] font-semibold"
            style={{ background: "rgba(94,233,181,0.16)", color: OK }}
          >
            Eligible
          </span>
        </div>
        <p className="mt-0.5 font-ui text-[11px] leading-snug text-white/70">
          You may be eligible for period delay treatment.
        </p>
        <ul className="mt-3 flex flex-col gap-2 font-ui text-[11.5px]">
          {["Health questionnaire", "Reviewed by clinician", "Safe & appropriate"].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <span
                className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px]"
                style={{ background: "rgba(94,233,181,0.18)", color: OK }}
                aria-hidden
              >
                ✓
              </span>
              {t}
            </li>
          ))}
        </ul>
      </div>

      {/* Mini calendar */}
      <div className={`${cardBase} w-[240px]`} style={cardBg}>
        <div className="flex items-center justify-between font-ui text-[11px] text-white/80">
          <span aria-hidden>‹</span>
          <span className="font-semibold text-white">May 2025</span>
          <span aria-hidden>›</span>
        </div>
        <div className="mt-2 grid grid-cols-7 gap-y-1 text-center font-ui text-[9px] text-white/55">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-y-1 text-center font-ui text-[10px]">
          {Array.from({ length: 31 }).map((_, i) => {
            const d = i + 1;
            const highlight = d === 24 || d === 25; // planned window
            const today = d === 15;
            return (
              <span
                key={d}
                className="mx-auto grid h-4 w-4 place-items-center rounded-full"
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
      </div>
    </div>
  );
}

export default function PdFloatingCards() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-[30%] z-0 -translate-y-1/2 md:top-[33%]"
    >
      {/* Edge fade so cards dissolve into the section rather than hard-cut */}
      <div
        className="overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(90deg, transparent 0, #000 8%, #000 92%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent 0, #000 8%, #000 92%, transparent 100%)",
        }}
      >
        {/* Two identical rows → a -50% marquee loops seamlessly. Slow drift. */}
        {/* animation-direction:reverse makes the -50% keyframe play backwards,
            so the cards drift LEFT → RIGHT across the screen. */}
        <div
          className="animate-marquee flex w-max gap-4 opacity-95"
          style={{ animationDuration: "48s", animationDirection: "reverse" }}
        >
          <Row />
          <Row />
        </div>
      </div>
    </div>
  );
}
