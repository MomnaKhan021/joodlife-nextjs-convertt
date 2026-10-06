"use client";

/**
 * Prev / next button for the page's sliders. Swiper's Navigation module adds
 * `swiper-button-disabled` at either end of the track (and
 * `swiper-button-lock` when everything already fits), and those states are
 * hidden outright — so at the start only the right arrow shows, at the end
 * only the left, and both in between. Desktop only; phones swipe.
 *
 * Swiper is pointed at the button by id (`navigation={{ prevEl: "#id" }}`):
 * a string param stays stable across React re-renders, whereas refs read
 * during render are forbidden and objects rebuilt each render make Swiper
 * re-initialise navigation and lose the buttons.
 */
export default function SliderArrow({
  dir,
  id,
  className = "",
}: {
  dir: "prev" | "next";
  id: string;
  className?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      aria-label={dir === "prev" ? "Previous" : "Next"}
      className={`absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-[#142e2a]/15 bg-white text-[#142e2a] shadow-[0_8px_24px_-12px_rgba(20,46,42,0.45)] transition-colors hover:bg-[#f7f9f2] md:grid [&.swiper-button-disabled]:hidden [&.swiper-button-lock]:hidden ${className}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className={dir === "prev" ? "rotate-180" : ""}>
        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
