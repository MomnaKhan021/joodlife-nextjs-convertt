import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import EligibilityCta from "@/components/ui/EligibilityCta";
import { FOUNDAYO, type FoundayoRow } from "@/lib/foundayoContent";

/**
 * "Foundayo pill vs Wegovy injection" — two 340px cards centred: the pill on a
 * green gradient, the pen on light pink. Price row, "Taken" row, then four
 * tick / dash rows with matching heights so the cards line up.
 */
function Tick({ dark }: { dark?: boolean }) {
  return (
    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${dark ? "bg-white" : "bg-[#142e2a]"}`}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path d="M2.5 6.2l2.2 2.2L9.5 3.6" stroke={dark ? "#142e2a" : "#fff"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
function Dash() {
  return (
    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#c9c9c9]">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path d="M3 6h6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function Card({
  title, price, taken, rows, dark, icon,
}: {
  title: string;
  price: { prefix: string; amount: string; suffix: string };
  taken: { label: string; value: string };
  rows: FoundayoRow[];
  dark: boolean;
  icon: React.ReactNode;
}) {
  const line = dark ? "border-white/12" : "border-[#142e2a]/10";
  const muted = dark ? "text-white/85" : "text-[#142e2a]/80";
  return (
    <div
      className={`fnd-lift flex w-full flex-col overflow-hidden rounded-xl ${dark ? "text-white" : "bg-[#fbf3ef] text-[#142e2a]"}`}
      style={dark ? { background: "linear-gradient(180deg, #3f6f67 0%, #23473f 45%, #142e2a 100%)" } : undefined}
    >
      <div className={`flex h-[60px] items-center justify-center border-b px-3 text-center md:h-[87px] ${line}`}>
        <h3 className="font-ui text-[14px] font-semibold tracking-[-0.01em] md:text-[16px]">{title}</h3>
      </div>
      <ul className="flex flex-col">
        <li className={`flex min-h-[104px] flex-col items-center justify-center gap-2 border-b px-3 text-center md:min-h-[127px] md:px-5 ${line}`}>
          {icon}
          <p className={`font-ui text-[12px] leading-[17px] md:text-[13px] md:leading-[18px] ${muted}`}>
            {price.prefix}
            <strong className={dark ? "font-semibold text-[#b4ff9f]" : "font-semibold text-[#142e2a]"}>{price.amount}</strong>
            {price.suffix}
          </p>
        </li>
        <li className={`flex min-h-[64px] flex-col items-center justify-center border-b px-3 text-center md:min-h-[81px] ${line}`}>
          <span className={`font-ui text-[11.5px] md:text-[12.5px] ${dark ? "text-white/70" : "text-[#142e2a]/60"}`}>{taken.label}</span>
          <span className={`font-ui text-[12.5px] font-semibold md:text-[14px] ${dark ? "text-[#b4ff9f]" : "text-[#142e2a]"}`}>{taken.value}</span>
        </li>
        {rows.map((r, i) => (
          <li
            key={r.label}
            className={`flex min-h-[72px] flex-col items-center justify-center gap-2 px-3 text-center md:min-h-[97px] ${i < rows.length - 1 ? `border-b ${line}` : ""}`}
          >
            {r.mark === "check" ? <Tick dark={dark} /> : <Dash />}
            <span className={`font-ui text-[12px] leading-[16px] md:text-[13px] md:leading-[18px] ${muted}`}>{r.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Comparison() {
  const c = FOUNDAYO.comparison;
  return (
    <section aria-label="Foundayo pill versus Wegovy injection" className="w-full bg-white py-[30px] md:py-10">
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10 lg:px-[60px]">
        <Reveal as="div">
          <h2 className="mb-6 text-center font-display text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#142e2a] md:mb-8 md:text-[48px] md:leading-[52px]">
            {c.heading} <span className="font-serif font-normal italic">{c.headingAccent}</span>
          </h2>
        </Reveal>
        <Reveal as="div" delay={100}>
          <div className="mx-auto grid max-w-[690px] grid-cols-2 gap-[10px]">
            <Reveal direction="right">
              <Card
                title={c.pillTitle}
                price={c.pillPrice}
                taken={c.pillTaken}
                rows={c.pillRows}
                dark
                icon={<Image src="/assets/foundayo/pill-white.png" alt="" width={28} height={22} className="h-[22px] w-auto" />}
              />
            </Reveal>
            <Reveal direction="left" delay={140}>
              <Card
                title={c.penTitle}
                price={c.penPrice}
                taken={c.penTaken}
                rows={c.penRows}
                dark={false}
                icon={<Image src="/assets/foundayo/pen.png" alt="" width={28} height={28} className="h-7 w-auto" />}
              />
            </Reveal>
          </div>
        </Reveal>
        <Reveal as="div" delay={150}>
          <div className="mx-auto mt-8 flex max-w-[690px] flex-col items-center gap-6">
            <p className="max-w-[560px] text-center font-ui text-[13.5px] leading-[19px] text-[#142e2a]/75 md:text-[14px]">{c.footnote}</p>
            <EligibilityCta
              product="weight-loss"
              href={c.ctaHref}
              label={c.ctaLabel}
              className="inline-flex h-[50px] w-full max-w-[250px] items-center justify-center rounded-lg bg-[#142e2a] font-ui text-[14px] font-semibold tracking-[-0.01em] text-white transition-colors hover:bg-[#0c2421]"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
