import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import EligibilityCta from "@/components/ui/EligibilityCta";
import { FOUNDAYO } from "@/lib/foundayoContent";
import { ACCENT, BODY, BTN_DARK, BTN_TEXT, H2 } from "./type";

/**
 * "How does GLP-1 work?" — Figma 2003:1441 (1440×898, 30px corners) and
 * 2003:759 (mobile). Terracotta band, the half-glitter tablet in the middle
 * with four callouts on right-angle connectors.
 *
 * The callout layer is a box laid out in Figma coordinates — desktop
 * 1048×516 (the tablet's height, from x=196 in the frame), mobile 390×345 —
 * and every element is placed in percentages of it, so the layout scales
 * with the band instead of drifting off the tablet. Callouts 25/25.6
 * desktop, 16/19.2 mobile.
 */
type Edge = "tl" | "tr" | "bl" | "br";
type Conn = { x: number; y: number; w: number; h: number; borders: string; dot: Edge };
type Callout = { x: number; y: number; w: number; conn: Conn };

// Desktop box 1048×516. Connector borders draw the right angle; dot marks the
// end that touches the tablet. The pill is a 516px circle centred at x=537,
// so the two left connectors run to where the circle's edge actually is at
// their height rather than Figma's shorter ones (measured in the browser).
const DESKTOP = { W: 1048, H: 516, tablet: { x: 264, y: 0, w: 546, h: 516 } };
// QA: the labels sat too far from the tablet, so each side is pulled 70px
// in and its connector shortened to match — the dots stay on the pill.
const D: Callout[] = [
  { x: 70, y: 67, w: 156, conn: { x: 70, y: 127, w: 236, h: 30, borders: "border-l border-b", dot: "br" } },
  { x: 821, y: 74, w: 157, conn: { x: 752, y: 97, w: 61, h: 30, borders: "border-t border-l", dot: "bl" } },
  { x: 70, y: 417, w: 248, conn: { x: 70, y: 379, w: 246, h: 30, borders: "border-l border-t", dot: "tr" } },
  { x: 821, y: 417, w: 157, conn: { x: 758, y: 379, w: 73, h: 30, borders: "border-t border-r", dot: "tl" } },
];
// Mobile box 390×345 (full frame width); the tablet box is Figma's own
// 256×242 image frame, so the connectors land on it exactly as designed.
const MOBILE = { W: 390, H: 345, tablet: { x: 67, y: 31, w: 256, h: 242 } };
// QA: on phones two dots floated off the pill and two sat on its rim. Each
// dot now sits ~80px from the pill's centre (it's ~117px in radius, centred
// at 195,152 of this box), along its old direction, lines shortened to match.
const M: Callout[] = [
  { x: 20, y: 28, w: 89, conn: { x: 20, y: 73, w: 103, h: 43, borders: "border-l border-b", dot: "br" } },
  { x: 280, y: 4, w: 98, conn: { x: 215, y: 22, w: 58, h: 53, borders: "border-t border-l", dot: "bl" } },
  { x: 20, y: 305, w: 120, conn: { x: 20, y: 220, w: 133, h: 87, borders: "border-l border-t", dot: "tr" } },
  { x: 280, y: 295, w: 98, conn: { x: 256, y: 203, w: 79, h: 82, borders: "border-t border-r", dot: "tl" } },
];

const DOT: Record<Edge, string> = {
  tl: "-left-[3.5px] -top-[3.5px]",
  tr: "-right-[3.5px] -top-[3.5px]",
  bl: "-left-[3.5px] -bottom-[3.5px]",
  br: "-right-[3.5px] -bottom-[3.5px]",
};
const pct = (v: number, of: number) => `${(v / of) * 100}%`;

function Layer({ box, items, labels, textClass, prefix }: {
  box: typeof DESKTOP;
  items: Callout[];
  labels: string[];
  textClass: string;
  prefix: string;
}) {
  return (
    <>
      {items.map((k, i) => (
        <Reveal key={`${prefix}${i}`} as="div" delay={200 + i * 120} className="absolute inset-0">
          <span
            aria-hidden
            className={`absolute border-white ${k.conn.borders}`}
            style={{ left: pct(k.conn.x, box.W), top: pct(k.conn.y, box.H), width: pct(k.conn.w, box.W), height: pct(k.conn.h, box.H) }}
          >
            <span className={`absolute h-[7px] w-[7px] rounded-full bg-white ${DOT[k.conn.dot]}`} />
          </span>
          <p
            className={`absolute whitespace-pre-line text-white ${textClass}`}
            style={{ left: pct(k.x, box.W), top: pct(k.y, box.H), width: k.w }}
          >
            {labels[i]}
          </p>
        </Reveal>
      ))}
    </>
  );
}

