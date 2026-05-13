import { COMPARISON_TABLE, type PDPProduct } from "@/lib/pdp-products";

interface ComparisonTableProps {
  active: PDPProduct["comparisonActive"];
}

const COLUMNS = [
  { key: "mounjaro", label: "Mounjaro", color: "#b39bb3" }, // lavender
  { key: "wegovy",   label: "Wegovy",   color: "#c9a78a" }, // tan
  { key: "saxenda",  label: "Saxenda",  color: "#84988b" }, // sage
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
    <div className="rounded-[24px] bg-[#f7f9f2] p-6 md:p-10 lg:p-12">
      <div className="flex flex-col items-center gap-2 pb-8 text-center md:pb-10">
        <h2 className="font-display text-[26px] font-semibold leading-[32px] tracking-[-0.025em] text-[#142e2a] md:text-[36px] md:leading-[44px]">
          Evidence-based comparison:
        </h2>
        <p className="font-serif italic text-[22px] leading-[28px] text-[#142e2a]/85 md:text-[30px] md:leading-[38px]">
          mounjaro, wegovy, and saxenda
        </p>
        <p className="mt-3 max-w-[640px] font-ui text-[14px] leading-[20px] tracking-[-0.01em] text-[#142e2a]/70 md:text-[15px] md:leading-[22px]">
          Review clinical insights on each treatment&rsquo;s effectiveness,
          typical weight-loss outcomes, and safety profile, all to help you
          make an informed choice.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left">
          <thead>
            <tr>
              <th className="w-[28%] py-3 align-bottom"></th>
              {COLUMNS.map((c) => {
                const isActive = c.key === active;
                return (
                  <th
                    key={c.key}
                    className={[
                      "w-[24%] px-4 pb-4 pt-3 align-bottom text-center",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "mx-auto inline-flex flex-col items-center gap-1 rounded-t-[12px] px-3 py-3",
                        isActive
                          ? "border-x-2 border-t-2 border-[#142e2a]"
                          : "",
                      ].join(" ")}
                      style={{ minWidth: 110 }}
                    >
                      <span
                        className="font-display text-[16px] font-bold leading-[20px] tracking-[-0.01em]"
                        style={{ color: c.color }}
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
                      "border-t border-[#142e2a]/10 px-4 py-4 font-ui text-[13px] font-semibold leading-[18px] text-[#142e2a] md:text-[14px]",
                    ].join(" ")}
                  >
                    {row.label}
                  </td>
                  {COLUMNS.map((c) => {
                    const value = row[c.key];
                    const isActive = c.key === active;
                    return (
                      <td
                        key={c.key}
                        className={[
                          "relative px-4 py-4 text-center font-ui text-[13px] font-medium leading-[18px] md:text-[14px]",
                          "border-t",
                          isActive
                            ? "border-[#142e2a]/0"
                            : "border-[#142e2a]/10",
                        ].join(" ")}
                        style={{
                          backgroundColor: `${c.color}26`, // 15% tint
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
    </div>
  );
}
