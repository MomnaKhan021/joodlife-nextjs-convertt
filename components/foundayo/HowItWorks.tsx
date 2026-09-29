import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import EligibilityCta from "@/components/ui/EligibilityCta";
import { FOUNDAYO } from "@/lib/foundayoContent";

/**
 * "How does foundayo work?" — full-width terracotta card (r=32) with the
 * half-glitter tablet in the middle and four callouts joined to it by
 * right-angle connectors. Same overlay on mobile at a smaller scale.
 */
const Line = ({ d, w, h, dot }: { d: string; w: number; h: number; dot: [number, number] }) => (
  <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" className="block" aria-hidden>
    <path d={d} stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx={dot[0]} cy={dot[1]} r="2.5" fill="white" />
  </svg>
);

const CALLOUTS = [
  { pos: "left-[16%] top-[22%]", mPos: "left-[2%] top-[20%]", align: "items-start text-left", after: true,
    d: <Line d="M1 2 V32 H188" w={200} h={46} dot={[188, 32]} />, m: <Line d="M1 2 V22 H88" w={100} h={32} dot={[88, 22]} /> },
  { pos: "right-[14%] top-[22%]", mPos: "right-[2%] top-[20%]", align: "items-end text-right", after: true,
    d: <Line d="M199 2 V32 H12" w={200} h={46} dot={[12, 32]} />, m: <Line d="M99 2 V22 H12" w={100} h={32} dot={[12, 22]} /> },
  { pos: "left-[16%] bottom-[16%]", mPos: "left-[2%] bottom-[14%]", align: "items-start text-left", after: false,
    d: <Line d="M1 44 V14 H188" w={200} h={46} dot={[188, 14]} />, m: <Line d="M1 30 V10 H88" w={100} h={32} dot={[88, 10]} /> },
  { pos: "right-[14%] bottom-[16%]", mPos: "right-[2%] bottom-[14%]", align: "items-end text-right", after: false,
    d: <Line d="M199 44 V14 H12" w={200} h={46} dot={[12, 14]} />, m: <Line d="M99 30 V10 H12" w={100} h={32} dot={[12, 10]} /> },
];

export default function HowItWorks() {
  const c = FOUNDAYO.howItWorks;
  return (
    <section aria-label="How Foundayo works" className="w-full bg-white px-0 py-[30px] md:px-10 md:py-10 lg:px-[60px]">
      <div
        className="relative mx-auto w-full max-w-[1320px] overflow-hidden rounded-[24px] md:rounded-[32px]"
        style={{ background: "radial-gradient(120% 90% at 50% 60%, #e68d72 0%, #d3735a 45%, #b3533d 100%)" }}
      >
        <div className="relative z-10 flex flex-col px-5 py-10 md:px-[60px] md:py-[60px]">
          <Reveal as="div" className="mx-auto max-w-[640px] text-center">
            <h2 className="font-display text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-white md:text-[48px] md:leading-[52px]">
              {c.heading} <em className="font-serif font-normal italic">{c.headingAccent}</em>
            </h2>
            <p className="mx-auto mt-3 max-w-[560px] font-ui text-[13.5px] leading-[19px] text-white/90 md:mt-4 md:text-[15px] md:leading-[22px]">{c.intro}</p>
          </Reveal>

          {/* tablet + callouts */}
          <div className="relative mx-auto mt-2 w-full max-w-[1000px] py-5 md:mt-4 md:min-h-[320px] md:py-0">
            <div className="relative mx-auto aspect-square w-[58%] max-w-[560px] md:w-[56%]">
              <Image src={c.image} alt="Foundayo tablet" fill sizes="(max-width:768px) 62vw, 560px" className="object-contain drop-shadow-[0_30px_50px_rgba(90,30,20,0.35)]" />
            </div>
            {CALLOUTS.map((k, i) => (
              <div key={i} className={`absolute ${k.pos} hidden max-w-[220px] flex-col lg:flex ${k.align}`}>
                {!k.after && k.d}
                <p className="whitespace-pre-line font-ui text-[18px] font-semibold leading-[24px] text-white">{c.callouts[i]}</p>
                {k.after && k.d}
              </div>
            ))}
            <div className="absolute inset-0 lg:hidden">
              {CALLOUTS.map((k, i) => (
                <div key={`m-${i}`} className={`absolute ${k.mPos} flex max-w-[120px] flex-col ${k.align}`}>
                  {!k.after && k.m}
                  <p className="whitespace-pre-line font-ui text-[11px] font-semibold leading-[14px] text-white sm:text-[13px] sm:leading-[17px]">{c.callouts[i]}</p>
                  {k.after && k.m}
                </div>
              ))}
            </div>
          </div>

          <Reveal as="div" delay={120} className="mx-auto mt-6 max-w-[720px] text-center">
            <p className="font-ui text-[12.5px] leading-[18px] text-white/90 md:text-[14px] md:leading-[20px]">{c.body}</p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <EligibilityCta
                product="weight-loss"
                href={c.ctaHref}
                label={c.ctaLabel}
                className="inline-flex h-[46px] items-center justify-center rounded-lg bg-[#142e2a] px-8 font-ui text-[14px] font-semibold tracking-[-0.01em] text-white transition-colors hover:bg-[#0c2421] md:h-[50px] md:px-9"
              />
              <a href={c.secondaryHref} className="inline-flex h-[46px] items-center justify-center rounded-lg border border-white/50 px-8 font-ui text-[14px] font-semibold tracking-[-0.01em] text-white transition-colors hover:bg-white/10 md:h-[50px] md:px-9">
                {c.secondaryLabel}
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
