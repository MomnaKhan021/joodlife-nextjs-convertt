import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import EligibilityCta from "@/components/ui/EligibilityCta";
import { FOUNDAYO, type FoundayoRow } from "@/lib/foundayoContent";
import { ACCENT, BODY, BTN_DARK, H2, WRAP } from "./type";

/**
 * "Daily tablet or weekly injection?" — Figma 2003:1382 / 2003:711.
 * Two 340px cards (173px mobile), 10px apart: the tablet on a dark-green
 * gradient, the pen on #fff8f6. Header 88px, price 127px, frequency 59px,
 * then four 97px rows (mobile: 52 / 122 / 62 / 75). Card titles 18.8/22.5,
 * price + rows 16.8/22.5 (14/16.8 mobile). Mobile adds the "Taken" label.
 */
function Tick({ dark }: { dark?: boolean }) {
  return (
    <span className={`grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full ${dark ? "bg-white" : "bg-[#142e2a]"}`}>
      <svg width="13" height="13" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path d="M2.5 6.2l2.2 2.2L9.5 3.6" stroke={dark ? "#142e2a" : "#fff"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
function Dash() {
  return (
    <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full bg-[#a7a7a7]">
      <svg width="13" height="13" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path d="M3 6h6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </span>
  );
}

const ROW_TEXT = "font-ui text-[14px] leading-[16.8px] tracking-[-0.4px] md:text-[16.8px] md:leading-[22.5px]";

function Card({
  title, price, taken, takenLabel, rows, dark, icon,
}: {
  title: string;
  price: { prefix: string; amount: string; suffix: string };
  taken: string;
  takenLabel: string;
  rows: FoundayoRow[];
  dark: boolean;
  icon: React.ReactNode;
}) {
  const line = dark ? "border-white" : "border-black/[0.13]";
  return (
    <div
      className={`fnd-lift flex w-full flex-col overflow-hidden rounded-xl ${dark ? "text-white" : "bg-[#fff8f6] text-black"}`}
      style={dark ? { background: "linear-gradient(110deg, #13302b 0%, #1d4038 45%, #3f6f66 100%)" } : undefined}
    >
      <div className={`flex h-[52px] items-center justify-center border-b px-3 text-center md:h-[88px] ${line}`}>
        <h3 className="font-display text-[18.8px] !font-semibold leading-[22.5px] tracking-[-0.4px]">{title}</h3>
      </div>
      <ul className="flex flex-col">
        <li className={`flex min-h-[122px] flex-col items-center justify-center gap-[10px] border-b px-3 text-center md:min-h-[127px] md:px-6 ${line}`}>
          {icon}
          <p className={ROW_TEXT}>
            {price.prefix}
            <span className={`font-medium ${dark ? "text-[#b4ff9f]" : ""}`}>{price.amount}</span>
            {price.suffix}
          </p>
        </li>
        <li className={`flex min-h-[62px] flex-col items-center justify-center border-b px-3 text-center md:min-h-[59px] ${line}`}>
          <span className={`${ROW_TEXT} md:hidden`}>{takenLabel}</span>
          <span className={`${ROW_TEXT} font-medium ${dark ? "text-[#b4ff9f]" : ""}`}>{taken}</span>
        </li>
        {rows.map((r, i) => (
          <li
            key={r.label}
            className={`flex min-h-[75px] flex-col items-center justify-center gap-[10px] px-3 text-center md:min-h-[97px] ${i < rows.length - 1 ? `border-b ${line}` : ""}`}
          >
            {r.mark === "check" ? <Tick dark={dark} /> : <Dash />}
            <span className={ROW_TEXT}>{r.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Comparison() {
  const c = FOUNDAYO.comparison;
  return (
    <section aria-label="Daily tablet or weekly injection" className="w-full bg-white py-[30px] md:pb-20 md:pt-0">
      <div className={WRAP}>
        <Reveal as="div">
          <h2 className={`${H2} mb-[18px] text-center text-[#142e2a] md:mb-[37px]`}>
            {c.heading} <span className={ACCENT}>{c.headingAccent}</span>
          </h2>
        </Reveal>
        <Reveal as="div" delay={100}>
          <div className="mx-auto grid max-w-[690px] grid-cols-2 gap-[10px]">
            <Reveal direction="right">
              <Card
                title={c.pillTitle}
                price={c.pillPrice}
                taken={c.pillTaken}
                takenLabel={c.takenLabel}
                rows={c.pillRows}
                dark
                icon={<Image src="/assets/foundayo/cmp-tablet.webp" alt="Daily weight loss tablet" width={238} height={256} className="h-[44px] w-auto md:h-[60px]" />}
              />
            </Reveal>
            <Reveal direction="left" delay={140}>
              <Card
                title={c.penTitle}
                price={c.penPrice}
                taken={c.penTaken}
                takenLabel={c.takenLabel}
                rows={c.penRows}
                dark={false}
                icon={<Image src="/assets/foundayo/cmp-jood-pen.webp" alt="Weekly injection pen" width={212} height={256} className="h-[44px] w-auto md:h-[60px]" />}
              />
            </Reveal>
          </div>
        </Reveal>
        <Reveal as="div" delay={150}>
          <div className="mx-auto mt-[22px] flex max-w-[690px] flex-col items-center gap-[19px] md:mt-[39px] md:gap-[24px]">
            <p className={`${BODY} max-w-[490px] text-center text-[#142e2a]`}>{c.footnote}</p>
            <EligibilityCta
              product="weight-loss"
              href={c.ctaHref}
              label={c.ctaLabel}
              className={`w-full md:w-[222px] ${BTN_DARK}`}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
