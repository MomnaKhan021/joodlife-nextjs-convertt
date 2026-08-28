import Link from "next/link";

/** "New" pill badge — peach on the dark bar, per the Figma announcement bar. */
function NewBadge() {
  return (
    <span
      className="inline-flex flex-shrink-0 items-center rounded-md bg-[#f7d3c1] px-2.5 py-0.5 font-ui text-[12px] font-semibold text-[#142e2a]"
      aria-hidden
    >
      New
    </span>
  );
}

export default function AnnouncementBar() {
  return (
    <div className="w-full bg-[#142e2a] text-white">
      {/* Desktop: 44px tall, padded horizontally */}
      <div className="hidden md:flex mx-auto h-11 w-full max-w-[1440px] items-center justify-center px-10 lg:px-20">
        <div className="flex items-center gap-3">
          <NewBadge />
          <Link href="/weight-loss" className="font-outfit text-sm leading-snug text-white hover:underline">
            Foundayo&reg; (oral tirzepatide) &ndash; a new tablet option for weight management is now available
          </Link>
        </div>
      </div>

      {/* Mobile: compact, text wraps to two lines */}
      <div className="flex md:hidden mx-auto w-full items-center justify-center px-4 py-2">
        <div className="flex items-center gap-2.5">
          <NewBadge />
          <Link href="/weight-loss" className="font-outfit text-[13px] leading-snug text-white hover:underline">
            Foundayo&reg; (oral tirzepatide) &ndash; a new tablet option for weight management is now available
          </Link>
        </div>
      </div>
    </div>
  );
}
