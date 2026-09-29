import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import EligibilityCta from "@/components/ui/EligibilityCta";
import { FOUNDAYO } from "@/lib/foundayoContent";

/**
 * "Foundayo pill dosing & pricing" — intro copy with the hand-and-tablet image
 * on the right, four dose cards on light pink, then the commit-and-save bar.
 */
export default function Dosing() {
  const c = FOUNDAYO.dosing;
  return (
    <section aria-label="Foundayo pill dosing and pricing" className="w-full bg-white py-[30px] md:py-10">
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10 lg:px-[60px]">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
          <div>
            <Reveal as="div">
              <h2 className="font-display text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#142e2a] md:text-[48px] md:leading-[52px]">
                <span className="font-serif font-normal italic">{c.heading}</span> {c.headingAccent}
              </h2>
              <p className="mt-4 max-w-[640px] font-ui text-[14px] leading-[20px] text-[#142e2a]/75 md:text-[15px] md:leading-[22px]">{c.body}</p>
            </Reveal>

            <Reveal as="div" delay={120} className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4">
              {c.doses.map((d) => (
                <div key={d.mg} className="relative flex flex-col items-center gap-1 rounded-2xl bg-[#fbf3ef] px-3 pb-5 pt-7 text-center">
                  {d.start ? (
                    <span className="absolute -top-2.5 rounded-full bg-[#142e2a] px-3 py-1 font-ui text-[10px] font-semibold text-[#b4ff9f]">
                      {c.startBadge}
                    </span>
                  ) : null}
                  <span className="font-display text-[22px] font-semibold leading-none text-[#142e2a] md:text-[24px]">{d.mg}</span>
                  <span className="mt-1 font-ui text-[12px] text-[#142e2a]/70">{d.label}</span>
                  <span className="font-ui text-[11px] text-[#142e2a]/55">{d.days}</span>
                  <span className="mt-3 font-ui text-[14px] font-semibold text-[#142e2a]">
                    {d.price}<span className="font-normal text-[#142e2a]/60">/mo</span>
                  </span>
                </div>
              ))}
            </Reveal>

            <Reveal as="div" delay={160} className="mt-4">
              <div
                className="flex flex-col gap-4 rounded-2xl px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between"
                style={{ background: "linear-gradient(90deg, #143b36 0%, #1d4b43 100%)" }}
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-35 12 12)" stroke="#fff" strokeWidth="1.8" /><path d="M9.5 7.5l5 9" stroke="#fff" strokeWidth="1.8" /></svg>
                  </span>
                  <div>
                    <p className="font-ui text-[15px] font-semibold">{c.commitTitle}</p>
                    <p className="font-ui text-[12px] text-white/80">{c.commitBody}</p>
                  </div>
                </div>
                <EligibilityCta
                  product="weight-loss"
                  href={c.commitHref}
                  label={c.commitCta}
                  className="inline-flex h-[44px] shrink-0 items-center justify-center rounded-lg bg-white px-6 font-ui text-[13px] font-semibold text-[#142e2a] transition-colors hover:bg-[#daffe0]"
                />
              </div>
            </Reveal>
          </div>

          <Reveal as="div" delay={100} className="hidden lg:block">
            <div className="relative aspect-[440/400] w-full">
              <Image src={c.image} alt={c.imageAlt} fill sizes="440px" className="object-contain object-right-top" />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
