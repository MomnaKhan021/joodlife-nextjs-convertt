import Image from "next/image";

import { COMPARISON_TABLE, type PDPProduct } from "@/lib/pdp-products";

interface ComparisonTableProps {
  active: PDPProduct["comparisonActive"];
}

// Per-column palette matching the Figma: soft vertical gradients — blue,
// lavender and grey — with a readable label colour for each.
const COLUMNS = [
  { key: "wegovyTablet", label: "Wegovy Pills",     text: "#5f7fa6", from: "#dfe9f6", to: "#aec6e6", image: "/assets/wegovy/how-pill.png" },        // blue
  { key: "mounjaro",     label: "Mounjaro KwikPen", text: "#8a6b97", from: "#ece0f1", to: "#c9a9d6", image: "/assets/figma/pdp/mounjaro-1.png" },   // lavender
  { key: "wegovy",       label: "Wegovy Injection", text: "#7c8088", from: "#eaebee", to: "#c3c7cd", image: "/assets/figma/jood-injection-pen.png" }, // grey
] as const;

/**
 * Evidence-based comparison table — Figma 3:2179.
 *
 * The active product (per slug) gets a thicker dark-green outline.
 * Each column has a soft pastel background pulled from the Figma
 * column header pills.
 */
export default function ComparisonTable({ active }: ComparisonTableProps) {
  return (
    <div className="rounded-[24px] bg-[#f7f9f2] p-3 md:p-10 lg:p-12">
      <div className="flex flex-col items-center gap-2 pb-8 text-center md:pb-10">
        <h2 className="font-display text-[26px] font-semibold leading-[32px] tracking-[-0.025em] text-[#142e2a] md:text-[36px] md:leading-[44px]">
          Which treatment is right for you?
        </h2>
        <p className="mt-3 max-w-[640px] font-ui text-[14px] leading-[20px] tracking-[-0.01em] text-[#142e2a]/70 md:text-[15px] md:leading-[22px]">
          Compare our most popular weight loss treatments.
        </p>
      </div>

      {/* The table compresses to fit the viewport on mobile (no horizontal
          scroll, per Figma) and relaxes back to the roomy layout on md+. */}
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-left">
          <thead>
            <tr>
              <th className="w-[25%] py-3 align-bottom md:w-[28%]"></th>
              {COLUMNS.map((c) => {
                const isActive = c.key === active;
                return (
                  <th
                    key={c.key}
                    className={[
                      "w-[25%] px-1 pb-3 pt-3 align-bottom text-center md:w-[24%] md:px-4 md:pb-4",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "mx-auto inline-flex min-w-0 flex-col items-center gap-1 rounded-t-[12px] px-1.5 py-2 md:min-w-[110px] md:px-3 md:py-3",
                        isActive
                          ? "border-x-2 border-t-2 border-[#142e2a]"
                          : "",
                      ].join(" ")}
                    >
                      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[10px] bg-white/70 md:h-16 md:w-16">
                        <Image
                          src={c.image}
                          alt=""
                          fill
                          sizes="64px"
                          className="object-contain p-1"
                        />
                      </span>
                      <span
                        className="font-display text-[12px] font-bold leading-[15px] tracking-[-0.01em] md:text-[16px] md:leading-[20px]"
                        style={{ color: c.text }}
                      >
                        {c.label}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_TABLE.map((row, rowIdx) => {
              const isLast = rowIdx === COMPARISON_TABLE.length - 1;
              return (
                <tr key={row.label}>
                  <td
                    className={[
                      "border-t border-[#142e2a]/10 px-1.5 py-3 font-ui text-[11px] font-semibold leading-[15px] text-[#142e2a] md:px-4 md:py-4 md:text-[14px] md:leading-[18px]",
                    ].join(" ")}
                  >
                    {row.label}
                  </td>
                  {COLUMNS.map((c) => {
                    const value = row[c.key] ?? "";
                    const isActive = c.key === active;
                    return (
                      <td
                        key={c.key}
                        className={[
                          "relative px-1 py-3 text-center font-ui text-[11px] font-medium leading-[15px] md:px-4 md:py-4 md:text-[14px] md:leading-[18px]",
                          "border-t",
                          isActive
                            ? "border-[#142e2a]/0"
                            : "border-[#142e2a]/10",
                        ].join(" ")}
                        style={{
                          background: `linear-gradient(180deg, ${c.from}, ${c.to})`,
                        }}
                      >
                        {value}
                        {isActive ? (
                          <span
                            aria-hidden
                            className={[
                              "pointer-events-none absolute inset-x-0 top-0 border-[#142e2a]",
                              rowIdx === 0 ? "border-t-0" : "border-t-2",
                            ].join(" ")}
                          />
                        ) : null}
                        {/* Vertical outline on the active column */}
                        {isActive ? (
                          <>
                            <span
                              aria-hidden
                              className="pointer-events-none absolute inset-y-0 left-0 border-l-2 border-[#142e2a]"
                            />
                            <span
                              aria-hidden
                              className="pointer-events-none absolute inset-y-0 right-0 border-r-2 border-[#142e2a]"
                            />
                            {isLast ? (
                              <span
                                aria-hidden
                                className="pointer-events-none absolute inset-x-0 bottom-0 border-b-2 border-[#142e2a]"
                              />
                            ) : null}
                          </>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-6 max-w-[720px] font-ui text-[13px] leading-[20px] tracking-[-0.01em] text-[#142e2a]/70 md:mt-8 md:text-[14px]">
        Our UK clinicians will recommend the most appropriate treatment
        following an individual clinical assessment.
      </p>
    </div>
  );
}