export default function HowItWorks() {
  const c = FOUNDAYO.howItWorks;
  return (
    <section aria-label="How GLP-1 works" className="w-full bg-white">
      <div className="relative w-full overflow-hidden bg-[#c9694f] md:rounded-[30px]">
        {/* Figma fills this band with a textured terracotta photo, not a flat gradient. */}
        <Image src={c.background} alt="" aria-hidden fill sizes="100vw" className="object-cover object-center" quality={90} />
        <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-col px-4 pb-[46px] pt-[60px] md:px-10 md:pb-[60px] md:pt-[62px] lg:px-[60px]">
          <Reveal as="div" className="mx-auto max-w-[600px] text-center">
            <h2 className={`${H2} text-white`}>
              {c.heading}
              <br className="md:hidden" /> <em className={ACCENT}>{c.headingAccent}</em>
            </h2>
            <p className={`${BODY} mx-auto mt-[10px] max-w-[600px] text-white md:mt-3`}>{c.intro}</p>
          </Reveal>

          {/* Desktop: 1048×516 callout box */}
          <div
            className="relative mx-auto mt-4 hidden w-full max-w-[1048px] lg:block"
            style={{ aspectRatio: `${DESKTOP.W} / ${DESKTOP.H}` }}
          >
            <Reveal
              className="absolute"
              style={{ left: pct(DESKTOP.tablet.x, DESKTOP.W), top: 0, width: pct(DESKTOP.tablet.w, DESKTOP.W), height: "100%" }}
            >
              <div className="fnd-float relative h-full w-full">
                <Image src={c.image} alt="Daily weight loss tablet" fill sizes="(min-width:1024px) 546px, 70vw" className="object-contain drop-shadow-[0_30px_50px_rgba(90,30,20,0.35)]" quality={95} />
              </div>
            </Reveal>
            <Layer box={DESKTOP} items={D} labels={c.callouts} prefix="d" textClass="font-ui text-[25px] font-medium leading-[25.6px] tracking-[-0.5px]" />
          </div>

          {/* Mobile / tablet: 390×345 callout box, full frame width */}
          <div className="relative -mx-4 mt-4 lg:hidden" style={{ aspectRatio: `${MOBILE.W} / ${MOBILE.H}` }}>
            <Reveal
              className="absolute"
              style={{ left: pct(MOBILE.tablet.x, MOBILE.W), top: pct(MOBILE.tablet.y, MOBILE.H), width: pct(MOBILE.tablet.w, MOBILE.W), height: pct(MOBILE.tablet.h, MOBILE.H) }}
            >
              <div className="fnd-float relative h-full w-full">
                <Image src={c.image} alt="Daily weight loss tablet" fill sizes="70vw" className="object-contain drop-shadow-[0_20px_40px_rgba(90,30,20,0.35)]" quality={90} />
              </div>
            </Reveal>
            <Layer box={MOBILE} items={M} labels={c.callouts} prefix="m" textClass="font-ui text-[16px] font-medium leading-[19.2px] tracking-[-0.5px]" />
          </div>

          <Reveal as="div" delay={120} className="mx-auto mt-6 max-w-[730px] text-center md:mt-[34px]">
            <p className="font-ui text-[14px] leading-[16.8px] tracking-[-0.3px] text-white md:text-[16.3px] md:leading-[19.5px]">{c.body}</p>
            <div className="mt-[22px] grid grid-cols-2 gap-[12px] md:mt-5 md:flex md:justify-center">
              <EligibilityCta
                product="weight-loss"
                href={c.ctaHref}
                label={c.ctaLabel}
                className={`fnd-lift !h-[46px] !px-4 md:!h-[50px] md:w-[187px] ${BTN_DARK}`}
              />
              <a
                href={c.secondaryHref}
                className={`fnd-lift ${BTN_TEXT} inline-flex h-[46px] items-center justify-center rounded-lg border border-white bg-white/[0.06] px-4 text-white backdrop-blur-[33px] transition-colors hover:bg-white/15 md:h-[50px] md:w-[184px]`}
              >
                {c.secondaryLabel}
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
