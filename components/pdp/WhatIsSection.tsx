import WeightLossGraph from "./WeightLossGraph";
import { CheckCircleIcon, MeasureIcon } from "./PdpIcons";
import type { PDPProduct } from "@/lib/pdp-products";

interface WhatIsSectionProps {
  product: PDPProduct;
}

/**
 * "What is X?" section — Figma 3:1976.
 *
 * Two-column layout: copy block on the left, animated graph on the
 * right. On mobile the graph drops below the copy block.
 */
export default function WhatIsSection({ product }: WhatIsSectionProps) {
  return (
    <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-12 lg:gap-16">
      {/* LEFT — copy block */}
      <div className="flex flex-col gap-6">
        <h2 className="font-display text-[34px] font-semibold leading-[38px] tracking-[-0.02em] text-[#142e2a] md:text-[44px] md:leading-[48px]">
          {product.whatIsTitle.split(" ").slice(0, -1).join(" ")}{" "}
          <em className="font-serif italic font-normal">
            {product.whatIsTitle.split(" ").slice(-1).join(" ").replace("?", "")}
            ?
          </em>
        </h2>

        <p
          className="font-ui text-[15px] leading-[24px] tracking-[-0.01em] text-[#142e2a]/85 md:text-[16px] md:leading-[26px]"
          dangerouslySetInnerHTML={{ __html: product.whatIsBody }}
        />

        {/* Callout */}
        <div className="flex items-start gap-4 rounded-[14px] bg-[#f7f9f2] px-5 py-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white">
            <MeasureIcon />
          </span>
          <p className="font-ui text-[14px] leading-[20px] text-[#142e2a]/85 md:text-[15px] md:leading-[22px]">
            {product.whatIsCallout}
          </p>
        </div>

        {/* Bullets — 2 column grid */}
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-6">
          {product.whatIsBullets.map((b) => (
            <li
              key={b}
              className="flex items-start gap-2 font-ui text-[14px] font-semibold leading-[20px] text-[#142e2a] md:text-[15px]"
            >
              <span className="mt-0.5 shrink-0">
                <CheckCircleIcon size={18} />
              </span>
              {b}
            </li>
          ))}
        </ul>

        <a
          href="/consultation"
          className="inline-flex h-[50px] w-full max-w-[200px] items-center justify-center rounded-lg bg-[#142e2a] px-6 font-ui text-[13px] font-semibold uppercase tracking-[0.06em] text-white transition-colors duration-200 hover:bg-[#0c2421]"
        >
          Get started
        </a>
      </div>

      {/* RIGHT — animated graph */}
      <WeightLossGraph
        points={product.graph.points}
        yLabels={product.graph.yLabels}
        xLabels={product.graph.xLabels}
        callout={product.graph.callout}
      />
    </div>
  );
}
