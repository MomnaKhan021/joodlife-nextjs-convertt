import Reveal from "@/components/ui/Reveal";

/**
 * "Wegovy pill vs Wegovy injection" — Figma node 1:1676.
 * Cards container: 690px total (340px each + 10px gap), centred on page.
 * Card rows have fixed heights matching Figma exactly.
 */

type Row = { label: React.ReactNode; check?: boolean; minus?: boolean };

const PILL_ROWS: Row[] = [
  { label: (<span className="font-semibold text-[#00b67a]">Once daily</span>) },
  { label: "Oral tablet", check: true },
  { label: "Semaglutide", check: true },
  { label: "Clinically studied", check: true },
  { label: "Needle-free", check: true },
];

const PEN_ROWS: Row[] = [
  { label: (<span className="font-semibold">Once weekly</span>) },
  { label: "Injection pen", check: true },
  { label: "Semaglutide", check: true },
  { label: "Clinically studied", check: true },
  { label: "Weekly injection", minus: true },
];

/* Row min-heights — tighter on mobile, Figma values (127/81/97) at md+ */
const ROW_MIN = [
  "min-h-[96px] md:min-h-[127px]",
  "min-h-[68px] md:min-h-[81px]",
  "min-h-[78px] md:min-h-[97px]",
  "min-h-[78px] md:min-h-[97px]",
  "min-h-[78px] md:min-h-[97px]",
];

function PillIcon({ dark }: { dark?: boolean }) {
  return (
    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${dark ? "bg-white/15" : "bg-[#142e2a]/10"}`}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <ellipse cx="9" cy="12" rx="5" ry="8" stroke={dark ? "#fff" : "#142e2a"} strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
        <ellipse cx="15" cy="12" rx="5" ry="8" stroke={dark ? "#fff" : "#142e2a"} strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
      </svg>
    </span>
  );
}

function PenIcon({ dark }: { dark?: boolean }) {
  const c = dark ? "#fff" : "#142e2a";
  return (
    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${dark ? "bg-white/15" : "bg-[#142e2a]/10"}`}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M9 3h6M10 3v6.5L5.5 18a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 9.5V3" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
        <path d="M7.5 14h9" stroke={c} strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
      </svg>
    </span>
  );
}

function Tick({ dark }: { dark?: boolean }) {
  return (
    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${dark ? "bg-white/15" : "bg-[#142e2a]"}`}>
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path d="M2.5 6.2l2.2 2.2L9.5 3.6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function Minus() {
  return (
    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#142e2a]/25">
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path d="M3 6h6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function Card({
  title,
  rows,
  variant,
}: {
  title: string;
  rows: Row[];
  variant: "pill" | "pen";
}) {
  const dark = variant === "pill";
  return (
    <div className={`flex w-full flex-col overflow-hidden rounded-xl ${
      dark ? "bg-gradient-to-br from-[#42746d] to-[#142e2a] text-white" : "border border-[#142e2a]/12 bg-[#f7f9f2] text-[#142e2a]"
    }`}>
      {/* Title header — 87px */}
      <div
        className={`flex h-[64px] items-center justify-center px-3 text-center md:h-[87px] md:px-4 ${
          dark ? "border-b border-white/12" : "border-b border-[#142e2a]/10"
        }`}
      >
        <h3 className="font-ui text-[14px] font-semibold tracking-[-0.01em] sm:text-[15px] md:text-[18.8px]">{title}</h3>
      </div>

      <ul className="flex flex-col">
        {rows.map((r, i) => {
          const divider = i < rows.length - 1
            ? dark ? "border-b border-white/10" : "border-b border-[#142e2a]/8"
            : "";

          return (
            <li
              key={i}
              className={`flex flex-col items-center justify-center gap-2 px-3 text-center md:px-4 ${ROW_MIN[i]} ${divider}`}
            >
              {/* Row 0 (pricing): product icon above text */}
              {i === 0 && (variant === "pill" ? <PillIcon dark={dark} /> : <PenIcon dark={dark} />)}

              {/* Rows 1+ check / minus */}
              {i > 0 && r.check ? <Tick dark={dark} /> : null}
              {i > 0 && r.minus ? <Minus /> : null}

              <span className={`font-ui text-[12px] leading-[18px] md:text-[14px] md:leading-[20px] ${dark ? "text-white/90" : "text-[#142e2a]/90"}`}>
                {r.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Comparison() {
  return (
    <section
      aria-label="Wegovy pill versus Wegovy injection"
      className="w-full bg-white py-[30px] md:py-10"
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10 lg:px-[60px]">

        {/* Heading — 846px wide in Figma, centred */}
        <Reveal as="div">
          <h2 className="mb-5 text-center font-display text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#142e2a] md:text-[48px] md:leading-[52px]">
            Wegovy Tablet vs{" "}
            <span className="font-serif italic font-normal">
              Wegovy Injection
            </span>
          </h2>
          <p className="mx-auto mb-10 max-w-[620px] text-center font-ui text-[14px] leading-[20px] text-[#142e2a]/70 md:text-[16.3px] md:leading-[22px]">
            Both treatments contain semaglutide and are prescribed following a
            clinical assessment. The best option depends on your lifestyle,
            preferences and clinical suitability.
          </p>
        </Reveal>

        {/* Cards — 690px total (340 + 10 gap + 340), centred */}
        <Reveal as="div" delay={100}>
          <div className="mx-auto grid max-w-[690px] grid-cols-2 gap-[10px]">
            <Card title="Wegovy Tablet" rows={PILL_ROWS} variant="pill" />
            <Card title="Wegovy Injection" rows={PEN_ROWS} variant="pen" />
          </div>
        </Reveal>

        {/* Footer — 690px wide, centred */}
        <Reveal as="div" delay={150}>
          <div className="mx-auto mt-9 flex max-w-[690px] flex-col items-center gap-6">
            <a
              href="/consultation?product=weight-loss"
              className="inline-flex h-[50px] w-[220px] items-center justify-center rounded-lg bg-[#142e2a] font-ui text-[13px] font-semibold tracking-[-0.01em] text-white transition-colors hover:bg-[#0c2421]"
            >
              Compare Treatments
            </a>
          </div>
        </Reveal>

      </div>
    </section>
  );
}
