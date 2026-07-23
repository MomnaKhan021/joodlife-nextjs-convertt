import Image from "next/image";
import Link from "next/link";

/**
 * "Our Treatments" mega menu (Figma — Mega Menu file).
 *
 * Shared treatment data drives both the desktop hover panel (this file) and
 * the mobile drawer list (rendered in Header). "Explore More" / "Explore
 * Treatment" route to /shop, where every product is listed.
 */
export type Treatment = {
  label: string;
  desc: string;
  href: string;
  icon: string;
};

export const TREATMENTS: Treatment[] = [
  {
    label: "Weight loss",
    desc: "Sustainable fat reduction",
    href: "/wegovy-pills",
    icon: "/assets/megamenu/treat-wl.png",
  },
  {
    label: "Erectile dysfunction",
    desc: "Improved sexual performance",
    href: "/erectile-dysfunction",
    icon: "/assets/megamenu/treat-ed.png",
  },
  {
    label: "Period Delay",
    desc: "Delay menstrual cycle",
    href: "/period-delay",
    icon: "/assets/megamenu/treat-pd.png",
  },
];

const PROMO_BULLETS = [
  "Lose up to 27% body weight",
  "Plans tailored to you",
  "Guidance for lasting results",
];

function CheckBadge() {
  return (
    <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-white/20">
      <svg width="9" height="7" viewBox="0 0 9 7" fill="none" aria-hidden>
        <path
          d="M1 3.5L3.3 5.8L8 1"
          stroke="#ffffff"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/** Desktop mega-menu panel content. */
export default function MegaMenu({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_540px]">
      {/* Treatment links */}
      <div className="flex flex-col">
        <p className="mb-3 font-display text-[18px] font-semibold tracking-[-0.01em] text-[#142e2a]">
          Our Treatments
        </p>
        <ul className="flex flex-col">
          {TREATMENTS.map((t) => (
            <li key={t.href}>
              <Link
                href={t.href}
                onClick={onNavigate}
                className="group/mm flex items-center gap-4 rounded-2xl p-3 transition-colors hover:bg-[#f7f9f2]"
              >
                <span className="relative h-[64px] w-[64px] shrink-0 overflow-hidden rounded-2xl">
                  <Image src={t.icon} alt="" fill sizes="64px" className="object-cover" />
                </span>
                <span className="flex-1">
                  <span className="block font-ui text-[16px] font-semibold text-[#142e2a]">
                    {t.label}
                  </span>
                  <span className="block font-ui text-[14px] text-[#142e2a]/60">
                    {t.desc}
                  </span>
                </span>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#f1f3ee] text-[#142e2a] transition-colors group-hover/mm:bg-[#142e2a] group-hover/mm:text-white">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path
                      d="M4.5 11.5L11.5 4.5M11.5 4.5H6M11.5 4.5V10"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Weight-loss promo card → shop (all products) */}
      <Link
        href="/shop"
        onClick={onNavigate}
        className="group/promo relative flex min-h-[260px] overflow-hidden rounded-[20px] bg-[#142e2a] p-7"
      >
        <div className="relative z-10 flex max-w-[58%] flex-col">
          <h3 className="font-display text-[26px] font-semibold leading-[1.1] tracking-[-0.02em] text-white">
            Weight loss,
            <br />
            <em className="font-serif font-normal italic">made for you.</em>
          </h3>
          <ul className="mt-4 flex flex-col gap-2.5">
            {PROMO_BULLETS.map((b) => (
              <li key={b} className="flex items-center gap-2 font-ui text-[13px] text-white/85">
                <CheckBadge />
                {b}
              </li>
            ))}
          </ul>
          <span className="mt-6 inline-flex h-11 w-fit items-center justify-center rounded-lg bg-white px-6 font-ui text-[14px] font-semibold text-[#142e2a] transition-shadow duration-200 group-hover/promo:shadow-[0_8px_20px_rgba(0,0,0,0.25)]">
            Explore More
          </span>
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 z-0 w-[46%]">
          <Image
            src="/assets/megamenu/promo-pens.png"
            alt=""
            fill
            sizes="300px"
            className="object-contain object-bottom"
          />
        </div>
      </Link>
    </div>
  );
}
