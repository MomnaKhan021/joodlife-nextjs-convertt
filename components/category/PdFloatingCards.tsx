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

function Card({ w, children }: { w: number; children: React.ReactNode }) {
  return (
    <div className={cardBase} style={{ ...cardBg, width: w, minHeight: H }}>
      {children}
    </div>
  );
}

function Row() {
  return (
    <div className="flex items-stretch gap-5">
      {/* Cycle Window */}
      <Card w={300}>
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
      </Card>

      {/* Event Date */}
      <Card w={300}>
        <p className="font-ui text-[15px] font-semibold">Event Date</p>
        <p className="mt-1 font-ui text-[12px] text-white/70">Your important date</p>
        <p className="mt-5 font-display text-[28px] font-semibold" style={{ color: PINK }}>
          June 1, 2025
        </p>
        <p className="mt-5 font-ui text-[13px] leading-relaxed text-white/85">
          <span className="mr-1" aria-hidden>🎉</span>
          You&rsquo;re all set! Your period is planned around it.
        </p>
      </Card>

      {/* Discreet Delivery */}
      <Card w={216}>
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
      </Card>

      {/* Hormone Balance */}
      <Card w={216}>
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
      </Card>

      {/* Eligibility Check */}
      <Card w={300}>
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
      </Card>

      {/* Mini calendar */}
      <Card w={300}>
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
      </Card>
    </div>
  );
}

export default function PdFloatingCards() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-[46%] z-0 w-screen max-w-[1600px] -translate-x-1/2 -translate-y-1/2"
    >
      {/* Edge fade so cards dissolve into the section rather than hard-cut */}
      <div
        className="overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%)",
        }}
      >
        {/* Two identical rows → a -50% marquee loops seamlessly. Reverse so
            the cards drift LEFT → RIGHT. Slow drift. */}
        <div
          className="animate-marquee flex w-max gap-5"
          style={{ animationDuration: "50s", animationDirection: "reverse" }}
        >
          <Row />
          <Row />
        </div>
      </div>
    </div>
  );
}
