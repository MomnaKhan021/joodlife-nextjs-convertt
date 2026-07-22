"use client";

/**
 * Numbered pagination shared by the admin queues (Clinical, Marketing,
 * Dispatch, Dispatched): ‹ Prev · 1 2 3 4 5 · Next ›. Shows a sliding window
 * of up to five page numbers around the current page, with first/last always
 * reachable via the arrows. Renders nothing when there's a single page.
 */
export default function Pagination({
  page,
  totalPages,
  onPage,
  disabled = false,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
  disabled?: boolean;
}) {
  if (!Number.isFinite(totalPages) || totalPages <= 1) return null;

  // Sliding window of up to 5 numbers centred on the current page.
  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  const nums: number[] = [];
  for (let p = start; p <= end; p++) nums.push(p);

  const btn =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2.5 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => onPage(page - 1)}
        disabled={disabled || page <= 1}
        aria-label="Previous page"
        className={`${btn} border-[#142e2a]/15 bg-white text-[#142e2a] hover:bg-[#f7f9f2]`}
      >
        ‹
      </button>
      {start > 1 && (
        <>
          <button
            type="button"
            onClick={() => onPage(1)}
            disabled={disabled}
            className={`${btn} border-[#142e2a]/15 bg-white text-[#142e2a] hover:bg-[#f7f9f2]`}
          >
            1
          </button>
          {start > 2 && <span className="px-1 text-[13px] text-[#9ca3af]">…</span>}
        </>
      )}
      {nums.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPage(p)}
          disabled={disabled}
          aria-current={p === page ? "page" : undefined}
          className={`${btn} ${
            p === page
              ? "border-[#142e2a] bg-[#142e2a] text-white"
              : "border-[#142e2a]/15 bg-white text-[#142e2a] hover:bg-[#f7f9f2]"
          }`}
        >
          {p}
        </button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-[13px] text-[#9ca3af]">…</span>}
          <button
            type="button"
            onClick={() => onPage(totalPages)}
            disabled={disabled}
            className={`${btn} border-[#142e2a]/15 bg-white text-[#142e2a] hover:bg-[#f7f9f2]`}
          >
            {totalPages}
          </button>
        </>
      )}
      <button
        type="button"
        onClick={() => onPage(page + 1)}
        disabled={disabled || page >= totalPages}
        aria-label="Next page"
        className={`${btn} border-[#142e2a]/15 bg-white text-[#142e2a] hover:bg-[#f7f9f2]`}
      >
        ›
      </button>
    </nav>
  );
}
