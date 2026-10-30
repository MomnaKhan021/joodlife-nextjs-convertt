import Image from "next/image";

import LpSlider from "@/components/lp/LpSlider";
import { LpVerified, rawImage } from "@/components/lp/shared";
import type { LanderResults } from "@/lib/landerContentTypes";

function Photo({ src, label, after, alt }: { src: string; label: string; after?: boolean; alt: string }) {
  return (
    <div className="relative aspect-[252/315] flex-1 overflow-hidden rounded-[10px] bg-[#e7ecd7]">
      {src ? (
        <Image src={src} alt={alt} fill unoptimized={rawImage(src)} sizes="(max-width: 640px) 45vw, 200px" className="object-cover" quality={90} />
      ) : null}
      {label ? (
        <span
          className={`absolute left-[8px] top-[8px] rounded-full px-[10px] py-[2px] font-ui text-[11px] font-medium leading-[17px] ${
            after ? "bg-[#b4ff9f] text-[#13332b]" : "bg-[rgba(16,37,31,0.8)] text-white"
          }`}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}

/**
 * "Real patients, real journeys." before/after slider for the checkout's
 * order-summary column — the same cards (and CMS content, from
 * /cms/weight-loss-lander) as the ads lander's results section, sized for
 * the narrow column.
 */
export default function CheckoutResults({ content: c }: { content: LanderResults }) {
  const items = c.items.filter((r) => r.before || r.after);
  if (items.length === 0) return null;
  return (
    <section
      aria-label="Patient results"
      className="flex flex-col items-center gap-[18px] overflow-hidden rounded-[24px] bg-white px-4 py-6 md:px-5"
    >
      <h2 className="text-center font-display text-[26px] !font-semibold leading-[30px] tracking-[-0.8px] text-[#142e2a]">
        {c.heading}
        {c.headingAccent ? (
          <>
            {" "}
            <em className="font-serif font-normal italic">{c.headingAccent}</em>
          </>
        ) : null}
      </h2>

      {/* Phones: one card with the next peeking in. Tablets (full-width
          column): fixed-width cards so the photos don't grow huge. Desktop
          (460px summary column): one card with the next peeking in. */}
      <LpSlider gap={12} itemClassName="w-[88%] sm:w-[340px] lg:w-[88%]">
        {items.map((r, i) => (
          <article key={`${r.name}-${i}`} className="flex w-full flex-col gap-[12px] rounded-[18px] bg-[#f7f9f2] p-[10px]">
            <div className="flex gap-[6px]">
              <Photo src={r.before} label={r.beforeLabel} alt={`${r.name} before treatment`} />
              <Photo src={r.after} label={r.afterLabel} after alt={`${r.name} after treatment`} />
            </div>

            <div className="flex items-start gap-[12px]">
              {r.lost || r.detail ? (
                <div className="flex w-[104px] shrink-0 flex-col items-center justify-center gap-[4px] self-stretch rounded-[10px] bg-white px-[8px] py-[12px]">
                  <p className="whitespace-nowrap font-serif text-[34px] leading-[40px] tracking-[-2px] text-[#13332b]">{r.lost}</p>
                  <p className="text-center font-ui text-[12px] leading-[16px] text-[#142e2a]/80">{r.detail}</p>
                </div>
              ) : null}

              <div className="flex flex-1 flex-col gap-[10px]">
                <div className="flex flex-col gap-[4px] font-ui font-medium">
                  <p className="text-[13px] leading-[20px] text-[#10251f]">{r.name}</p>
                  <p className="text-[14px] leading-[18.5px] tracking-[-0.3px] text-[#142e2a]">{r.quote}</p>
                </div>
                <LpVerified size={13} />
              </div>
            </div>
          </article>
        ))}
      </LpSlider>
    </section>
  );
}
